import { notFound } from "next/navigation";

/**
 * Captura TODAS las direcciones que no existen y las manda a la 404 de la casa.
 *
 * POR QUÉ HACE FALTA ESTO. `app/not-found.tsx` es la 404 global de una
 * aplicación con UN layout raíz. Este sitio tiene tres —español, inglés y
 * panel— porque cada árbol declara su propio `<html lang>`, y en ese escenario
 * Next no puede saber con cuál de los tres envolver una dirección que no
 * pertenece a ninguno: sirve su 404 por defecto, la de fondo blanco y "This
 * page could not be found".
 *
 * Una ruta comodín sí pertenece a un árbol. Al llamar a `notFound()` desde
 * aquí, Next busca el `not-found.tsx` más cercano —el de este mismo árbol— y
 * pinta la 404 de La Maima, con su foto, su logotipo y sus dos caminos de
 * vuelta, en español y con la cabecera HTTP 404 correcta.
 *
 * Su gemela en `app/en/[...ruta]` hace lo mismo para el árbol inglés: al ser
 * más específica (`/en/...`), gana a esta en el emparejamiento, así que
 * `/en/lo-que-sea` termina en la 404 inglesa y no en esta.
 *
 * Las rutas REALES —páginas, `/api`, `/admin`, el sitemap, el robots y los
 * iconos— se emparejan antes que cualquier comodín, así que este archivo no se
 * cruza con ninguna.
 */
export default function CatchAll(): never {
  notFound();
}
