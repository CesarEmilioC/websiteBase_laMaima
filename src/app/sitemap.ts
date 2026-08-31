import type { MetadataRoute } from "next";

import { getAccommodations, getLastModified } from "@/lib/content";
import { HREFLANG, localePath, LOCALES } from "@/lib/i18n/config";
import { LEGAL_UPDATED_ISO } from "@/lib/legal";
import { LEGAL_DOCS, SITE } from "@/lib/site";

export const revalidate = 3600;

/**
 * Mapa del sitio.
 *
 * Tres decisiones que importan:
 *
 *   · **`lastmod` real.** Antes las entradas llevaban `new Date()`, es decir la
 *     hora del despliegue: le decía al buscador que la política de privacidad
 *     cambia cada vez que se recompila el sitio. Un `lastmod` que miente hace
 *     que Google deje de usarlo —en todo el dominio, no solo en esa fila—, así
 *     que ahora sale de las columnas `updated_at` que mantiene el panel, y la de
 *     los documentos legales, de la fecha de revisión del texto.
 *
 *   · **Las direcciones son EXACTAMENTE las canónicas** que publica cada página
 *     (`SITE.url` sin barra final incluida). Un sitemap que lista
 *     `https://.../` mientras la página se declara canónica en `https://...`
 *     son dos señales distintas para la misma URL.
 *
 *   · **Cada página aparece DOS VECES, una por idioma, y ambas declaran sus
 *     `alternates`.** Es la forma que recomienda Google para los sitios
 *     multilingües: la fila española apunta a la inglesa y viceversa. Un
 *     `hreflang` que no es recíproco se descarta entero, así que las dos filas
 *     comparten exactamente el mismo mapa de idiomas.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [accommodations, modified] = await Promise.all([
    getAccommodations(),
    getLastModified(),
  ]);

  /* Respaldo para cuando Supabase no responde durante el build: mejor la fecha
     del despliegue que ninguna. */
  const fallback = new Date();

  /** Las dos direcciones absolutas de una ruta canónica, por idioma. */
  function alternates(path: string): Record<string, string> {
    const languages: Record<string, string> = {};
    for (const locale of LOCALES) {
      languages[HREFLANG[locale]] = `${SITE.url}${localePath(locale, path)}`.replace(
        /\/$/,
        "",
      );
    }
    return languages;
  }

  /**
   * Una entrada por idioma para la misma ruta canónica. Las dos comparten
   * `lastmod`, prioridad y frecuencia: es la misma página en dos lenguas, no dos
   * páginas distintas.
   */
  function entries(
    path: string,
    lastModified: Date,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: number,
  ): MetadataRoute.Sitemap {
    const languages = alternates(path);
    return LOCALES.map((locale) => ({
      url: languages[HREFLANG[locale]],
      lastModified,
      changeFrequency,
      priority,
      alternates: { languages },
    }));
  }

  return [
    ...entries(
      "/",
      modified.siteContent ?? modified.accommodationsLatest ?? fallback,
      "weekly",
      1,
    ),
    ...entries(
      "/alojamientos",
      modified.accommodationsLatest ?? fallback,
      "weekly",
      0.9,
    ),
    ...entries(
      "/experiencias",
      modified.experiences ?? fallback,
      "monthly",
      0.7,
    ),
    ...accommodations.flatMap((accommodation) =>
      entries(
        `/alojamientos/${accommodation.slug}`,
        modified.accommodations.get(accommodation.slug) ?? fallback,
        "weekly",
        0.8,
      ),
    ),
    // Los documentos legales cambian muy de vez en cuando y no compiten por
    // posicionamiento, pero deben ser rastreables: la pasarela de pagos exige
    // que estén publicados y accesibles desde el sitio. Su fecha es la de la
    // última revisión del TEXTO, no la del despliegue.
    ...LEGAL_DOCS.flatMap((doc) =>
      entries(
        doc.path,
        new Date(`${LEGAL_UPDATED_ISO}T00:00:00Z`),
        "yearly",
        0.3,
      ),
    ),
  ];
}
