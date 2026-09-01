/**
 * Consultas del motor de reservas que tocan la base de datos.
 *
 * Aparte de las reglas puras (`holds.ts`, `guest.ts`, `code.ts`) para que esas
 * se puedan probar sin red, y aparte de la Server Action para que la acción se
 * lea como lo que es: una secuencia de pasos con nombre.
 *
 * Todo lo de aquí usa la CLAVE DE SERVICIO. Es imprescindible: RLS le niega
 * `bookings` entera al rol `anon` (y así debe seguir, porque la tabla guarda
 * nombre, correo y teléfono), pero la solicitud la envía un visitante sin
 * sesión. La contrapartida es que estas funciones no devuelven jamás un dato
 * personal hacia el navegador: la comprobación de disponibilidad devuelve un
 * booleano.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { parseDateRange, rangesOverlap } from "../dates";
import { generateBookingCode } from "./code";
import { occupiesCalendar } from "./holds";
import {
  isBookingCodeCollision,
  isExclusionViolation,
  type BookingFailure,
} from "./result";

/* ---------------------------------------------------------------------------
 * Disponibilidad
 * ------------------------------------------------------------------------- */

/**
 * ¿Alguna noche de `[checkIn, checkOut)` está ocupada?
 *
 * Devuelve un booleano y nada más: quién ocupa las fechas es asunto del panel,
 * no del visitante. Aplica la regla del hold (`occupiesCalendar`) en memoria,
 * igual que el endpoint de disponibilidad y el exportador iCal, para que los
 * tres den exactamente la misma respuesta.
 *
 * OJO: esto es una comprobación PREVIA, no una garantía. Entre ella y el
 * INSERT cabe otra transacción; quien garantiza que no haya dos reservas
 * cruzadas es la restricción `bookings_no_overlap` de Postgres.
 */
export async function rangeIsTaken(
  supabase: SupabaseClient,
  accommodationId: string,
  checkIn: string,
  checkOut: string,
  now: Date = new Date(),
): Promise<boolean> {
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("status, expires_at")
    .eq("accommodation_id", accommodationId)
    .neq("status", "cancelled")
    .lt("check_in", checkOut)
    .gt("check_out", checkIn);

  if (bookingsError) {
    // Sin respuesta fiable se responde "ocupado". Preferimos rechazar una
    // solicitud legítima (el huésped reintenta o escribe por WhatsApp) antes
    // que aceptar una que solape con otra reserva.
    console.error("[reservas] comprobando disponibilidad:", bookingsError.message);
    return true;
  }

  const taken = (bookings ?? []).some((row) =>
    occupiesCalendar(
      {
        status: String(row.status),
        expires_at: (row.expires_at as string | null) ?? null,
      },
      now,
    ),
  );
  if (taken) return true;

  const { data: blocks, error: blocksError } = await supabase
    .from("blocked_dates")
    .select("date_range")
    .eq("accommodation_id", accommodationId);

  if (blocksError) {
    console.error("[reservas] comprobando bloqueos:", blocksError.message);
    return true;
  }

  return (blocks ?? []).some((row) => {
    const parsed = parseDateRange(row.date_range);
    if (!parsed) return false;
    return rangesOverlap(checkIn, checkOut, parsed.start, parsed.end);
  });
}

/* ---------------------------------------------------------------------------
 * Inserción con código único
 * ------------------------------------------------------------------------- */

/** Fila que se va a insertar, sin el código (lo pone esta función). */
export type BookingInsert = {
  accommodation_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_cop: number;
  status: string;
  source: string;
  notes: string | null;
  locale: string;
  expires_at: string | null;
};

export type InsertOutcome =
  | { ok: true; id: string; code: string }
  | { ok: false; failure: BookingFailure };

/**
 * Cuántas veces se sortea un código nuevo antes de rendirse.
 *
 * Con 923.521 combinaciones posibles y unos miles de reservas, la probabilidad
 * de fallar tres veces seguidas es del orden de una en 10^14. El bucle existe
 * porque "improbable" no es "imposible", no porque se espere usarlo.
 */
const CODE_ATTEMPTS = 4;

/**
 * Inserta la reserva generando un `booking_code` único.
 *
 * La unicidad NO se comprueba con un SELECT previo: entre el SELECT y el
 * INSERT cabe otra solicitud con el mismo sorteo. Se inserta a pelo y se deja
 * que hable el índice único; si choca (`23505` sobre `booking_code`), se
 * sortea otro y se reintenta. Es el único patrón correcto bajo concurrencia.
 *
 * El otro error que se distingue es `23P01`, la restricción anti-solape: ese
 * NO se reintenta, significa que alguien se quedó con las fechas.
 */
export async function insertBookingWithCode(
  supabase: SupabaseClient,
  payload: BookingInsert,
  nextCode: () => string = generateBookingCode,
): Promise<InsertOutcome> {
  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
    const code = nextCode();

    const { data, error } = await supabase
      .from("bookings")
      .insert({ ...payload, booking_code: code })
      .select("id")
      .single();

    if (!error) {
      return { ok: true, id: String(data.id), code };
    }

    if (isBookingCodeCollision(error)) {
      console.warn(`[reservas] código ${code} repetido, sorteando otro.`);
      continue;
    }

    if (isExclusionViolation(error)) {
      return { ok: false, failure: "dates-taken" };
    }

    console.error("[reservas] no se pudo crear la reserva:", error.message);
    return { ok: false, failure: "server" };
  }

  console.error(
    `[reservas] ${CODE_ATTEMPTS} códigos seguidos repetidos: revisar el generador.`,
  );
  return { ok: false, failure: "server" };
}
