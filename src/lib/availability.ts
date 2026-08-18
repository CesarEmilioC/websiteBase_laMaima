/**
 * Disponibilidad: tipos y lógica pura del calendario público.
 *
 * El sitio público NUNCA ve una reserva. Lo único que viaja al navegador son
 * rangos de fechas ocupadas — sin nombre, sin correo, sin importe, sin saber
 * siquiera si el hueco lo produce una reserva, un bloqueo de mantenimiento o
 * una sincronización de Airbnb. Ese anonimato es deliberado: `bookings` tiene
 * datos personales y RLS la protege de `anon` (ver `supabase/schema.sql`).
 *
 * Convención de rangos, la misma de Postgres y del panel: **medio-abiertos**
 * `[from, to)`. `from` es la primera NOCHE ocupada y `to` el día de salida, que
 * queda libre. Así la salida de un huésped puede ser la entrada del siguiente.
 *
 * Este módulo es puro (sin Supabase, sin Node): lo usan tanto el route handler
 * como el widget del navegador.
 */
import { addDays, rangesOverlap } from "./dates";

/** Tramo ocupado `[from, to)`. Es lo único que devuelve la API pública. */
export type OccupiedRange = {
  /** Primera noche ocupada, "YYYY-MM-DD". */
  from: string;
  /** Día de salida (excluido): esa noche ya está libre. */
  to: string;
};

/** Respuesta de `GET /api/availability/[slug]`. */
export type AvailabilityResponse = {
  slug: string;
  /** Primer día del calendario consultado (hoy en Colombia). */
  from: string;
  /** Último día consultado (excluido). */
  to: string;
  occupied: OccupiedRange[];
};

/**
 * Recorta un tramo a la ventana [min, max) del calendario.
 * Devuelve `null` si queda fuera por completo.
 */
export function clampRange(
  range: OccupiedRange,
  min: string,
  max: string,
): OccupiedRange | null {
  const from = range.from < min ? min : range.from;
  const to = range.to > max ? max : range.to;
  return from < to ? { from, to } : null;
}

/**
 * Ordena y funde los tramos que se cruzan O se tocan.
 *
 * Fundir los adyacentes ([1,3) + [3,5) -> [1,5)) importa: dos reservas
 * consecutivas son, de cara al calendario, un único bloque ocupado, y así el
 * navegador recibe la lista más corta posible.
 */
export function mergeRanges(ranges: OccupiedRange[]): OccupiedRange[] {
  const sorted = ranges
    .filter((range) => range.from < range.to)
    .sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));

  const merged: OccupiedRange[] = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (last && range.from <= last.to) {
      if (range.to > last.to) last.to = range.to;
      continue;
    }
    merged.push({ ...range });
  }
  return merged;
}

/** ¿La noche de esa fecha está ocupada? */
export function isNightOccupied(iso: string, ranges: OccupiedRange[]): boolean {
  return ranges.some((range) => range.from <= iso && iso < range.to);
}

/** ¿Todas las noches de [checkIn, checkOut) están libres? */
export function rangeIsFree(
  checkIn: string,
  checkOut: string,
  ranges: OccupiedRange[],
): boolean {
  return !ranges.some((range) =>
    rangesOverlap(checkIn, checkOut, range.from, range.to),
  );
}

/**
 * Estado de una celda del calendario, tal como lo pinta el widget.
 *
 * `selectable` depende del momento de la selección: mientras se elige la
 * SALIDA, una fecha vale si todas las noches desde la entrada están libres.
 * Ojo con el caso fino: el primer día ocupado después de la entrada sí es una
 * salida válida (esa noche ya no se duerme aquí), y por eso se comprueba el
 * rango entero en vez de mirar solo la fecha.
 */
export type DayState = {
  past: boolean;
  occupied: boolean;
  selectable: boolean;
  role: "start" | "end" | "between" | "none";
};

export type CalendarContext = {
  /** Hoy en Colombia: nada anterior se puede reservar. */
  today: string;
  /** Último día que la API cubre (excluido). */
  limit: string;
  occupied: OccupiedRange[];
  checkIn: string | null;
  checkOut: string | null;
};

export function dayState(iso: string, context: CalendarContext): DayState {
  const { today, limit, occupied, checkIn, checkOut } = context;

  const past = iso < today;
  const beyondHorizon = iso >= limit;
  const isOccupied = isNightOccupied(iso, occupied);

  // Toda fecha libre sirve para (re)empezar una selección.
  const validStart = !past && !beyondHorizon && !isOccupied;

  const choosingCheckOut = checkIn !== null && checkOut === null;
  const validEnd =
    choosingCheckOut &&
    !beyondHorizon &&
    iso > checkIn &&
    rangeIsFree(checkIn, iso, occupied);

  let role: DayState["role"] = "none";
  if (checkIn && iso === checkIn) role = "start";
  else if (checkOut && iso === checkOut) role = "end";
  else if (checkIn && checkOut && iso > checkIn && iso < checkOut)
    role = "between";

  return {
    past,
    occupied: isOccupied,
    selectable: validStart || validEnd,
    role,
  };
}

/** Primera noche ocupada a partir de una fecha (incluida), o `null`. */
export function nextOccupiedNight(
  from: string,
  ranges: OccupiedRange[],
): string | null {
  let best: string | null = null;
  for (const range of ranges) {
    const candidate = range.from >= from ? range.from : from < range.to ? from : null;
    if (candidate && (best === null || candidate < best)) best = candidate;
  }
  return best;
}

/**
 * Última salida posible para una entrada dada: la primera noche ocupada que
 * venga después (esa fecha sí es salida válida) o el fin del horizonte.
 */
export function lastCheckOutFor(
  checkIn: string,
  ranges: OccupiedRange[],
  limit: string,
): string {
  const blocked = nextOccupiedNight(addDays(checkIn, 1), ranges);
  if (blocked && blocked < limit) return blocked;
  return limit;
}
