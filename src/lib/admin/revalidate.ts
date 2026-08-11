import { revalidatePath, revalidateTag } from "next/cache";

import { PUBLIC_CONTENT_TAG } from "@/lib/supabase/public";

/**
 * Publica en el sitio público los cambios hechos desde el panel.
 *
 * Hay DOS cachés que invalidar y hacen falta las dos:
 *
 *   1. `revalidateTag(PUBLIC_CONTENT_TAG)` — la "Data Cache": las respuestas
 *      de Supabase que Next guardó al renderizar. Sin esto, Next vuelve a
 *      renderizar la página pero con los datos viejos.
 *   2. `revalidatePath(...)` — la "Full Route Cache": el HTML ya generado.
 *
 * Sobre la forma de las llamadas a `revalidatePath`: para una ruta estática
 * se pasa SOLO la ruta. Añadirle el segundo argumento `"page"` no purga nada
 * (comprobado contra `next start` en 15.5). El segundo argumento sí es
 * necesario en `/alojamientos/[slug]`, donde se revalida el patrón de ruta
 * para cubrir de una vez todas las páginas de detalle, incluida la que acaba
 * de cambiar de slug.
 */
export function revalidatePublicSite() {
  revalidateTag(PUBLIC_CONTENT_TAG);

  revalidatePath("/");
  revalidatePath("/alojamientos");
  revalidatePath("/alojamientos/[slug]", "page");
  revalidatePath("/experiencias");
  revalidatePath("/sitemap.xml");
}
