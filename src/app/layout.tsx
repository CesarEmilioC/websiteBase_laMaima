import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import "./globals.css";
import { getContactInfo, getOgImage } from "@/lib/content";
import { absoluteUrl, SITE } from "@/lib/site";

/**
 * Tipografía de CUERPO e interfaz.
 *
 * El stack de `--font-sans` en `globals.css` prioriza SF Pro cuando el sistema
 * la tiene (Apple) y cae en Inter en el resto de plataformas: mismo dibujo
 * geométrico-neogrotesco, misma métrica óptica.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Tipografía de TITULARES.
 *
 * El wordmark "LA MAIMA" del logotipo es una didona: astas muy gruesas,
 * finales muy finos y remates planos sin corchete. Playfair Display es la
 * traducción tipográfica directa de ese dibujo —se eligió sobre Cormorant
 * (humanista, de contraste bajo, no rima con el logo) y sobre Fraunces (serifa
 * blanda y algo excéntrica, demasiado informal para "lujo + naturaleza")—.
 *
 * Se carga EXACTAMENTE lo que se usa: el peso 400 en redonda y en itálica, y
 * nada más. Cada corte de una serifa de display pesa unos 38 kB —tanto como
 * media portada— y en la portada compite por ancho de banda con la fotografía
 * que marca el LCP. La itálica sí entra porque es el recurso de jerarquía de
 * todos los titulares del sitio; el peso 500, que no usa ni un solo elemento,
 * se quitó tras medir con Lighthouse.
 */
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  /**
   * SIN precarga, a diferencia de Inter.
   *
   * `next/font` inyecta por defecto un `<link rel="preload">` por corte, y esos
   * dos ficheros salían de la línea de salida con la MISMA prioridad que la
   * fotografía de portada, que es la que marca el LCP. Quitarles la precarga
   * deja el ancho de banda inicial para la imagen; la serifa llega un instante
   * después y los titulares cambian de fuente sin mover un píxel, porque
   * `next/font` genera un sustituto con las métricas ajustadas (el CLS medido
   * sigue siendo 0).
   *
   * Inter SÍ se precarga: es la fuente del cuerpo, de la navegación y de los
   * botones, o sea de casi todo lo que se ve en el primer pintado.
   */
  preload: false,
});

/**
 * `generateMetadata` (y no un `metadata` estático) porque la imagen de
 * OpenGraph/Twitter se edita en `/admin/contenido` (`site_content.seo`, ver
 * `getOgImage()` en `@/lib/content`) y necesita leerse en cada request.
 */
export async function generateMetadata(): Promise<Metadata> {
  const ogImage = await getOgImage();

  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: `${SITE.name} — Hotel campestre y reserva natural en Dapa, Yumbo`,
      template: `%s · ${SITE.name}`,
    },
    description: SITE.description,
    applicationName: SITE.name,
    keywords: [
      "hotel campestre Dapa",
      "cabañas Dapa",
      "reserva natural Yumbo",
      "alojamiento Valle del Cauca",
      "hotel cerca de Cali",
      "La Maima",
      "ecohotel Colombia",
    ],
    authors: [{ name: SITE.legalName }],
    creator: SITE.legalName,
    publisher: SITE.legalName,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "es_CO",
      url: SITE.url,
      siteName: SITE.name,
      title: `${SITE.name} — ${SITE.tagline}`,
      description: SITE.description,
      images: [{ ...ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE.name} — ${SITE.tagline}`,
      description: SITE.description,
      images: [ogImage.url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    formatDetection: { telephone: true, address: true, email: true },
  };
}

export const viewport: Viewport = {
  /* El header es una barra de vidrio AZUL MARINO fija sobre la foto de
     portada: la barra del navegador móvil se funde con ella, no con el fondo
     de la página. */
  themeColor: "#101d34",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [contact, ogImage] = await Promise.all([getContactInfo(), getOgImage()]);

  /**
   * Datos estructurados (schema.org) del hotel. Google los usa para el panel
   * de conocimiento y los resultados enriquecidos de alojamiento.
   *
   * `telephone`, `address` y `sameAs` salen de `getContactInfo()` (editable
   * desde `/admin/contenido`, con fallback a `SITE` si la fila falta).
   */
  const lodgingJsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": `${SITE.url}/#lodging`,
    name: SITE.legalName,
    alternateName: SITE.name,
    description: SITE.description,
    slogan: SITE.tagline,
    url: SITE.url,
    telephone: contact.phoneDisplay,
    image: [absoluteUrl(ogImage.url)],
    logo: `${SITE.url}/logo-lamaima.png`,
    priceRange: "$$",
    currenciesAccepted: "COP",
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
    amenityFeature: [
      "Cocineta equipada",
      "Baño privado",
      "Senderos ecológicos",
      "Piscina natural de río",
      "Fogata",
      "Avistamiento de aves",
      "Parqueadero",
    ].map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
  };

  return (
    /* Las dos variables de fuente van en <html> (no en <body>) a propósito:
       los tokens `--font-sans` y `--font-display` que Tailwind emite en `:root`
       referencian `var(--font-inter)` y `var(--font-playfair)`, y una custom
       property solo se sustituye con los valores declarados en el MISMO
       elemento. Si las clases vivieran en <body>, ambos tokens se calcularían
       en :root sin conocer las variables, quedarían inválidos y el sitio caería
       al stack por defecto del navegador. */
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased">
        {children}
        <script
          type="application/ld+json"
          // El objeto es estático y lo controlamos nosotros: no hay entrada de
          // usuario que pueda inyectarse aquí.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(lodgingJsonLd) }}
        />
      </body>
    </html>
  );
}
