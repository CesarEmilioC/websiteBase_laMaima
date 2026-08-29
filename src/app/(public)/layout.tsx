import { JsonLd } from "@/components/json-ld";
import { RevealObserver } from "@/components/reveal-observer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import {
  coverImage,
  getAccommodations,
  getContactInfo,
  getOgImage,
} from "@/lib/content";
import { formatCOP } from "@/lib/format";
import { lowestRate } from "@/lib/pricing";
import { LODGING_ID, WEBSITE_ID } from "@/lib/seo";
import { absoluteUrl, SITE } from "@/lib/site";

/**
 * Layout de las rutas públicas: header fijo, contenido y footer, más el botón
 * flotante de WhatsApp que acompaña al visitante en todo el sitio.
 *
 * Server component asíncrono: `SiteHeader` es cliente y no puede leer
 * Supabase, así que el contacto (con fallback ya resuelto) se obtiene aquí y
 * baja por props. `SiteFooter` y `WhatsAppFloat` son server components y
 * llaman a `getContactInfo()` por su cuenta (la misma consulta cacheada, sin
 * viajes de red repetidos).
 *
 * Aquí también se emite el grafo de datos estructurados del negocio, que
 * acompaña a TODAS las páginas públicas y solo a ellas.
 */
export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [contact, ogImage, accommodations] = await Promise.all([
    getContactInfo(),
    getOgImage(),
    getAccommodations(),
  ]);

  /* -------------------------------------------------------------------------
   * Rango de tarifas REAL
   * -----------------------------------------------------------------------
   * `priceRange` era un "$$" de plantilla, que no dice nada. Se calcula sobre
   * la tabla de tarifas por ocupación que publica el propio sitio —la más
   * barata de Tres Casitas y la más cara de Casa Maima— para que el dato del
   * buscador y el de la ficha no puedan contradecirse cuando la
   * administradora cambie un precio desde el panel.
   *
   * Los alojamientos sin tabla publicada (hoy Casa Uba, "tarifa por
   * confirmar") quedan fuera del cálculo: prometer su precio de respaldo sería
   * publicar una tarifa que la ficha no muestra.
   * ---------------------------------------------------------------------- */
  const published = accommodations.filter((item) => item.tiers.length > 0);
  const prices = published.flatMap((item) =>
    item.tiers.map((tier) => tier.price_cop),
  );
  const priceRange = prices.length
    ? `${formatCOP(Math.min(...prices))} - ${formatCOP(Math.max(...prices))} COP por noche`
    : undefined;

  /* Fotos del negocio: la de OpenGraph (editable en el panel) primero, y
     detrás las portadas de los tres alojamientos con más material. Google pide
     varias imágenes y las prefiere en proporciones distintas. */
  const images = [
    absoluteUrl(ogImage.url),
    ...accommodations
      .slice(0, 3)
      .map((item) => absoluteUrl(coverImage(item.gallery, item.name).url)),
  ];

  const lodging = {
    "@type": "LodgingBusiness",
    "@id": LODGING_ID,
    name: SITE.legalName,
    alternateName: SITE.name,
    description: SITE.description,
    slogan: SITE.tagline,
    url: SITE.url,
    telephone: contact.phoneDisplay,
    image: images,
    logo: absoluteUrl("/logo-lamaima.png"),
    ...(priceRange ? { priceRange } : {}),
    currenciesAccepted: "COP",
    availableLanguage: "es",
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.street,
      addressLocality: contact.locality,
      addressRegion: contact.region,
      addressCountry: "CO",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: SITE.geo.latitude,
      longitude: SITE.geo.longitude,
    },
    hasMap: contact.maps.url,
    sameAs: [contact.social.instagram, contact.social.facebook],
    /* Del documento oficial de políticas del cliente. */
    checkinTime: SITE.stay.checkIn,
    checkoutTime: SITE.stay.checkOut,
    petsAllowed: SITE.stay.petsAllowed,
    smokingAllowed: SITE.stay.smokingAllowed,
    numberOfRooms: {
      "@type": "QuantitativeValue",
      value: accommodations.length || SITE.stay.units,
      unitText: "casas y cabañas",
    },
    /* Capacidad total publicada: la suma de las seis fichas. */
    ...(accommodations.length
      ? {
          maximumAttendeeCapacity: accommodations.reduce(
            (total, item) => total + item.capacity,
            0,
          ),
        }
      : {}),
    amenityFeature: [
      "Cocineta equipada",
      "Baño privado con agua caliente",
      "Senderos por bosque nativo",
      "Piscina natural de río",
      "Fogata",
      "Avistamiento de aves",
      "Parqueadero",
      "Admite mascotas",
    ].map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
    /* Las seis fichas, enlazadas por `@id` al nodo `Accommodation` que publica
       cada una de ellas. Es lo que le dice al buscador que las páginas de
       alojamiento pertenecen a este hotel y no son productos sueltos. */
    ...(accommodations.length
      ? {
          containsPlace: accommodations.map((item) => ({
            "@type": "Accommodation",
            "@id": `${SITE.url}/alojamientos/${item.slug}#accommodation`,
            name: item.name,
            url: `${SITE.url}/alojamientos/${item.slug}`,
            occupancy: {
              "@type": "QuantitativeValue",
              maxValue: item.capacity,
              unitCode: "C62",
            },
          })),
        }
      : {}),
    ...(published.length
      ? {
          makesOffer: published.map((item) => {
            const from = lowestRate(item.tiers, item.price_per_night_cop);
            return {
              "@type": "Offer",
              name: item.name,
              url: `${SITE.url}/alojamientos/${item.slug}`,
              price: from.amountCop,
              priceCurrency: "COP",
              availability: "https://schema.org/InStock",
              itemOffered: {
                "@id": `${SITE.url}/alojamientos/${item.slug}#accommodation`,
              },
            };
          }),
        }
      : {}),
  };

  const website = {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    inLanguage: "es-CO",
    publisher: { "@id": LODGING_ID },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-brand-600 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:shadow-pill"
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

      {/* Va en el layout (y no en cada página) porque describe el negocio, no
          el documento: así viaja en el armazón estático de TODAS las rutas
          públicas, por delante del contenido que se transmite después. */}
      <JsonLd graph={[lodging, website]} />
    </div>
  );
}
