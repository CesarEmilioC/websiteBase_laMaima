/**
 * Utilidades de fecha para el panel.
 *
 * Todas las fechas de negocio (check-in, check-out, bloqueos) son columnas
 * `date` de Postgres: llegan como "YYYY-MM-DD" y se tratan SIEMPRE como texto.
 * Convertirlas a `Date` traería husos horarios al problema y en Colombia
 * (UTC-5) haría que una reserva del día 12 se mostrara como el 11.
 */

const MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  // Rechaza 31 de febrero y compañía.
  const probe = new Date(Date.UTC(y, m - 1, d));
  return (
    probe.getUTCFullYear() === y &&
    probe.getUTCMonth() === m - 1 &&
    probe.getUTCDate() === d
  );
}

/** "2026-08-12" -> "12 ago 2026" */
export function formatDateEs(iso: string): string {
  if (!ISO_DATE.test(iso)) return iso;
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${MONTHS_SHORT[Number(m) - 1]} ${y}`;
}

/** "12 ago – 15 ago 2026" (omite el mes repetido y el año del primer extremo). */
export function formatRangeEs(startIso: string, endIso: string): string {
  if (!ISO_DATE.test(startIso) || !ISO_DATE.test(endIso)) {
    return `${startIso} – ${endIso}`;
  }
  const [sy, sm, sd] = startIso.split("-");
  const [ey, em] = endIso.split("-");
  const left =
    sy === ey && sm === em
      ? `${Number(sd)}`
      : `${Number(sd)} ${MONTHS_SHORT[Number(sm) - 1]}`;
  return `${left} – ${formatDateEs(endIso)}`;
}

/** Fecha de hoy en la zona horaria de Colombia (UTC-5, sin horario de verano). */
export function todayInBogota(): string {
  const nowUtcMs = Date.now();
  const bogota = new Date(nowUtcMs - 5 * 60 * 60 * 1000);
  return bogota.toISOString().slice(0, 10);
}

/** Suma días a una fecha ISO sin tocar husos horarios. */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}

/** Número de noches entre dos fechas ISO (check_out exclusivo). */
export function nightsBetween(startIso: string, endIso: string): number {
  const [sy, sm, sd] = startIso.split("-").map(Number);
  const [ey, em, ed] = endIso.split("-").map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);
  return Math.round((end - start) / 86400000);
}

/**
 * ¿Se cruzan dos rangos medio-abiertos [inicio, fin)?
 * La comparación de cadenas ISO equivale a la comparación cronológica.
 */
export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Parsea el `daterange` de Postgres. Postgres normaliza siempre los rangos de
 * fechas a la forma canónica `[inicio,fin)`, así que basta con leer los dos
 * extremos; aun así se contempla la forma `(inicio,fin]` por robustez.
 */
export function parseDateRange(
  raw: unknown,
): { start: string; end: string } | null {
  if (typeof raw !== "string") return null;
  const match = /^([[(])(\d{4}-\d{2}-\d{2}),(\d{4}-\d{2}-\d{2})([\])])$/.exec(
    raw.trim(),
  );
  if (!match) return null;
  const [, lower, rawStart, rawEnd, upper] = match;
  const start = lower === "(" ? addDays(rawStart, 1) : rawStart;
  const end = upper === "]" ? addDays(rawEnd, 1) : rawEnd;
  return { start, end };
}

/** Construye el literal `daterange` medio-abierto que espera Postgres. */
export function toDateRangeLiteral(startIso: string, endIso: string): string {
  return `[${startIso},${endIso})`;
}

/** Fecha y hora de creación, legible: "12 ago 2026, 14:35". */
export function formatTimestampEs(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  // Se muestra en hora de Colombia (UTC-5).
  const bogota = new Date(date.getTime() - 5 * 60 * 60 * 1000);
  const day = bogota.getUTCDate();
  const month = MONTHS_SHORT[bogota.getUTCMonth()];
  const year = bogota.getUTCFullYear();
  const hh = String(bogota.getUTCHours()).padStart(2, "0");
  const mm = String(bogota.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hh}:${mm}`;
}
