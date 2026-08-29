import type { MetadataRoute } from "next";

import { getAccommodations, getLastModified } from "@/lib/content";
import { LEGAL_UPDATED_ISO } from "@/lib/legal";
import { LEGAL_LINKS, SITE } from "@/lib/site";

export const revalidate = 3600;

/**
 * Mapa del sitio.
 *
 * Dos decisiones que importan:
 *
 *   · **`lastmod` real.** Antes las doce entradas llevaban `new Date()`, es
 *     decir la hora del despliegue: le decía al buscador que la política de
 *     privacidad cambia cada vez que se recompila el sitio. Un `lastmod` que
 *     miente hace que Google deje de usarlo —en todo el dominio, no solo en
 *     esa fila—, así que ahora sale de las columnas `updated_at` que mantiene
 *     el panel, y la de los documentos legales, de la fecha de revisión del
 *     texto.
 *
 *   · **Las direcciones son EXACTAMENTE las canónicas** que publica cada
 *     página (`SITE.url` sin barra final incluida). Un sitemap que lista
 *     `https://.../` mientras la página se declara canónica en
 *     `https://...` son dos señales distintas para la misma URL.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [accommodations, modified] = await Promise.all([
    getAccommodations(),
    getLastModified(),
  ]);

  /* Respaldo para cuando Supabase no responde durante el build: mejor la fecha
     del despliegue que ninguna. */
  const fallback = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE.url,
      lastModified:
        modified.siteContent ?? modified.accommodationsLatest ?? fallback,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE.url}/alojamientos`,
      lastModified: modified.accommodationsLatest ?? fallback,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE.url}/experiencias`,
      lastModified: modified.experiences ?? fallback,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const accommodationRoutes: MetadataRoute.Sitemap = accommodations.map(
    (accommodation) => ({
      url: `${SITE.url}/alojamientos/${accommodation.slug}`,
      lastModified: modified.accommodations.get(accommodation.slug) ?? fallback,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  );

  // Los documentos legales cambian muy de vez en cuando y no compiten por
  // posicionamiento, pero deben ser rastreables: la pasarela de pagos exige
  // que estén publicados y accesibles desde el sitio. Su fecha es la de la
  // última revisión del TEXTO, no la del despliegue.
  const legalRoutes: MetadataRoute.Sitemap = LEGAL_LINKS.map((link) => ({
    url: `${SITE.url}${link.href}`,
    lastModified: new Date(`${LEGAL_UPDATED_ISO}T00:00:00Z`),
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  return [...staticRoutes, ...accommodationRoutes, ...legalRoutes];
}
