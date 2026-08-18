import type { MetadataRoute } from "next";

import { getAccommodations } from "@/lib/content";
import { LEGAL_LINKS, SITE } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const accommodations = await getAccommodations();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE.url}/alojamientos`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE.url}/experiencias`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const accommodationRoutes: MetadataRoute.Sitemap = accommodations.map(
    (accommodation) => ({
      url: `${SITE.url}/alojamientos/${accommodation.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  );

  // Los documentos legales cambian muy de vez en cuando y no compiten por
  // posicionamiento, pero deben ser rastreables: la pasarela de pagos exige
  // que estén publicados y accesibles desde el sitio.
  const legalRoutes: MetadataRoute.Sitemap = LEGAL_LINKS.map((link) => ({
    url: `${SITE.url}${link.href}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  return [...staticRoutes, ...accommodationRoutes, ...legalRoutes];
}
