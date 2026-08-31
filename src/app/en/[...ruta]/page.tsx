import { notFound } from "next/navigation";

/**
 * Comodín del árbol inglés: cualquier `/en/...` que no exista termina en la 404
 * inglesa (`app/en/not-found.tsx`) en vez de en la genérica de Next.
 *
 * Al llevar el segmento `/en` es MÁS específica que el comodín de la raíz, así
 * que gana el emparejamiento. Ver la nota larga en
 * `app/(es-root)/[...ruta]/page.tsx`.
 */
export default function CatchAll(): never {
  notFound();
}
