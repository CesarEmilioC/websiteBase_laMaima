import { WhatsAppFloatButton } from "./whatsapp-float-button";
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
 * - Se aparta solo cuando el visitante llega al motor de reservas (ver
 *   `whatsapp-float-button.tsx`).
 *
 * Este archivo es un server component asíncrono y su único trabajo es leer el
 * número de WhatsApp que edita el panel (`getContactInfo()`, cacheada) y
 * armar el enlace. La pastilla y su comportamiento viven en el componente de
 * cliente: así el número sigue resolviéndose en el servidor —sin enviar la
 * consulta ni el fallback al navegador— y solo viaja al cliente la URL ya
 * construida.
 */
export async function WhatsAppFloat() {
  const contact = await getContactInfo();

  return (
    <WhatsAppFloatButton
      href={whatsappUrl(GENERAL_MESSAGE, contact.whatsapp)}
    />
  );
}
