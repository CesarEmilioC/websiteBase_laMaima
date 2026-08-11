import { WhatsAppIcon } from "./icons";
import { getContactInfo } from "@/lib/content";
import { GENERAL_MESSAGE, whatsappUrl } from "@/lib/whatsapp";

/**
 * Botón flotante de WhatsApp, presente en TODAS las páginas del sitio, pero
 * SOLO por debajo de `lg` (1024px).
 *
 * - Fijo abajo a la derecha, por encima del contenido.
 * - Desde `lg` desaparece: ahí el CTA "Reservar" del header cumple ese papel
 *   y tener los dos duplicaba la misma acción. El header usa el mismo
 *   breakpoint a la inversa, así que siempre hay exactamente un CTA visible.
 * - Va en el verde de marca (no en el verde de WhatsApp) porque es un CTA
 *   general del sitio; el #25D366 queda reservado para los botones
 *   contextuales de cada alojamiento y experiencia.
 * - Accesible: es un enlace real con aria-label y área táctil de 56px.
 *
 * Server component asíncrono: lee el número de WhatsApp editado desde el
 * panel (`getContactInfo()`, cacheada) en vez del fallback hardcodeado.
 */
export async function WhatsAppFloat() {
  const contact = await getContactInfo();

  return (
    <a
      href={whatsappUrl(GENERAL_MESSAGE, contact.whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-forest-600 text-white shadow-float transition-[background-color,transform] duration-200 ease-ios hover:scale-[1.04] hover:bg-forest-700 focus-visible:outline-offset-4 active:scale-95 sm:bottom-6 sm:right-6 sm:h-[3.75rem] sm:w-[3.75rem] lg:hidden"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
