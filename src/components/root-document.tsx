import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "@/app/globals.css";
import { getOgImage, getVisibleStayCount } from "@/lib/content";
import { DEFAULT_LOCALE, HTML_LANG, type Locale } from "@/lib/i18n/config";
import { languageAlternates } from "@/lib/seo";
import { SITE, siteDescription } from "@/lib/site";

/**
 * Documento HTML del sitio.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ESTO ES UN COMPONENTE Y NO EL LAYOUT RAÍZ
 * ---------------------------------------------------------------------------
 * El sitio tiene TRES layouts raíz —español (`app/(es)`), inglés (`app/en`) y
 * panel (`app/admin`)— porque el atributo `lang` del `<html>` tiene que decir
 * la verdad en cada árbol, y solo un layout raíz puede pintar `<html>`. Un
 * único layout con `lang="es"` serviría el árbol inglés declarándose en
 * español: mal para los lectores de pantalla (que cambian la pronunciación con
 * ese atributo), mal para los traductores automáticos y una contradicción con
 * los `hreflang` que publicamos.
 *
 * El precio de tener tres layouts raíz es que la navegación ENTRE árboles
 * recarga la página entera. Aquí no molesta: solo ocurre al pulsar el
 * conmutador de idioma y al entrar o salir del panel, que es exactamente cuando
 * una recarga se espera.
 *
 * Para que esos tres layouts no se dupliquen, todo lo común —la tipografía, los
 * estilos globales, el `<body>` y los metadatos de marca— vive aquí.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * ÚNICA tipografía del sitio (v2.1).
 *
 * El stack de `--font-sans` en `globals.css` prioriza SF Pro cuando el sistema
 * la tiene (Apple) y cae en Inter en el resto de plataformas: mismo dibujo
 * geométrico-neogrotesco, misma métrica óptica. Titulares, cuerpo e interfaz
 * comparten familia y se distinguen por cuerpo, peso e interletraje.
 */
export function RootDocument({
  locale = DEFAULT_LOCALE,
  children,
}: {
  locale?: Locale;
  children: React.ReactNode;
}) {
  return (
    /* La variable de fuente va en <html> (no en <body>) a propósito: el token
       `--font-sans` que Tailwind emite en `:root` referencia
       `var(--font-inter)`, y una custom property solo se sustituye con los
       valores declarados en el MISMO elemento. Si la clase viviera en <body>,
       el token se calcularía en :root sin conocer la variable, quedaría
       inválido y el sitio caería al stack por defecto del navegador. */
    <html lang={HTML_LANG[locale]} className={inter.variable}>
      {/* Los datos estructurados del hotel NO se emiten aquí sino en
          `PublicShell`: este documento envuelve también el panel de
          administración, y allí ni hacen falta ni deben costar una consulta a
          Supabase en cada carga. */}
      <body className="antialiased">{children}</body>
    </html>
  );
}

export const VIEWPORT: Viewport = {
  /* El header es una isla de vidrio AZUL MARINO flotando sobre la foto de
     portada: la barra del navegador móvil se funde con ella, no con el fondo
     de la página. */
  themeColor: "#101d34",
  width: "device-width",
  initialScale: 1,
};

/**
 * Metadatos de marca del árbol público, por idioma.
 *
 * `generateMetadata` (y no un `metadata` estático) porque la imagen de
 * OpenGraph/Twitter se edita en `/admin/contenido` (`site_content.seo`, ver
 * `getOgImage()`) y necesita leerse en cada request.
 */
export async function rootMetadata(locale: Locale): Promise<Metadata> {
  const [ogImage, stays] = await Promise.all([
    getOgImage(locale),
    getVisibleStayCount(),
  ]);
  const english = locale === "en";

  /* Esta descripción es la RED DE SEGURIDAD del sitio: la hereda cualquier
     página que no declare la suya. Dice cuántas casas hay, y por eso el número
     sale de la base y no de una constante. Ver `siteDescription()`. */
  const description = siteDescription(stays, locale);
  const tagline = english ? SITE.taglineEn : SITE.tagline;

  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: english
        ? `${SITE.name} — Country hotel and nature reserve in Dapa, Colombia`
        : `${SITE.name} — Hotel campestre y reserva natural en Dapa, Yumbo`,
      template: `%s · ${SITE.name}`,
    },
    description,
    applicationName: SITE.name,
    keywords: english
      ? [
          "country hotel Dapa",
          "cabins near Cali",
          "nature reserve Yumbo",
          "where to stay Valle del Cauca",
          "eco lodge Colombia",
          "La Maima",
        ]
      : [
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
     * el 404 —que es `noindex`— publicaría `<link rel="canonical">` apuntando a
     * la portada, que es exactamente la señal contradictoria que hay que
     * evitar. Cada página declara el suyo a través de `pageMetadata()`, y la
     * que no lo declare se queda sin él, que es el fallo seguro.
     *
     * Los `hreflang` SÍ se declaran, apuntando a las dos portadas: son la
     * red de seguridad para cualquier página que llegue a heredarlos.
     */
    alternates: { languages: languageAlternates("/") },
    openGraph: {
      type: "website",
      locale: english ? "en_US" : "es_CO",
      url: english ? `${SITE.url}/en` : SITE.url,
      siteName: SITE.name,
      title: `${SITE.name} — ${tagline}`,
      description,
      images: [{ ...ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE.name} — ${tagline}`,
      description,
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
