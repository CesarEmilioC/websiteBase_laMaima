/**
 * Validación de solapes de calendario.
 *
 * La base de datos ya tiene una restricción EXCLUDE (`bookings_no_overlap`)
 * que impide dos reservas cruzadas en el mismo alojamiento, pero solo cubre
 * los estados 'pending' y 'paid'. El panel necesita además:
 *   - contemplar las reservas 'external' (Airbnb/Booking registradas a mano),
 *   - contemplar los bloqueos manuales de `blocked_dates`,
 *   - y sobre todo, explicar el choque en español en vez de mostrar el error
 *     críptico de Postgres.
 *
 * Por eso la comprobación se hace también aquí, antes de escribir. La
 * restricción de la base de datos queda como red de seguridad frente a dos
 * guardados simultáneos.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { formatRangeEs, parseDateRange, rangesOverlap } from "./dates";
import { BOOKING_STATUS_LABEL, OCCUPYING_STATUSES, type BookingStatus } from "./types";

export type Conflict = {
  kind: "reserva" | "bloqueo";
  description: string;
};

/**
 * Devuelve los choques del rango [checkIn, checkOut) para un alojamiento.
 * `excludeBookingId` permite reeditar una reserva sin que choque consigo misma.
 */
export async function findCalendarConflicts(
  supabase: SupabaseClient,
  accommodationId: string,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string,
): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];

  // --- Reservas que ocupan calendario -------------------------------------
  let bookingsQuery = supabase
    .from("bookings")
    .select("id, guest_name, check_in, check_out, status")
    .eq("accommodation_id", accommodationId)
    .in("status", OCCUPYING_STATUSES)
    // Solape de rangos medio-abiertos: inicio_a < fin_b  y  inicio_b < fin_a.
    .lt("check_in", checkOut)
    .gt("check_out", checkIn);

  if (excludeBookingId) {
    bookingsQuery = bookingsQuery.neq("id", excludeBookingId);
  }

  const { data: bookings, error: bookingsError } = await bookingsQuery;
  if (bookingsError) {
    throw new Error(
      `No se pudo comprobar la disponibilidad: ${bookingsError.message}`,
    );
  }

  for (const row of bookings ?? []) {
    const status = row.status as BookingStatus;
    conflicts.push({
      kind: "reserva",
      description: `${row.guest_name} (${BOOKING_STATUS_LABEL[status] ?? status}) del ${formatRangeEs(
        String(row.check_in),
        String(row.check_out),
      )}`,
    });
  }

  // --- Bloqueos manuales / importados -------------------------------------
  // El filtro de solape sobre `daterange` no se expresa cómodamente en
  // PostgREST, así que se traen los bloqueos del alojamiento (son pocos por
  // definición) y se comparan en memoria.
  const { data: blocks, error: blocksError } = await supabase
    .from("blocked_dates")
    .select("id, date_range, reason")
    .eq("accommodation_id", accommodationId);

  if (blocksError) {
    throw new Error(
      `No se pudo comprobar la disponibilidad: ${blocksError.message}`,
    );
  }

  for (const row of blocks ?? []) {
    const parsed = parseDateRange(row.date_range);
    if (!parsed) continue;
    if (!rangesOverlap(checkIn, checkOut, parsed.start, parsed.end)) continue;
    const reason = typeof row.reason === "string" && row.reason ? row.reason : "Bloqueo";
    conflicts.push({
      kind: "bloqueo",
      description: `${reason} del ${formatRangeEs(parsed.start, parsed.end)}`,
    });
  }

  return conflicts;
}

/** Mensaje único, listo para mostrar en el banner de error. */
export function describeConflicts(conflicts: Conflict[]): string {
  const list = conflicts.map((item) => `• ${item.description}`).join("\n");
  return `Esas fechas ya están ocupadas:\n${list}`;
}
