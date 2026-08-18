/**
 * Generación de calendarios iCalendar (RFC 5545).
 *
 * Este módulo es PURO: recibe eventos ya resueltos y devuelve el texto del
 * `.ics`. No toca Supabase ni Node, así que se puede probar sin base de datos.
 *
 * Lo consume `GET /api/ical/[slug]`, la mitad "exportadora" de la
 * sincronización de calendarios: Airbnb y Booking.com se suscriben a esa URL y
 * dejan de vender las fechas que ya están ocupadas en La Maima. La mitad
 * "importadora" (leer los .ics de esas plataformas) va aparte y necesita
 * credenciales del cliente que todavía no existen.
 *
 * Tres detalles del formato que no son opcionales, porque los parsers de las
 * plataformas son estrictos:
 *
 *   1. **CRLF.** El estándar exige `\r\n` al final de cada línea, incluida la
 *      última. Un `\n` suelto rompe algunos importadores.
 *   2. **Plegado a 75 octetos.** Ninguna línea puede superar los 75 OCTETOS
 *      (no caracteres: "Habitación" ocupa 11 bytes en UTF-8). La continuación
 *      empieza con un espacio.
 *   3. **Fechas de día completo con DTEND exclusivo.** Una reserva del 4 al 7
 *      de septiembre ocupa las noches 4, 5 y 6, así que se escribe
 *      `DTSTART;VALUE=DATE:20260904` / `DTEND;VALUE=DATE:20260907`. Es la
 *      misma convención medio-abierta `[from, to)` que usan Postgres, el panel
 *      y `availability.ts`, y es exactamente lo que esperan Airbnb y Booking:
 *      la salida de un huésped puede ser la entrada del siguiente.
 */

/** Identificador del producto que genera el calendario (RFC 5545 §3.7.3). */
export const PRODID = "-//La Maima Hotel Campestre//Reservas//ES";

/** Dominio de los UID. Un UID debe ser único y estable en el tiempo. */
export const UID_DOMAIN = "lamaima.com";

/** Máximo de octetos por línea antes de plegar (RFC 5545 §3.1). */
const MAX_OCTETS = 75;

const encoder = new TextEncoder();

/** Un evento de día completo del calendario. */
export type CalendarEvent = {
  /** Identificador estable, normalmente `<id de la fila>@lamaima.com`. */
  uid: string;
  /** Primer día ocupado, "YYYY-MM-DD". */
  start: string;
  /** Día de salida (EXCLUIDO), "YYYY-MM-DD". */
  end: string;
  /** Texto visible. Nunca lleva datos personales. */
  summary: string;
  /**
   * Marca de tiempo del evento (DTSTAMP). Se usa la fecha de última
   * modificación de la fila para que el mismo estado de la base produzca
   * siempre el mismo `.ics`; si falta, quien llame pasa la hora actual.
   */
  stamp: Date;
};

/**
 * Escapa un valor TEXT: barra invertida, punto y coma, coma y salto de línea
 * (RFC 5545 §3.3.11). Los dos puntos NO se escapan dentro de un valor.
 */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/**
 * Pliega una línea larga en trozos de 75 octetos como máximo. Cada
 * continuación empieza con un espacio, que también cuenta para el límite.
 *
 * Se itera por PUNTOS DE CÓDIGO (`for...of`), no por índices, para no partir
 * un par subrogado (emoji) por la mitad.
 */
export function foldLine(line: string): string {
  if (encoder.encode(line).length <= MAX_OCTETS) return line;

  const chunks: string[] = [];
  let current = "";
  let bytes = 0;
  let limit = MAX_OCTETS;

  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit) {
      chunks.push(current);
      current = "";
      bytes = 0;
      // Las líneas plegadas gastan un octeto en el espacio inicial.
      limit = MAX_OCTETS - 1;
    }
    current += char;
    bytes += size;
  }
  chunks.push(current);

  return chunks.join("\r\n ");
}

/** "2026-09-04" -> "20260904" (valor DATE, RFC 5545 §3.3.4). */
export function toIcalDate(iso: string): string {
  return iso.replace(/-/g, "");
}

/** Date -> "20260818T140530Z" (DATE-TIME en UTC, RFC 5545 §3.3.5). */
export function toIcalTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

type CalendarInput = {
  /** Nombre visible del calendario (X-WR-CALNAME). */
  name: string;
  events: CalendarEvent[];
};

/**
 * Arma el documento VCALENDAR completo, ya plegado y con CRLF.
 *
 * `METHOD:PUBLISH` declara que es un calendario de solo lectura publicado
 * para que otros se suscriban, no una invitación que espere respuesta.
 * `TRANSP:OPAQUE` es lo que hace que el tramo cuente como ocupado.
 */
export function buildCalendar({ name, events }: CalendarInput): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(name)}`,
    "X-WR-TIMEZONE:America/Bogota",
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${toIcalTimestamp(event.stamp)}`,
      `DTSTART;VALUE=DATE:${toIcalDate(event.start)}`,
      `DTEND;VALUE=DATE:${toIcalDate(event.end)}`,
      `SUMMARY:${escapeText(event.summary)}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  // El documento termina en CRLF: la última línea también lo lleva.
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
