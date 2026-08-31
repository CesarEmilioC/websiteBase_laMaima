import { WhatsAppFloatButton } from "./whatsapp-float-button";
import { getContactInfo } from "@/lib/content";
import { dict } from "@/lib/i18n";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { generalMessage, whatsappUrl } from "@/lib/whatsapp";

/**
 * Botón flotante de WhatsApp, presente en TODAS las páginas del sitio y en
 * TODOS los tamaños de pantalla, incluido escritorio (`lg` en adelante).
 *
 * - Fijo abajo a la derecha, por encima del contenido.
 * - Petición explícita del cliente final: quiere el flotante también en
 *   escritorio, aunque ahí ya exista el CTA "Reservar" del header
 *   (`SiteHeader`). Los dos coexisten a propósito — no es una duplicación a
 *   evitar, es la disponibilidad que pidió el cliente.
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
export async function WhatsAppFloat({
  locale = DEFAULT_LOCALE,
}: {
  locale?: Locale;
}) {
  const contact = await getContactInfo();

  return (
    <WhatsAppFloatButton
      href={whatsappUrl(generalMessage(locale), contact.whatsapp)}
      label={dict(locale).common.whatsappFloat}
    />
  );
}
