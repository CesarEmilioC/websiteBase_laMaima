/**
 * Utilidades de fecha compartidas por el panel y el sitio público.
 *
 * Todas las fechas de negocio (check-in, check-out, bloqueos) son columnas
 * `date` de Postgres: llegan como "YYYY-MM-DD" y se tratan SIEMPRE como texto.
 * Convertirlas a `Date` traería husos horarios al problema y en Colombia
 * (UTC-5) haría que una reserva del día 12 se mostrara como el 11.
 *
 * Cuando hace falta aritmética se usa `Date.UTC`, que es un calendario puro sin
 * huso horario, y se vuelve a texto inmediatamente.
 *
 * Este módulo es puro: no importa nada de Node ni de React, así que puede
 * usarse tanto en componentes de servidor como en el navegador.
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

const MONTHS_LONG = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/**
 * Cabecera del calendario, con la semana empezando en LUNES (convención en
 * Colombia y en el resto de Hispanoamérica; `Date.getUTCDay()` empieza en
 * domingo, por eso `weekdayIndex()` desplaza el índice).
 */
export const WEEKDAYS_SHORT_ES = [
  "lun",
  "mar",
  "mié",
  "jue",
  "vie",
  "sáb",
  "dom",
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

/** "2026-08-12" -> "12 de agosto de 2026" (para textos de cara al huésped). */
export function formatLongDateEs(iso: string): string {
  if (!ISO_DATE.test(iso)) return iso;
  const [y, m, d] = iso.split("-");
  return `${Number(d)} de ${MONTHS_LONG[Number(m) - 1]} de ${y}`;
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

/* ---------------------------------------------------------------------------
 * Rejilla de calendario
 * ------------------------------------------------------------------------- */

/** Un mes concreto del calendario. `month` es 1–12 (no el 0–11 de `Date`). */
export type YearMonth = {
  year: number;
  month: number;
};

/** Mes al que pertenece una fecha ISO. */
export function monthOf(iso: string): YearMonth {
  const [year, month] = iso.split("-").map(Number);
  return { year, month };
}

/** Desplaza un mes hacia adelante o hacia atrás, normalizando el año. */
export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  const zeroBased = year * 12 + (month - 1) + delta;
  return {
    year: Math.floor(zeroBased / 12),
    month: (zeroBased % 12) + 1,
  };
}

/** Orden cronológico entre meses: negativo, cero o positivo. */
export function compareMonths(a: YearMonth, b: YearMonth): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

/** "Septiembre 2026" (con la inicial en mayúscula, como en los títulos). */
export function monthTitleEs({ year, month }: YearMonth): string {
  const name = MONTHS_LONG[month - 1] ?? "";
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

/** Fecha ISO de un día concreto de un mes. */
export function isoFrom({ year, month }: YearMonth, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Cuántos días tiene el mes (día 0 del siguiente = último del actual). */
export function daysInMonth({ year, month }: YearMonth): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Índice del día de la semana con la semana empezando en lunes (0 = lunes). */
export function weekdayIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

/**
 * Días de un mes precedidos por los huecos necesarios para que el día 1 caiga
 * en su columna. `null` = celda vacía.
 */
export function monthGrid(target: YearMonth): (string | null)[] {
  const total = daysInMonth(target);
  const lead = weekdayIndex(isoFrom(target, 1));
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= total; day += 1) {
    cells.push(isoFrom(target, day));
  }
  return cells;
}
