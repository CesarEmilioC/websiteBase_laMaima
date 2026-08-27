import { RevealObserver } from "@/components/reveal-observer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { getContactInfo } from "@/lib/content";

/**
 * Layout de las rutas públicas: header fijo, contenido y footer, más el botón
 * flotante de WhatsApp que acompaña al visitante en todo el sitio.
 *
 * Server component asíncrono: `SiteHeader` es cliente y no puede leer
 * Supabase, así que el contacto (con fallback ya resuelto) se obtiene aquí y
 * baja por props. `SiteFooter` y `WhatsAppFloat` son server components y
 * llaman a `getContactInfo()` por su cuenta (la misma consulta cacheada, sin
 * viajes de red repetidos).
 */
export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const contact = await getContactInfo();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-forest-600 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:shadow-pill"
      >
        Saltar al contenido
      </a>

      <SiteHeader
        whatsapp={contact.whatsapp}
        addressLine={contact.addressLine}
        phoneDisplay={contact.phoneDisplay}
        phoneHref={contact.phoneHref}
      />

      <main id="contenido" className="flex-1">
        {children}
      </main>

      <SiteFooter />
      <WhatsAppFloat />
      {/* Un único observador para todas las entradas al hacer scroll: los
          componentes de servidor solo marcan `data-reveal`. Ver
          `reveal-observer.tsx`. */}
      <RevealObserver />
    </div>
  );
}
