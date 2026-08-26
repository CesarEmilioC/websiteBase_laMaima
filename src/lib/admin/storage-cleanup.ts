import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

/**
 * Higiene del bucket "gallery" de Supabase Storage.
 *
 * El cliente pide expresamente que las imágenes reemplazadas o eliminadas
 * desde el panel no se queden ocupando espacio en el Storage. Este módulo
 * centraliza la lógica que usan las Server Actions de alojamientos,
 * experiencias y contenido cuando guardan una galería o un campo de imagen
 * nuevos:
 *
 *   1. Se calcula qué URLs salieron de la galería/campo (las que estaban
 *      antes y ya no están después de guardar).
 *   2. Cada una se descarta si NO pertenece a nuestro bucket (una URL externa
 *      de Cloudinary, por ejemplo, jamás se toca).
 *   3. De las que sí son nuestras, se comprueba que ninguna OTRA fila de la
 *      base de datos la siga usando (otro alojamiento, otra experiencia, o
 *      un campo de `site_content`) antes de borrarla.
 *   4. El borrado usa el cliente de servicio (service role): la política de
 *      Storage solo permite INSERT a `authenticated`, así que un DELETE con
 *      el cliente de sesión del admin fallaría.
 *
 * Es deliberadamente "best-effort": el guardado en la base de datos ya
 * ocurrió cuando se llama a estas funciones, y un fallo aquí (red, permisos,
 * lo que sea) se registra en consola pero nunca se propaga. Es preferible un
 * archivo huérfano ocasional a que una edición legítima del panel falle por
 * un problema de limpieza de Storage.
 */

const BUCKET = "gallery";

/**
 * Convierte una URL pública del bucket "gallery" en su ruta interna (la que
 * espera `storage.from("gallery").remove([...])`).
 *
 * Devuelve `null` si la URL no viene de nuestro Storage: es la salvaguarda
 * que evita borrar nunca una imagen externa (Cloudinary u otro CDN) que el
 * admin haya pegado por dirección.
 */
export function bucketPathFromUrl(url: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!base) return null;

  const prefix = `${base.replace(/\/+$/, "")}/storage/v1/object/public/${BUCKET}/`;
  if (!url.startsWith(prefix)) return null;

  const path = url.slice(prefix.length);
  if (!path) return null;

  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/** Extrae las URLs de una galería (`[{ url, alt }, ...]`) tal como llega desde
 *  el jsonb de Postgres (tipo `unknown`, forma no garantizada). */
function urlsOf(gallery: unknown): string[] {
  if (!Array.isArray(gallery)) return [];
  return gallery.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const { url } = item as Record<string, unknown>;
    return typeof url === "string" && url ? [url] : [];
  });
}

/** URLs de una galería, para cuando se elimina la fila completa. */
export function galleryUrls(gallery: unknown): string[] {
  return urlsOf(gallery);
}

/**
 * Compara la galería anterior de una fila contra la nueva y devuelve las
 * URLs que salieron (candidatas a borrarse del Storage).
 */
export function removedGalleryUrls(previous: unknown, next: unknown): string[] {
  const nextSet = new Set(urlsOf(next));
  return urlsOf(previous).filter((url) => !nextSet.has(url));
}

/**
 * Trae el estado actual completo (galerías + contenido) y arma el conjunto de
 * URLs que siguen referenciadas en algún lugar de la base de datos.
 *
 * Se llama SIEMPRE después de que el guardado/borrado que disparó la limpieza
 * ya se aplicó, así que la fila que se acaba de editar ya refleja su valor
 * nuevo (o ya no existe, si se borró por completo): no hace falta excluirla
 * a mano.
 */
async function fetchReferencedUrls(supabase: SupabaseClient): Promise<Set<string>> {
  const [accommodations, experiences, content] = await Promise.all([
    supabase.from("accommodations").select("gallery"),
    supabase.from("experiences").select("gallery"),
    supabase.from("site_content").select("value"),
  ]);

  if (accommodations.error || experiences.error || content.error) {
    throw new Error(
      accommodations.error?.message ??
        experiences.error?.message ??
        content.error?.message ??
        "error desconocido consultando referencias",
    );
  }

  const referenced = new Set<string>();

  for (const row of accommodations.data ?? []) {
    for (const url of urlsOf((row as { gallery?: unknown }).gallery)) referenced.add(url);
  }
  for (const row of experiences.data ?? []) {
    for (const url of urlsOf((row as { gallery?: unknown }).gallery)) referenced.add(url);
  }
  for (const row of content.data ?? []) {
    collectStrings((row as { value?: unknown }).value, referenced);
  }

  return referenced;
}

/** Reúne todos los strings de un jsonb arbitrario en el set dado. */
function collectStrings(value: unknown, into: Set<string>): void {
  if (typeof value === "string") {
    into.add(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, into));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) =>
      collectStrings(item, into),
    );
  }
}

/**
 * Borra del bucket "gallery" las URLs indicadas que sean de nuestro Storage y
 * que ya no estén referenciadas en ninguna fila. Nunca lanza: cualquier
 * problema queda en consola.
 */
export async function cleanupRemovedGalleryImages(
  supabase: SupabaseClient,
  urls: string[],
): Promise<void> {
  const candidates = urls
    .map((url) => ({ url, path: bucketPathFromUrl(url) }))
    .filter((item): item is { url: string; path: string } => item.path !== null);

  if (candidates.length === 0) return;

  if (!hasServiceRoleKey()) {
    console.warn(
      "[admin] Storage: SUPABASE_SERVICE_ROLE_KEY no configurada; no se pudo limpiar",
      candidates.map((item) => item.path),
    );
    return;
  }

  try {
    const referenced = await fetchReferencedUrls(supabase);
    const toDelete = candidates
      .filter((item) => !referenced.has(item.url))
      .map((item) => item.path);

    if (toDelete.length === 0) return;

    const admin = createAdminClient();
    const { error } = await admin.storage.from(BUCKET).remove(toDelete);

    if (error) {
      console.error("[admin] Storage: error borrando objetos huérfanos:", error.message, toDelete);
      return;
    }

    console.log("[admin] Storage: objetos borrados (reemplazo/eliminación):", toDelete);
  } catch (err) {
    console.error(
      "[admin] Storage: fallo inesperado limpiando objetos huérfanos:",
      err instanceof Error ? err.message : err,
    );
  }
}
