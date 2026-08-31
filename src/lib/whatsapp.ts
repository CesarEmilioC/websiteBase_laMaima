import { formatLongDate } from "./dates";
import { formatCOP, formatGuests, formatNights } from "./format";
import { DEFAULT_LOCALE, type Locale } from "./i18n/config";
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

/**
 * IDIOMA DE LOS MENSAJES
 * ----------------------
 * El mensaje de WhatsApp se traduce y el correo transaccional NO. Es
 * deliberado: el correo lo lee el equipo de La Maima (en español) y llega a un
 * buzón que se archiva; el WhatsApp lo escribe el VISITANTE con su propio dedo
 * y aparece en su pantalla antes de enviarlo. Un huésped extranjero al que la
 * página le redacta un mensaje en español no entiende lo que está a punto de
 * mandar —y el equipo, que atiende en los dos idiomas, prefiere saber de
 * entrada en cuál va a responder.
 */

/** Mensaje del botón flotante global (duda general), en español. */
export const GENERAL_MESSAGE = "Hola! Tengo una duda sobre La Maima";

const GENERAL_MESSAGE_EN = "Hi! I have a question about La Maima";

/** Mensaje del botón flotante global en el idioma del visitante. */
export function generalMessage(locale: Locale = DEFAULT_LOCALE): string {
  return locale === "en" ? GENERAL_MESSAGE_EN : GENERAL_MESSAGE;
}

/** Mensaje contextual desde la página de un alojamiento. */
export function accommodationMessage(
  name: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  return locale === "en"
    ? `Hi! I'm interested in ${name} at La Maima. Could you tell me more?`
    : `Hola! Estoy interesado en ${name} en La Maima. ¿Me puedes dar más información?`;
}

/** Mensaje contextual desde una experiencia. */
export function experienceMessage(
  name: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  return locale === "en"
    ? `Hi! I'm interested in the ${name} experience at La Maima. Could you tell me more?`
    : `Hola! Me interesa la experiencia ${name} en La Maima. ¿Me puedes dar más información?`;
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
 * estimado). Las fechas van en formato largo — "12 de septiembre de 2026" /
 * "12 September 2026" — porque un "12/09" se lee distinto según el país de
 * quien escribe.
 */
export function bookingRequestMessage(
  { accommodation, checkIn, checkOut, nights, guests, totalCop, detail }: BookingRequest,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const nightsLabel = formatNights(nights, locale);
  const guestsLabel =
    locale === "en"
      ? formatGuests(guests, "en")
      : `${guests} ${guests === 1 ? "huésped" : "huéspedes"}`;

  if (locale === "en") {
    const breakdown = detail ? `Breakdown: ${detail}. ` : "";
    return (
      `Hi! I'd like to book ${accommodation} from ${formatLongDate(checkIn, "en")} ` +
      `to ${formatLongDate(checkOut, "en")} (${nightsLabel}, ${guestsLabel}). ` +
      `${breakdown}Estimated total: ${formatCOP(totalCop)} COP. ` +
      `Could you confirm availability and payment?`
    );
  }

  const breakdown = detail ? `Detalle: ${detail}. ` : "";
  return (
    `Hola! Quiero reservar ${accommodation} del ${formatLongDate(checkIn, "es")} ` +
    `al ${formatLongDate(checkOut, "es")} (${nightsLabel}, ${guestsLabel}). ` +
    `${breakdown}Total estimado: ${formatCOP(totalCop)} COP. ` +
    `¿Me confirman disponibilidad y pago?`
  );
}
