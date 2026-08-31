import type { Metadata } from "next";

import { NotFoundPage } from "@/components/pages/not-found-page";
import { dict } from "@/lib/i18n";

export const metadata: Metadata = {
  title: dict("es").notFound.metaTitle,
  robots: { index: false, follow: false },
};

/**
 * 404 del sitio: la que ve cualquier dirección que no exista en el árbol
 * español, y la que se pinta cuando una ficha llama a `notFound()`.
 *
 * Vive un nivel POR ENCIMA de `(site)`, así que no hereda la cabecera ni el pie:
 * una página de error no necesita navegación, necesita un camino de vuelta.
 *
 * `export const revalidate` (y no `force-dynamic`): la 404 no depende de
 * ninguna sesión y se sirve igual para todo el mundo. La foto de fondo se edita
 * en `/admin/contenido` (`site_content.not_found`) y el guardado fuerza una
 * revalidación inmediata.
 */
export const revalidate = 3600;

export default function NotFound() {
  return <NotFoundPage locale="es" />;
}
