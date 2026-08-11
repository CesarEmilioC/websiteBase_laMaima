import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // El panel de administración (fases siguientes) nunca debe indexarse.
        disallow: ["/admin", "/admin/"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
