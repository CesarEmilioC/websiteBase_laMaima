/**
 * Generación de slugs para las URLs públicas (/alojamientos/[slug]).
 *
 * Se usa en el servidor (validación) y en el navegador (autocompletado del
 * campo mientras se escribe el nombre), por eso no depende de nada de Node.
 */

/**
 * Rango "Combining Diacritical Marks" (U+0300–U+036F): son los acentos que
 * quedan sueltos tras `normalize("NFD")`. Se escribe con escapes unicode para
 * que el patrón sea legible y no dependa de la codificación del archivo.
 */
const COMBINING_MARKS = /[̀-ͯ]/g;

/** "Casa Maima — Ñandú" -> "casa-maima-nandu" */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    // La ñ se descompone en "n" + tilde combinante, así que también queda
    // resuelta al quitar las marcas.
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80;
}
