import { formatLongDateEs } from "./dates";
import { formatCOP } from "./format";
import { SITE } from "./site";

/**
 * Construye un enlace wa.me con el mensaje prellenado y codificado.
 *
 *   whatsappUrl("Hola!") -> "https://wa.me/573113082813?text=Hola!"
 *
 * El número por defecto es el de `SITE.contact` (fallback hardcodeado); los
 * componentes que ya leyeron `getContactInfo()` deben pasar `contact.whatsapp`
 * explícitamente para usar el número editado desde el panel.
 */
export function whatsappUrl(
  message: string,
  whatsapp: string = SITE.contact.whatsapp,
): string {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
}

/** Mensaje del botón flotante global (duda general). */
export const GENERAL_MESSAGE = "Hola! Tengo una duda sobre La Maima";

/** Mensaje contextual desde la página de un alojamiento. */
export function accommodationMessage(name: string): string {
  return `Hola! Estoy interesado en ${name} en La Maima. ¿Me puedes dar más información?`;
}

/** Mensaje contextual desde una experiencia. */
export function experienceMessage(name: string): string {
  return `Hola! Me interesa la experiencia ${name} en La Maima. ¿Me puedes dar más información?`;
}

export type BookingRequest = {
  accommodation: string;
  /** Fechas ISO "YYYY-MM-DD" (las mismas que usa el calendario). */
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  /** Total estimado en COP: suma de las noches ya cotizadas. */
  totalCop: number;
  /**
   * Desglose corto de la cotización, ya en texto:
   * "2 noches × $570.000 · 1 noche × $427.500 · Desayuno incluido".
   * Va en el mensaje porque el precio ya no es una multiplicación simple y el
   * equipo tiene que poder verificar de un vistazo lo que vio el huésped.
   */
  detail?: string | null;
};

/**
 * Solicitud de reserva del motor público.
 *
 * Mientras no esté la pasarela, este mensaje ES la reserva: tiene que llegar
 * con todo lo que el equipo necesita para confirmar y cobrar sin una sola
 * pregunta de vuelta (alojamiento, fechas, noches, huéspedes y total
 * estimado). Las fechas van en formato largo — "12 de septiembre de 2026" —
 * porque un "12/09" se lee distinto según el país de quien escribe.
 */
export function bookingRequestMessage({
  accommodation,
  checkIn,
  checkOut,
  nights,
  guests,
  totalCop,
  detail,
}: BookingRequest): string {
  const nightsLabel = `${nights} ${nights === 1 ? "noche" : "noches"}`;
  const guestsLabel = `${guests} ${guests === 1 ? "huésped" : "huéspedes"}`;
  const breakdown = detail ? `Detalle: ${detail}. ` : "";

  return (
    `Hola! Quiero reservar ${accommodation} del ${formatLongDateEs(checkIn)} ` +
    `al ${formatLongDateEs(checkOut)} (${nightsLabel}, ${guestsLabel}). ` +
    `${breakdown}Total estimado: ${formatCOP(totalCop)} COP. ` +
    `¿Me confirman disponibilidad y pago?`
  );
}
