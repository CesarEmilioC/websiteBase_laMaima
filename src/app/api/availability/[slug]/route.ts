/**
 * GET /api/availability/[slug]
 *
 * Devuelve los tramos de fechas OCUPADAS de un alojamiento para los próximos
 * doce meses, y nada más:
 *
 *   { "slug": "casa-maima",
 *     "from": "2026-08-18", "to": "2027-08-18",
 *     "occupied": [{ "from": "2026-09-04", "to": "2026-09-07" }] }
 *
 * Por qué existe este endpoint en vez de leer los datos en la página:
 *
 *   1. PRIVACIDAD. `bookings` guarda nombre, correo y teléfono del huésped, y
 *      RLS se la niega entera al rol `anon` (ver supabase/schema.sql). Aquí se
 *      lee con la clave de servicio, pero solo las dos columnas de fecha, y se
 *      publica el resultado ya anonimizado: un hueco en el calendario no dice
 *      quién lo ocupa ni por qué.
 *   2. FRESCURA. Las páginas de alojamiento son estáticas (SSG + ISR de una
 *      hora). Una disponibilidad de hace una hora provocaría solicitudes sobre
 *      fechas ya vendidas, así que el widget la pide aparte al montarse y esta
 *      ruta responde siempre sin caché.
 *
 * El widget público NO escribe nada: mientras no esté la pasarela de pagos, la
 * solicitud sale por WhatsApp y es el equipo quien registra la reserva desde el
 * panel. Así la base de datos queda limpia y sustituir el último paso por el
 * checkout de Wompi es un cambio quirúrgico.
 */
import { NextResponse } from "next/server";

import {
  clampRange,
  mergeRanges,
  type AvailabilityResponse,
  type OccupiedRange,
} from "@/lib/availability";
import { addDays, parseDateRange, todayInBogota } from "@/lib/dates";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

/** La disponibilidad se calcula en cada petición: nunca se cachea. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Ventana publicada: doce meses desde hoy. */
const HORIZON_DAYS = 365;

/** Los slugs los genera el panel: minúsculas, dígitos y guiones. */
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;

const NO_STORE = { "Cache-Control": "no-store" } as const;

function fail(status: number, message: string) {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!SLUG_PATTERN.test(slug)) {
    return fail(400, "Alojamiento no válido.");
  }

  if (!hasServiceRoleKey()) {
    // Sin clave de servicio no se puede leer el calendario. Se avisa en claro
    // (el widget muestra su mensaje de error y ofrece reintentar) en lugar de
    // devolver un calendario vacío, que invitaría a reservar a ciegas.
    console.error(
      "[availability] Falta SUPABASE_SERVICE_ROLE_KEY: no se puede consultar el calendario.",
    );
    return fail(503, "La disponibilidad no está disponible en este momento.");
  }

  const supabase = createAdminClient();

  const from = todayInBogota();
  const to = addDays(from, HORIZON_DAYS);

  // --- 1. Resolver el slug ---------------------------------------------------
  // Solo alojamientos visibles: los ocultos no tienen página pública y su
  // calendario no es asunto de nadie.
  const { data: accommodation, error: accommodationError } = await supabase
    .from("accommodations")
    .select("id")
    .eq("slug", slug)
    .eq("visible", true)
    .maybeSingle();

  if (accommodationError) {
    console.error("[availability] accommodations:", accommodationError.message);
    return fail(502, "No pudimos consultar la disponibilidad.");
  }
  if (!accommodation) {
    return fail(404, "Alojamiento no encontrado.");
  }

  const accommodationId = String(accommodation.id);

  // --- 2. Reservas que ocupan calendario ------------------------------------
  // Todo lo que no esté cancelado ocupa: 'pending' (esperando pago), 'paid' y
  // 'external' (Airbnb/Booking registradas a mano). Se piden ÚNICAMENTE las dos
  // columnas de fecha: ningún dato personal sale de la base.
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("check_in, check_out")
    .eq("accommodation_id", accommodationId)
    .neq("status", "cancelled")
    .lt("check_in", to)
    .gt("check_out", from);

  if (bookingsError) {
    console.error("[availability] bookings:", bookingsError.message);
    return fail(502, "No pudimos consultar la disponibilidad.");
  }

  // --- 3. Bloqueos manuales e importados ------------------------------------
  // El solape sobre `daterange` no se expresa cómodamente en PostgREST y los
  // bloqueos de un alojamiento son pocos por definición: se traen y se filtran
  // en memoria, igual que hace el panel.
  const { data: blocks, error: blocksError } = await supabase
    .from("blocked_dates")
    .select("date_range")
    .eq("accommodation_id", accommodationId);

  if (blocksError) {
    console.error("[availability] blocked_dates:", blocksError.message);
    return fail(502, "No pudimos consultar la disponibilidad.");
  }

  // --- 4. Unificar en tramos anónimos ---------------------------------------
  const raw: OccupiedRange[] = [];

  for (const row of bookings ?? []) {
    raw.push({ from: String(row.check_in), to: String(row.check_out) });
  }

  for (const row of blocks ?? []) {
    const parsed = parseDateRange(row.date_range);
    if (parsed) raw.push({ from: parsed.start, to: parsed.end });
  }

  const occupied = mergeRanges(
    raw.flatMap((range) => {
      const clamped = clampRange(range, from, to);
      return clamped ? [clamped] : [];
    }),
  );

  const body: AvailabilityResponse = { slug, from, to, occupied };

  return NextResponse.json(body, { headers: NO_STORE });
}
