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
import { dict } from "@/lib/i18n";
import { HTML_LANG, localePath, type Locale } from "@/lib/i18n/config";
import { lowestRate } from "@/lib/pricing";
import { lodgingId, websiteId } from "@/lib/seo";
import { absoluteUrl, SITE } from "@/lib/site";

/**
 * Armazón de las rutas públicas: isla de navegación, contenido y pie, más el
 * botón flotante de WhatsApp que acompaña al visitante en todo el sitio.
 *
 * Lo usan los DOS layouts raíz públicos —`app/(es)/layout.tsx` y
 * `app/en/layout.tsx`—, que se limitan a pasarle el idioma. Toda la diferencia
 * entre las dos versiones del sitio cabe en ese parámetro.
 *
 * Server component asíncrono: `SiteHeader` es cliente y no puede leer Supabase,
 * así que el contacto (con fallback ya resuelto) se obtiene aquí y baja por
 * props. `SiteFooter` y `WhatsAppFloat` son server components y llaman a
 * `getContactInfo()` por su cuenta (la misma consulta cacheada, sin viajes de
 * red repetidos).
 *
 * Aquí también se emite el grafo de datos estructurados del negocio, que
 * acompaña a TODAS las páginas públicas y solo a ellas.
 */
export async function PublicShell({
  locale,
  children,
}: Readonly<{ locale: Locale; children: React.ReactNode }>) {
  const [contact, ogImage, accommodations] = await Promise.all([
    getContactInfo(),
    getOgImage(locale),
    getAccommodations(locale),
  ]);

  const t = dict(locale);
  const english = locale === "en";
  const homeUrl = absoluteUrl(localePath(locale, "/"));
  const description = english ? SITE.descriptionEn : SITE.description;

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
    ? `${formatCOP(Math.min(...prices))} - ${formatCOP(Math.max(...prices))} COP ${
        english ? "per night" : "por noche"
      }`
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

  /* Cada versión del sitio publica su propio grafo, con sus `@id` y su
     `inLanguage`; el vínculo entre las dos lo hace el `hreflang`. Ver
     `lodgingId()` en `@/lib/seo`. */
  const lodging = {
    "@type": "LodgingBusiness",
    "@id": lodgingId(locale),
    name: SITE.legalName,
    alternateName: SITE.name,
    description,
    slogan: english ? SITE.taglineEn : SITE.tagline,
    url: homeUrl,
    telephone: contact.phoneDisplay,
    image: images,
    logo: absoluteUrl("/logo-lamaima.png"),
    ...(priceRange ? { priceRange } : {}),
    currenciesAccepted: "COP",
    /* El sitio y la atención existen en los dos idiomas: se declara la lista
       completa, no solo el de esta página. */
    availableLanguage: ["es", "en"],
    inLanguage: HTML_LANG[locale],
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
      unitText: english ? "houses and cabins" : "casas y cabañas",
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
    amenityFeature: (english
      ? [
          "Fitted kitchenette",
          "Private bathroom with hot water",
          "Trails through native forest",
          "Natural river pool",
          "Fire pit",
          "Birdwatching",
          "Parking",
          "Pet friendly",
        ]
      : [
          "Cocineta equipada",
          "Baño privado con agua caliente",
          "Senderos por bosque nativo",
          "Piscina natural de río",
          "Fogata",
          "Avistamiento de aves",
          "Parqueadero",
          "Admite mascotas",
        ]
    ).map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
    /* Las seis fichas, enlazadas por `@id` al nodo `Accommodation` que publica
       cada una de ellas. Es lo que le dice al buscador que las páginas de
       alojamiento pertenecen a este hotel y no son productos sueltos. */
    ...(accommodations.length
      ? {
          containsPlace: accommodations.map((item) => {
            const url = absoluteUrl(
              localePath(locale, `/alojamientos/${item.slug}`),
            );
            return {
              "@type": "Accommodation",
              "@id": `${url}#accommodation`,
              name: item.name,
              url,
              occupancy: {
                "@type": "QuantitativeValue",
                maxValue: item.capacity,
                unitCode: "C62",
              },
            };
          }),
        }
      : {}),
    ...(published.length
      ? {
          makesOffer: published.map((item) => {
            const from = lowestRate(item.tiers, item.price_per_night_cop);
            const url = absoluteUrl(
              localePath(locale, `/alojamientos/${item.slug}`),
            );
            return {
              "@type": "Offer",
              name: item.name,
              url,
              price: from.amountCop,
              priceCurrency: "COP",
              availability: "https://schema.org/InStock",
              itemOffered: { "@id": `${url}#accommodation` },
            };
          }),
        }
      : {}),
  };

  const website = {
    "@type": "WebSite",
    "@id": websiteId(locale),
    url: homeUrl,
    name: SITE.name,
    description,
    inLanguage: HTML_LANG[locale],
    publisher: { "@id": lodgingId(locale) },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-brand-600 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:shadow-pill"
      >
        {t.nav.skipToContent}
      </a>

      <SiteHeader
        locale={locale}
        whatsapp={contact.whatsapp}
        addressLine={contact.addressLine}
        phoneDisplay={contact.phoneDisplay}
        phoneHref={contact.phoneHref}
      />

      <main id="contenido" className="flex-1">
        {children}
      </main>

      <SiteFooter locale={locale} />
      <WhatsAppFloat locale={locale} />
      {/* Un único observador para todas las entradas al hacer scroll: los
          componentes de servidor solo marcan `data-reveal`. Ver
          `reveal-observer.tsx`. */}
      <RevealObserver />

      {/* Va en el armazón (y no en cada página) porque describe el negocio, no
          el documento: así viaja en el esqueleto estático de TODAS las rutas
          públicas, por delante del contenido que se transmite después. */}
      <JsonLd graph={[lodging, website]} />
    </div>
  );
}
