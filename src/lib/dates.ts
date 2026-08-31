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

import { DEFAULT_LOCALE, type Locale } from "./i18n/config";

const MONTHS_SHORT: Record<Locale, string[]> = {
  es: [
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
  ],
  en: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
};

const MONTHS_LONG: Record<Locale, string[]> = {
  es: [
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
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
};

/**
 * Cabecera del calendario, con la semana empezando en LUNES.
 *
 * En español es la convención de Colombia y de toda Hispanoamérica. En INGLÉS
 * se conserva el lunes a propósito, aunque en Estados Unidos la semana empiece
 * en domingo: el calendario del widget marca noches de "lunes a jueves" con
 * tarifa reducida y de "fin de semana" con tarifa plena, y esa lectura —el
 * bloque barato a la izquierda, el caro a la derecha— se pierde si el domingo
 * se muda a la primera columna. Además evita mantener dos rejillas distintas
 * (`weekdayIndex()` es común a las dos) y dos juegos de capturas.
 */
const WEEKDAYS_SHORT: Record<Locale, string[]> = {
  es: ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

/** Compatibilidad: el panel de administración es monolingüe (español). */
export const WEEKDAYS_SHORT_ES = WEEKDAYS_SHORT.es;

/** Cabecera del calendario en el idioma pedido. */
export function weekdaysShort(locale: Locale = DEFAULT_LOCALE): string[] {
  return WEEKDAYS_SHORT[locale];
}

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

/**
 * "2026-08-12" -> "12 ago 2026" · "12 Aug 2026"
 *
 * El inglés conserva el orden día-mes-año en vez de pasar a "Aug 12, 2026": el
 * establecimiento y sus huéspedes están en Colombia, las fechas se comparan con
 * las del pasaporte y las de la aerolínea, y mezclar los dos órdenes en el mismo
 * viaje es la forma más rápida de que alguien llegue un día tarde. El mes va
 * siempre en letras justamente para que no quepa la duda.
 */
export function formatDate(iso: string, locale: Locale = DEFAULT_LOCALE): string {
  if (!ISO_DATE.test(iso)) return iso;
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${MONTHS_SHORT[locale][Number(m) - 1]} ${y}`;
}

/** "2026-08-12" -> "12 de agosto de 2026" · "12 August 2026". */
export function formatLongDate(
  iso: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (!ISO_DATE.test(iso)) return iso;
  const [y, m, d] = iso.split("-");
  const month = MONTHS_LONG[locale][Number(m) - 1];
  return locale === "en"
    ? `${Number(d)} ${month} ${y}`
    : `${Number(d)} de ${month} de ${y}`;
}

/** "12 ago – 15 ago 2026" (omite el mes repetido y el año del primer extremo). */
export function formatRange(
  startIso: string,
  endIso: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (!ISO_DATE.test(startIso) || !ISO_DATE.test(endIso)) {
    return `${startIso} – ${endIso}`;
  }
  const [sy, sm, sd] = startIso.split("-");
  const [ey, em] = endIso.split("-");
  const left =
    sy === ey && sm === em
      ? `${Number(sd)}`
      : `${Number(sd)} ${MONTHS_SHORT[locale][Number(sm) - 1]}`;
  return `${left} – ${formatDate(endIso, locale)}`;
}

/* Atajos en español para el PANEL de administración, que es monolingüe: así no
   hay que pasarle el idioma a cada llamada de una pantalla que nunca cambia. */

/** "2026-08-12" -> "12 ago 2026" */
export function formatDateEs(iso: string): string {
  return formatDate(iso, "es");
}

/** "2026-08-12" -> "12 de agosto de 2026" */
export function formatLongDateEs(iso: string): string {
  return formatLongDate(iso, "es");
}

/** "12 ago – 15 ago 2026" */
export function formatRangeEs(startIso: string, endIso: string): string {
  return formatRange(startIso, endIso, "es");
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
  const month = MONTHS_SHORT.es[bogota.getUTCMonth()];
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

/** "Septiembre 2026" / "September 2026" (con la inicial en mayúscula). */
export function monthTitle(
  { year, month }: YearMonth,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const name = MONTHS_LONG[locale][month - 1] ?? "";
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

/** Atajo en español para el panel. */
export function monthTitleEs(target: YearMonth): string {
  return monthTitle(target, "es");
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

/** Celdas de la rejilla de un mes: siempre seis semanas de siete días. */
export const MONTH_GRID_CELLS = 42;

/**
 * Días de un mes precedidos por los huecos necesarios para que el día 1 caiga
 * en su columna, y seguidos de los que hagan falta para completar SIEMPRE seis
 * filas. `null` = celda vacía.
 *
 * El relleno final no es cosmético: sin él, un mes de cinco filas y otro de
 * seis miden distinto y el calendario cambia de alto al pasar de mes,
 * empujando todo lo que tiene debajo (y contando como desplazamiento de
 * diseño, CLS). Con seis filas fijas el panel nunca se mueve.
 */
export function monthGrid(target: YearMonth): (string | null)[] {
  const total = daysInMonth(target);
  const lead = weekdayIndex(isoFrom(target, 1));
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= total; day += 1) {
    cells.push(isoFrom(target, day));
  }
  while (cells.length < MONTH_GRID_CELLS) cells.push(null);
  return cells;
}
