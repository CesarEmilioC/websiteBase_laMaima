import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { getOgImage } from "@/lib/content";
import { SITE } from "@/lib/site";

/**
 * ÚNICA tipografía del sitio (v2.1).
 *
 * El stack de `--font-sans` en `globals.css` prioriza SF Pro cuando el sistema
 * la tiene (Apple) y cae en Inter en el resto de plataformas: mismo dibujo
 * geométrico-neogrotesco, misma métrica óptica. Titulares, cuerpo e interfaz
 * comparten familia y se distinguen por cuerpo, peso e interletraje.
 *
 * La serifa de display (Playfair Display) que introdujo el rediseño v2 SE
 * RETIRÓ del bundle por decisión del cliente: dos cortes de una serifa de alto
 * contraste pesaban unos 76 kB que ya no pinta nadie, y en la portada competían
 * por ancho de banda con la fotografía que marca el LCP.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
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
    /**
     * NO se declara `alternates.canonical` aquí.
     *
     * El canónico se hereda, y un canónico heredado es un canónico equivocado:
     * el 404 —que es `noindex`— estaba publicando `<link rel="canonical">`
     * apuntando a la portada, que es exactamente la señal contradictoria que
     * hay que evitar. Cada página declara el suyo (todas lo hacen a través de
     * `pageMetadata()`), y la que no lo declare se queda sin él, que es el
     * fallo seguro.
     */
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /* La variable de fuente va en <html> (no en <body>) a propósito: el token
       `--font-sans` que Tailwind emite en `:root` referencia
       `var(--font-inter)`, y una custom property solo se sustituye con los
       valores declarados en el MISMO elemento. Si la clase viviera en <body>,
       el token se calcularía en :root sin conocer la variable, quedaría
       inválido y el sitio caería al stack por defecto del navegador. */
    <html lang="es" className={inter.variable}>
      {/* Los datos estructurados del hotel NO se emiten aquí sino en el layout
          de `(public)`: este layout envuelve también el panel de
          administración, y allí ni hacen falta ni deben costar una consulta a
          Supabase en cada carga. Ver `app/(public)/layout.tsx`. */}
      <body className="antialiased">{children}</body>
    </html>
  );
}
