import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { getContactInfo } from "@/lib/content";
import { OG_IMAGE, SITE } from "@/lib/site";

/**
 * Tipografía única para todo el sitio (titulares y cuerpo).
 *
 * El stack de `--font-sans` en `globals.css` prioriza SF Pro cuando el sistema
 * la tiene (Apple) y cae en Inter en el resto de plataformas: mismo dibujo
 * geométrico-neogrotesco, misma métrica óptica, cero serifas.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
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
    images: [{ ...OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  formatDetection: { telephone: true, address: true, email: true },
};

export const viewport: Viewport = {
  /* El header es una barra translúcida clara: la barra del navegador móvil
     debe fundirse con ella, no con el verde. */
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const contact = await getContactInfo();

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
    image: [`${SITE.url}${OG_IMAGE.url}`],
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
    /* `inter.variable` va en <html> (no en <body>) a propósito: el token
       `--font-sans` que Tailwind emite en `:root` referencia `var(--font-inter)`,
       y una custom property solo se sustituye con los valores declarados en el
       MISMO elemento. Si la clase viviera en <body>, `--font-sans` se calcularía
       en :root sin conocer `--font-inter`, quedaría inválida y el sitio caería
       al stack por defecto del navegador. */
    <html lang="es" className={inter.variable}>
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
