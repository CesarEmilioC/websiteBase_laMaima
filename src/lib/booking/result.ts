/**
 * Contrato entre la Server Action que crea la reserva y el widget que la
 * llama.
 *
 * Es un módulo PURO y sin dependencias a propósito: lo importan por igual el
 * componente de cliente (que solo necesita los tipos y las claves de error) y
 * la acción de servidor. Así el widget nunca arrastra Supabase al navegador.
 *
 * MISMO CRITERIO QUE EN `guest.ts`: aquí no hay texto, hay CLAVES. El widget
 * las traduce con `t.booking.form.errors`.
 */
import type { Locale } from "../i18n/config";
import type { GuestErrors } from "./guest";

/**
 * Lo que el widget manda al servidor.
 *
 * Fíjate en lo que NO viaja: el **total**. El navegador calcula un precio para
 * enseñarlo mientras se eligen fechas, pero ese número no entra en la base de
 * datos bajo ningún concepto — el servidor lo recalcula con `@/lib/pricing` a
 * partir de las tarifas que él mismo lee. Un total que llegara del cliente
 * sería un campo de precio editable con las herramientas de desarrollo.
 */
export type BookingRequestInput = {
  slug: string;
  /** "YYYY-MM-DD" */
  checkIn: string;
  /** "YYYY-MM-DD", exclusivo */
  checkOut: string;
  guests: number;
  /** Idioma de la página: define el idioma de los correos del huésped. */
  locale: Locale;
  name: string;
  email: string;
  phone: string;
  notes: string;
  policyAccepted: boolean;
  /** Campo trampa. Relleno = bot; ver `HONEYPOT_FIELD` en `guest.ts`. */
  company: string;
};

/** Lo mínimo para pedir una cotización (sin datos personales todavía). */
export type BookingQuoteInput = {
  slug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  locale: Locale;
};

/** Cotización verificada EN EL SERVIDOR, lista para pintar el recap. */
export type BookingQuote = {
  accommodationName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalCop: number;
  /** Desglose por grupos de noches, ya redactado en el idioma pedido. */
  lines: { key: string; label: string; detail: string | null; subtotalCop: number }[];
  /** "Desayuno incluido" / "Breakfast extra: …", o `null` si no se anuncia. */
  breakfast: string | null;
};

export type QuoteBookingResult =
  | { ok: true; quote: BookingQuote }
  | { ok: false; failure: BookingFailure; detail?: string };

/** Motivos por los que una solicitud correcta de forma puede no prosperar. */
export type BookingFailure =
  /** Alguien se quedó con esas fechas entre que se pintó el calendario y se
   *  pulsó el botón. Es el caso que de verdad importa: ver `PG_EXCLUSION`. */
  | "dates-taken"
  /** Las fechas no son válidas (pasadas, invertidas, fuera del horizonte). */
  | "invalid-dates"
  /** La estadía no llega a la estancia mínima de la temporada. */
  | "min-stay"
  /** Más huéspedes de los que admite el alojamiento. */
  | "over-capacity"
  /** El alojamiento no existe o dejó de ser visible. */
  | "not-found"
  /** Demasiadas solicitudes desde el mismo navegador en poco tiempo. */
  | "rate-limited"
  /** Falta configuración del servidor (clave de servicio). */
  | "unconfigured"
  /** Cualquier otra cosa: se registra en el servidor y se pide reintentar. */
  | "server";

/** Resumen de la reserva creada, tal como lo pinta la pantalla de éxito. */
export type BookingReceipt = {
  code: string;
  accommodationName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalCop: number;
  /** ISO 8601. Cuándo caduca el hold de 48 h. */
  expiresAt: string;
  guestName: string;
  guestEmail: string;
};

export type CreateBookingResult =
  | { ok: true; receipt: BookingReceipt }
  /** Un campo del formulario está mal: se pintan los errores y se vuelve. */
  | { ok: false; kind: "fields"; errors: GuestErrors }
  /**
   * La solicitud estaba bien escrita pero no se pudo crear. `detail` trae, solo
   * cuando existe, un texto YA traducido que el motor de tarifas compone por su
   * cuenta (el aviso de estancia mínima).
   */
  | { ok: false; kind: "booking"; failure: BookingFailure; detail?: string };

/* ---------------------------------------------------------------------------
 * Errores de Postgres
 * ------------------------------------------------------------------------- */

/**
 * `23P01` — violación de una restricción EXCLUDE. En esta base solo puede ser
 * `bookings_no_overlap`: dos reservas activas del mismo alojamiento cruzándose.
 *
 * Es la ÚLTIMA LÍNEA de defensa contra la carrera entre dos personas que piden
 * las mismas fechas en el mismo segundo. La acción re-comprueba disponibilidad
 * antes de insertar, pero entre esa comprobación y el INSERT cabe otra
 * transacción; la base de datos es el único árbitro que no se puede saltar.
 */
export const PG_EXCLUSION_VIOLATION = "23P01";

/** `23505` — violación de un índice único. Aquí: el código de reserva repetido. */
export const PG_UNIQUE_VIOLATION = "23505";

type PostgresErrorLike = { code?: string | null; message?: string };

export function isExclusionViolation(error: PostgresErrorLike | null): boolean {
  return error?.code === PG_EXCLUSION_VIOLATION;
}

export function isUniqueViolation(error: PostgresErrorLike | null): boolean {
  return error?.code === PG_UNIQUE_VIOLATION;
}

/**
 * ¿El choque de unicidad es del CÓDIGO de reserva?
 *
 * Importa distinguirlo: un código repetido se resuelve solo (se sortea otro y
 * se reintenta), mientras que cualquier otro choque de unicidad es un problema
 * de verdad que no debe reintentarse en bucle.
 */
export function isBookingCodeCollision(error: PostgresErrorLike | null): boolean {
  if (!isUniqueViolation(error)) return false;
  const message = error?.message ?? "";
  return message.includes("booking_code");
}

/** Traduce el error crudo de Supabase a una de nuestras claves. */
export function failureFromPostgres(
  error: PostgresErrorLike | null,
): BookingFailure {
  if (isExclusionViolation(error)) return "dates-taken";
  return "server";
}
