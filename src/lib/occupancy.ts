/**
 * Lectura de las fechas ocupadas de un alojamiento, con la clave de servicio.
 *
 * Es la fuente común de los dos endpoints que publican el calendario:
 *
 *   - `GET /api/availability/[slug]` — para el widget de reservas del sitio.
 *     Funde los tramos y publica solo rangos anónimos.
 *   - `GET /api/ical/[slug]` — para Airbnb y Booking.com. Necesita un evento
 *     por fila, con un UID estable, y por eso aquí NO se funden los tramos.
 *
 * Está en un módulo aparte para que ambos vean exactamente lo mismo: si un día
 * cambia qué estado ocupa calendario, se cambia una sola vez y el sitio y las
 * plataformas externas no pueden quedar en desacuerdo (que es, literalmente,
 * la definición de una sobreventa).
 *
 * Se usa la clave de servicio porque RLS le niega `bookings` y `blocked_dates`
 * al rol `anon`. De la tabla de reservas se piden ÚNICAMENTE el id, las dos
 * fechas y la marca de tiempo: ningún dato personal sale de la base.
 */
import "server-only";

import type { OccupiedRange } from "./availability";
import { occupiesCalendar } from "./booking/holds";
import { parseDateRange } from "./dates";
import { createAdminClient, hasServiceRoleKey } from "./supabase/admin";

/** Tramo ocupado con la identidad de la fila que lo produce. */
export type OccupancyEntry = OccupiedRange & {
  /** `id` de la fila: base del UID estable del evento iCal. */
  id: string;
  /** Qué lo ocupa: una reserva o un bloqueo manual/importado. */
  kind: "booking" | "block";
  /** Última modificación conocida de la fila (DTSTAMP del evento). */
  stamp: Date;
};

export type OccupancyFailure =
  /** Falta SUPABASE_SERVICE_ROLE_KEY en el entorno. */
  | "unconfigured"
  /** El slug no corresponde a ningún alojamiento visible. */
  | "not-found"
  /** Supabase respondió con error. */
  | "query-failed";

export type OccupancyResult =
  | {
      ok: true;
      accommodationId: string;
      /** Nombre del alojamiento, para titular el calendario exportado. */
      name: string;
      entries: OccupancyEntry[];
    }
  | { ok: false; failure: OccupancyFailure };

/** Convierte un `timestamptz` de Postgres en Date, con la hora actual si falla. */
function toStamp(value: unknown): Date {
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

/**
 * Devuelve todo lo que ocupa el calendario de `slug` dentro de la ventana
 * `[from, to)`, sin fundir ni recortar: cada quien decide después qué hacer
 * con los tramos.
 *
 * QUÉ CUENTA COMO OCUPADO. Todas las reservas que no estén `cancelled`
 * (`pending`, `confirmed`, `paid` y `external`) y todos los bloqueos manuales
 * que crucen la ventana — CON UNA EXCEPCIÓN: un `pending` cuyo hold de 48
 * horas ya venció no ocupa nada. Esa regla vive en `occupiesCalendar()` y la
 * comparten este módulo, la comprobación de la Server Action pública y la del
 * panel; si los tres no dijeran lo mismo, la diferencia se llamaría
 * sobreventa.
 *
 * El filtrado del hold se hace en memoria y no en la consulta a propósito: son
 * un puñado de filas por alojamiento, y expresar "o el estado no es pending, o
 * expires_at es nulo, o expires_at es futuro" en PostgREST produce un `or=`
 * ilegible que ya no se parece a la regla escrita.
 */
export async function loadOccupancy(
  slug: string,
  from: string,
  to: string,
): Promise<OccupancyResult> {
  if (!hasServiceRoleKey()) {
    console.error(
      "[occupancy] Falta SUPABASE_SERVICE_ROLE_KEY: no se puede consultar el calendario.",
    );
    return { ok: false, failure: "unconfigured" };
  }

  const supabase = createAdminClient();

  // --- 1. Resolver el slug ---------------------------------------------------
  // Solo alojamientos visibles: los ocultos no tienen página pública y su
  // calendario no es asunto de nadie.
  const { data: accommodation, error: accommodationError } = await supabase
    .from("accommodations")
    .select("id, name")
    .eq("slug", slug)
    .eq("visible", true)
    .maybeSingle();

  if (accommodationError) {
    console.error("[occupancy] accommodations:", accommodationError.message);
    return { ok: false, failure: "query-failed" };
  }
  if (!accommodation) {
    return { ok: false, failure: "not-found" };
  }

  const accommodationId = String(accommodation.id);

  // --- 2. Reservas que ocupan calendario ------------------------------------
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id, check_in, check_out, updated_at, status, expires_at")
    .eq("accommodation_id", accommodationId)
    .neq("status", "cancelled")
    .lt("check_in", to)
    .gt("check_out", from);

  if (bookingsError) {
    console.error("[occupancy] bookings:", bookingsError.message);
    return { ok: false, failure: "query-failed" };
  }

  // --- 3. Bloqueos manuales e importados ------------------------------------
  // El solape sobre `daterange` no se expresa cómodamente en PostgREST y los
  // bloqueos de un alojamiento son pocos por definición: se traen y se filtran
  // en memoria, igual que hace el panel.
  const { data: blocks, error: blocksError } = await supabase
    .from("blocked_dates")
    .select("id, date_range, created_at")
    .eq("accommodation_id", accommodationId);

  if (blocksError) {
    console.error("[occupancy] blocked_dates:", blocksError.message);
    return { ok: false, failure: "query-failed" };
  }

  const entries: OccupancyEntry[] = [];
  const now = new Date();

  for (const row of bookings ?? []) {
    // Un hold vencido no ocupa calendario: ni para el widget, ni para el .ics
    // que leen Airbnb y Booking.
    if (
      !occupiesCalendar(
        {
          status: String(row.status),
          expires_at: (row.expires_at as string | null) ?? null,
        },
        now,
      )
    ) {
      continue;
    }

    entries.push({
      id: String(row.id),
      kind: "booking",
      from: String(row.check_in),
      to: String(row.check_out),
      stamp: toStamp(row.updated_at),
    });
  }

  for (const row of blocks ?? []) {
    const parsed = parseDateRange(row.date_range);
    if (!parsed) continue;
    // El filtro de ventana de los bloqueos se hace aquí porque el rango vive
    // en una sola columna `daterange` y no en dos fechas comparables.
    if (!(parsed.start < to && from < parsed.end)) continue;
    entries.push({
      id: String(row.id),
      kind: "block",
      from: parsed.start,
      to: parsed.end,
      stamp: toStamp(row.created_at),
    });
  }

  // Orden cronológico estable: el .ics de un mismo estado de la base sale
  // siempre idéntico, lo que hace comparables dos descargas seguidas.
  entries.sort((a, b) =>
    a.from === b.from ? a.id.localeCompare(b.id) : a.from < b.from ? -1 : 1,
  );

  return {
    ok: true,
    accommodationId,
    name: String(accommodation.name),
    entries,
  };
}
