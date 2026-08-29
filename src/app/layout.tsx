import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import "./globals.css";
import { getOgImage } from "@/lib/content";
import { SITE } from "@/lib/site";

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
    /* Las dos variables de fuente van en <html> (no en <body>) a propósito:
       los tokens `--font-sans` y `--font-display` que Tailwind emite en `:root`
       referencian `var(--font-inter)` y `var(--font-playfair)`, y una custom
       property solo se sustituye con los valores declarados en el MISMO
       elemento. Si las clases vivieran en <body>, ambos tokens se calcularían
       en :root sin conocer las variables, quedarían inválidos y el sitio caería
       al stack por defecto del navegador. */
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      {/* Los datos estructurados del hotel NO se emiten aquí sino en el layout
          de `(public)`: este layout envuelve también el panel de
          administración, y allí ni hacen falta ni deben costar una consulta a
          Supabase en cada carga. Ver `app/(public)/layout.tsx`. */}
      <body className="antialiased">{children}</body>
    </html>
  );
}
