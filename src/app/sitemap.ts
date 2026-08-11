import type { MetadataRoute } from "next";

import { getAccommodations } from "@/lib/content";
import { SITE } from "@/lib/site";

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

  return [...staticRoutes, ...accommodationRoutes];
}
