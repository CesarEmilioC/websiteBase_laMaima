/**
 * Tipos de las filas tal como las consume el panel de administración.
 *
 * Se declaran aparte de `@/lib/content` porque el panel necesita columnas que
 * el sitio público no usa (visible, created_at, payment_ref…) y porque el
 * panel sí ve las filas ocultas.
 */

import type { TierDayType } from "@/lib/pricing";

export type GalleryImage = {
  url: string;
  alt: string;
};

export type AdminAccommodation = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  capacity: number;
  price_per_night_cop: number;
  price_note: string | null;
  amenities: string[];
  gallery: GalleryImage[];
  visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;

  /* --- Versión inglesa (sitio /en) ---------------------------------------
   * No hay `name_en`: los nombres de las casas son nombres propios y no se
   * traducen. Donde falte la traducción, el sitio inglés cae al español.
   * ---------------------------------------------------------------------- */
  short_description_en: string | null;
  description_en: string | null;
  amenities_en: string[];
  price_note_en: string | null;
  rate_note_en: string | null;

  /* --- Modelo de tarifas por ocupación (se edita en /admin/tarifas) ------- */
  extra_person_price_cop: number | null;
  extra_person_price_weekday_cop: number | null;
  breakfast_included: boolean;
  breakfast_price_cop: number | null;
  weekday_discount_pct: number | null;
  rate_note: string | null;
};

export type AdminExperience = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  duration: string | null;
  capacity: number | null;
  price_cop: number | null;
  price_note: string | null;
  gallery: GalleryImage[];
  visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;

  /* --- Versión inglesa (sitio /en) ---------------------------------------
   * Aquí el nombre SÍ se traduce: describe la actividad, no es una marca. */
  name_en: string | null;
  short_description_en: string | null;
  description_en: string | null;
  duration_en: string | null;
  price_note_en: string | null;
};

/* ---------------------------------------------------------------------------
 * Tarifas
 * ------------------------------------------------------------------------- */
/* Las constantes de tarifas viven aquí y no en `@/lib/admin/rates` porque el
 * editor de tramos es un componente de cliente: importarlas desde el módulo de
 * consultas arrastraría `next/headers` al bundle del navegador. */

export const TIER_DAY_TYPES = ["any", "weekend", "weekday"] as const;

/** Etiquetas en español de los tipos de noche, para los <select> del panel. */
export const TIER_DAY_TYPE_LABEL: Record<TierDayType, string> = {
  any: "Todos los días",
  weekend: "Fin de semana y festivos",
  weekday: "Lunes a jueves",
};

export const MIN_STAY_RULE_TYPES = ["holiday_bridge", "date_range"] as const;
export type MinStayRuleType = (typeof MIN_STAY_RULE_TYPES)[number];

/**
 * Estados de una reserva, en el orden del ciclo de vida.
 *
 *   pending   → solicitud recibida. Si viene del sitio, con hold de 48 h; si la
 *               registra el equipo, sin vencimiento. Ocupa calendario mientras
 *               el hold esté vivo.
 *   confirmed → el equipo la dio por buena. Ocupa calendario SIN vencimiento.
 *               Es el estado nuevo del motor de reservas: separa "alguien lo
 *               pidió" de "está apalabrado", que antes se confundían.
 *   paid      → pago recibido (fase Wompi; hoy no lo pone nadie automáticamente).
 *   cancelled → no ocupa nada.
 *   external  → registrada a mano desde Airbnb/Booking/otro canal.
 */
export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "paid",
  "cancelled",
  "external",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_SOURCES = ["web", "airbnb", "booking", "manual"] as const;
export type BookingSource = (typeof BOOKING_SOURCES)[number];

/** Etiquetas en español para la interfaz. */
export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  paid: "Pagada",
  cancelled: "Cancelada",
  external: "Canal externo",
};

export const BOOKING_SOURCE_LABEL: Record<BookingSource, string> = {
  web: "Solicitud web",
  airbnb: "Airbnb",
  booking: "Booking.com",
  manual: "Registro manual",
};

/**
 * Estados que ocupan calendario (bloquean fechas).
 *
 * OJO: para los `pending` esto es condición necesaria pero no suficiente — un
 * hold vencido no ocupa nada. La regla completa está en
 * `@/lib/booking/holds`.`occupiesCalendar()`.
 */
export const OCCUPYING_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "paid",
  "external",
];

export type AdminBooking = {
  id: string;
  accommodation_id: string;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  total_cop: number;
  status: BookingStatus;
  source: BookingSource;
  payment_ref: string | null;
  created_at: string;
  updated_at: string;
  /** Nombre del alojamiento (join). */
  accommodation_name: string | null;

  /* --- Motor de reservas ------------------------------------------------- */
  /** Código legible ("LM-7F3K"). `null` en las reservas registradas a mano. */
  booking_code: string | null;
  /** Vencimiento del hold. `null` = no vence. */
  expires_at: string | null;
  /** Notas del huésped y anotaciones del sistema. */
  notes: string | null;
  /** Idioma en el que el huésped hizo la solicitud. */
  locale: string | null;
};

export type AdminBlockedDate = {
  id: string;
  accommodation_id: string;
  /** Valor crudo de Postgres, p. ej. "[2026-08-12,2026-08-15)". */
  date_range: string;
  /** Primer día bloqueado (inclusive). */
  start: string;
  /** Día de liberación (exclusivo): la noche anterior es la última bloqueada. */
  end: string;
  reason: string | null;
  created_at: string;
  accommodation_name: string | null;
};

/** Opción mínima para los <select> de alojamiento. */
export type AccommodationOption = {
  id: string;
  name: string;
  price_per_night_cop: number;
  capacity: number;
};

/** Resultado uniforme de las Server Actions usadas con `useActionState`. */
export type ActionState = {
  status: "idle" | "ok" | "error";
  message: string;
};

export const IDLE_STATE: ActionState = { status: "idle", message: "" };

export function errorState(message: string): ActionState {
  return { status: "error", message };
}

export function okState(message: string): ActionState {
  return { status: "ok", message };
}
