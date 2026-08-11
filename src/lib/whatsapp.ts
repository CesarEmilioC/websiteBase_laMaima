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
