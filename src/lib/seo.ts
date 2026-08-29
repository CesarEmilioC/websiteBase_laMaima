/**
 * Capa compartida de SEO: metadatos por página y datos estructurados.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ EXISTE ESTE MÓDULO
 * ---------------------------------------------------------------------------
 * En el App Router los metadatos se heredan del layout raíz, pero la mezcla es
 * SUPERFICIAL: si una página declara su propio objeto `openGraph`, ese objeto
 * REEMPLAZA entero al del layout, no se funde con él. La consecuencia era real
 * y estaba en el HTML servido: todas las páginas internas del sitio perdían
 * `og:type`, `og:locale` y `og:site_name`, y las tres páginas legales se
 * quedaban directamente sin `og:image`.
 *
 * Lo mismo pasaba al revés con Twitter: como ninguna página interna declaraba
 * `twitter`, TODAS heredaban el del layout, así que la ficha de Casa Maima se
 * compartía en X con el título de la portada y la foto genérica del sitio.
 *
 * `pageMetadata()` arma las tres familias (canónica, OpenGraph y Twitter) de
 * una sola vez y a partir de los mismos datos, de modo que ninguna página
 * pueda volver a quedarse a medias.
 */
import type { Metadata } from "next";

import { absoluteUrl, SITE } from "./site";

/* ---------------------------------------------------------------------------
 * Metadatos por página
 * ------------------------------------------------------------------------- */

export type SeoImage = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
};

export type PageSeo = {
  /**
   * Título de la pestaña SIN la marca: la plantilla del layout raíz
   * (`%s · La Maima`) la añade. Debe quedar por debajo de unos 50 caracteres
   * para que, con la marca, el resultado completo no se corte en Google.
   */
  title: string;
  /** ~150 caracteres. Es lo que se lee bajo el enlace en el buscador. */
  description: string;
  /** Ruta canónica de la página, siempre con barra inicial y sin barra final. */
  path: string;
  /** Imagen de la tarjeta social. Sin ella se usa la genérica del sitio. */
  image: SeoImage;
  /**
   * Título para redes sociales. Ahí no hay plantilla que añada la marca, así
   * que por defecto se compone `"<título> · La Maima"`.
   */
  socialTitle?: string;
  /** Texto para redes cuando la descripción del buscador resulta demasiado técnica. */
  socialDescription?: string;
};

export function pageMetadata({
  title,
  description,
  path,
  image,
  socialTitle,
  socialDescription,
}: PageSeo): Metadata {
  const social = socialTitle ?? `${title} · ${SITE.name}`;
  const socialText = socialDescription ?? description;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      // Estas tres se repiten en cada página A PROPÓSITO: no se heredan.
      type: "website",
      locale: "es_CO",
      siteName: SITE.name,
      url: path,
      title: social,
      description: socialText,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: social,
      description: socialText,
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}

/* ---------------------------------------------------------------------------
 * Descripciones
 * ------------------------------------------------------------------------- */

/** Longitud a partir de la cual Google empieza a recortar la descripción. */
export const DESCRIPTION_LIMIT = 160;

/**
 * Compone una descripción a partir del texto del cliente más la cola de
 * contexto MÁS LARGA que quepa dentro del límite.
 *
 * Las descripciones de las seis fichas salen de `short_description`, que la
 * administradora edita desde el panel y mide entre 90 y 125 caracteres: sobra
 * sitio para añadir dónde está el alojamiento y desde cuánto sale, que es
 * justo lo que decide el clic. Pero ese texto puede crecer mañana, así que la
 * cola se elige en tiempo de render: se prueban de la más informativa a la más
 * escueta y se toma la primera que entre. Nunca se parte una frase por la
 * mitad, y si algún día el texto base ya no deja sitio para ninguna cola, se
 * publica solo.
 *
 * `tails` debe venir ordenada de más larga a más corta.
 */
export function composeDescription(
  base: string,
  tails: string[],
  limit = DESCRIPTION_LIMIT,
): string {
  const clean = base.trim().replace(/\s+/g, " ");

  for (const tail of tails) {
    const candidate = tail ? `${clean} ${tail.trim()}` : clean;
    if (candidate.length <= limit) return candidate;
  }

  if (clean.length <= limit) return clean;

  // Último recurso: el texto base por sí solo ya no cabe. Se corta por la
  // última palabra entera para no dejar una sílaba suelta antes de los puntos
  // suspensivos.
  const cut = clean.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, "")}…`;
}

/**
 * Colas de contexto de una ficha de alojamiento, de la más informativa a la
 * más escueta. `price` ya viene formateado ("$495.000"); si el alojamiento no
 * tiene tabla de tarifas publicada se pasa `null` y ninguna cola promete un
 * precio que la ficha no muestra.
 */
export function accommodationTails(price: string | null): string[] {
  if (price === null) {
    return [
      "Alojamiento en La Maima, reserva natural en Dapa (Yumbo).",
      "En La Maima, reserva natural en Dapa (Yumbo).",
      "La Maima, Dapa (Yumbo).",
      "",
    ];
  }

  return [
    `Alojamiento en La Maima, reserva natural en Dapa (Yumbo). Desde ${price} la noche.`,
    `En La Maima, reserva natural en Dapa (Yumbo). Desde ${price} la noche.`,
    `En La Maima, Dapa (Yumbo). Desde ${price} la noche.`,
    `La Maima, Dapa (Yumbo). Desde ${price}.`,
    `Dapa, Yumbo. Desde ${price}.`,
    `Desde ${price} la noche.`,
    "",
  ];
}

/* ---------------------------------------------------------------------------
 * Datos estructurados
 * ------------------------------------------------------------------------- */

/** Identificadores estables del grafo. Se referencian entre sí con `@id`. */
export const LODGING_ID = `${SITE.url}/#lodging`;
export const WEBSITE_ID = `${SITE.url}/#website`;

export type Crumb = { name: string; path: string };

/**
 * `BreadcrumbList` de schema.org a partir de las MISMAS migas que se pintan en
 * pantalla (se pasan desde la página, no se duplican aquí): Google exige que
 * el marcado corresponda a algo visible.
 *
 * La última miga no lleva `item`: es la página actual y así lo recomienda la
 * documentación de resultados enriquecidos.
 */
export function breadcrumbList(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(crumbs[crumbs.length - 1]?.path ?? "/")}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      ...(index < crumbs.length - 1 ? { item: absoluteUrl(crumb.path) } : {}),
    })),
  };
}

/**
 * Serializa un grafo de datos estructurados para incrustarlo en un `<script>`.
 *
 * Escapa el signo de menor que como secuencia unicode: parte de lo que entra
 * aquí —descripciones,
 * nombres, textos alternativos— lo escribe la administradora en el panel, y un
 * `</script>` dentro de una cadena cerraría la etiqueta y volcaría el resto
 * como HTML. Es escapado JSON válido, así que ningún consumidor lo nota.
 */
export function serializeJsonLd(graph: unknown): string {
  return JSON.stringify(graph).replace(/</g, "\\u003c");
}
