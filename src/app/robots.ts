import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // El panel de administración nunca debe indexarse.
          "/admin",
          "/admin/",
          /**
           * Las rutas de API no son páginas y no aportan nada al índice: una
           * devuelve rangos de disponibilidad en JSON y la otra un calendario
           * `.ics` para Airbnb y Booking. Bloquearlas no las cierra —las OTAs
           * se suscriben por dirección directa y no consultan robots.txt— pero
           * evita que aparezcan como resultados vacíos y ahorra rastreo.
           */
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
