"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/auth";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import { cleanupRemovedGalleryImages } from "@/lib/admin/storage-cleanup";
import { okState, type ActionState } from "@/lib/admin/types";
import {
  galleryList,
  optionalText,
  requiredText,
  runAction,
} from "@/lib/admin/validation";

const PATH = "/admin/contenido";

/**
 * Recoge todas las direcciones de imagen de un valor jsonb arbitrario, sin
 * asumir su forma: recorre objetos y arreglos anidados y se queda con cada
 * string que encuentra.
 *
 * Antes esta comparación solo miraba los campos de primer nivel `image` y
 * `gallery` (válido mientras cada fila tenía como mucho uno de cada). Con
 * `listing_heroes` —dos sub-objetos `{ image, image_alt }` anidados— hacía
 * falta bajar un nivel más, así que se generalizó a "cualquier string en
 * cualquier profundidad". No hace falta filtrar qué strings "parecen" una
 * imagen: los que no lo sean (un `cta_href`, un eyebrow) nunca van a
 * coincidir con el prefijo del bucket que exige `bucketPathFromUrl()` más
 * abajo en `cleanupRemovedGalleryImages`, así que llegan como candidatos pero
 * se descartan solos.
 */
function collectStrings(value: unknown, into: string[] = []): string[] {
  if (typeof value === "string") {
    if (value) into.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, into));
  } else if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) =>
      collectStrings(item, into),
    );
  }
  return into;
}

/**
 * Guarda una fila de `site_content` fusionando con lo que ya había.
 *
 * El `value` es un jsonb libre y puede contener claves que este formulario no
 * muestra (coordenadas, handles de redes). Sobrescribir el objeto entero las
 * perdería, así que se hace merge: lo enviado pisa lo existente y el resto se
 * conserva.
 */
async function upsertContent(
  key: string,
  patch: Record<string, unknown>,
  /**
   * Espejo inglés: SOLO las claves de texto que el formulario traduce. Las
   * claves con valor vacío se BORRAN del espejo en vez de guardarse en blanco,
   * porque en `site_content` una cadena vacía y una clave ausente significan
   * cosas distintas: la ausente hereda el español (que es lo que queremos
   * cuando alguien vacía el campo) y la vacía publicaría un hueco.
   */
  patchEn: Record<string, unknown> = {},
): Promise<void> {
  const { supabase } = await requireAdmin();

  const { data: current, error: readError } = await supabase
    .from("site_content")
    .select("value, value_en")
    .eq("key", key)
    .maybeSingle();

  if (readError) throw new Error(readError.message);

  const asRecord = (value: unknown): Record<string, unknown> =>
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  const base = asRecord(current?.value);
  const merged = { ...base, ...patch };

  const mergedEn = { ...asRecord(current?.value_en) };
  for (const [field, value] of Object.entries(patchEn)) {
    const empty =
      value === null ||
      value === undefined ||
      (typeof value === "string" && !value.trim()) ||
      (Array.isArray(value) && value.length === 0);
    if (empty) delete mergedEn[field];
    else mergedEn[field] = value;
  }

  const { error } = await supabase
    .from("site_content")
    .upsert({ key, value: merged, value_en: mergedEn }, { onConflict: "key" });

  if (error) throw new Error(error.message);

  // Higiene de Storage: cualquier dirección que estuviera en la fila ANTES de
  // guardar y ya no esté DESPUÉS (foto de portada reemplazada, imagen sacada
  // de una galería, cabecera cambiada) queda potencialmente huérfana.
  // `cleanupRemovedGalleryImages` vuelve a comprobar después —ya con el
  // guardado hecho— que ninguna otra fila de la base la siga usando antes de
  // borrar un solo objeto del bucket.
  const stillUsed = new Set([
    ...collectStrings(merged),
    ...collectStrings(mergedEn),
  ]);
  const orphans = collectStrings(base).filter((url) => !stillUsed.has(url));

  if (orphans.length > 0) {
    await cleanupRemovedGalleryImages(supabase, orphans);
  }

  revalidatePath(PATH);
  revalidatePublicSite();
}

/**
 * Sub-objeto inglés de una cabecera: solo el texto alternativo, o `null` si el
 * campo viene vacío (para que `upsertContent` borre la clave y la versión
 * inglesa herede la española).
 */
function altOnly(
  form: FormData,
  field: string,
): { image_alt: string } | null {
  const value = optionalText(form, field, 300);
  return value ? { image_alt: value } : null;
}

/** Texto libre multilínea -> arreglo de párrafos (separados por línea vacía). */
function toParagraphs(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim().replace(/\s*\n\s*/g, " "))
    .filter(Boolean);
}

export async function saveHeroAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await upsertContent("home_hero", {
      eyebrow: optionalText(formData, "eyebrow", 120) ?? "",
      title: requiredText(formData, "title", "Titular", 160),
      subtitle: optionalText(formData, "subtitle", 400) ?? "",
      cta_label: optionalText(formData, "cta_label", 60) ?? "Ver alojamientos",
      cta_href: optionalText(formData, "cta_href", 200) ?? "/alojamientos",
      image: optionalText(formData, "image", 500) ?? "",
      image_alt: optionalText(formData, "image_alt", 300) ?? "",
    }, {
      /* La FOTO no se repite en el espejo ingles: es la misma imagen en las dos
         versiones y duplicarla solo abriria la puerta a que se desincronicen. */
      eyebrow: optionalText(formData, "eyebrow_en", 120),
      title: optionalText(formData, "title_en", 160),
      subtitle: optionalText(formData, "subtitle_en", 400),
      cta_label: optionalText(formData, "cta_label_en", 60),
      image_alt: optionalText(formData, "image_alt_en", 300),
    });
    return okState("Portada actualizada. El sitio ya muestra el cambio.");
  });
}

export async function saveAboutAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const statsEn = [0, 1, 2]
      .map((index) => ({
        value: optionalText(formData, `stat_${index}_value`, 20) ?? "",
        label: optionalText(formData, `stat_${index}_label_en`, 60) ?? "",
      }))
      .filter((stat) => stat.value && stat.label);

    const stats = [0, 1, 2]
      .map((index) => ({
        value: optionalText(formData, `stat_${index}_value`, 20) ?? "",
        label: optionalText(formData, `stat_${index}_label`, 60) ?? "",
      }))
      .filter((stat) => stat.value && stat.label);

    await upsertContent("home_about", {
      eyebrow: optionalText(formData, "eyebrow", 120) ?? "",
      title: requiredText(formData, "title", "Titular", 200),
      paragraphs: toParagraphs(optionalText(formData, "paragraphs", 6000)),
      // Galería que se pasa sola en la portada. Si queda vacía, el sitio cae
      // con elegancia a la foto única de `image` (ver `aboutImages()`).
      gallery: galleryList(formData, "gallery").slice(0, 10),
      image: optionalText(formData, "image", 500) ?? "",
      image_alt: optionalText(formData, "image_alt", 300) ?? "",
      stats,
    }, {
      eyebrow: optionalText(formData, "eyebrow_en", 120),
      title: optionalText(formData, "title_en", 200),
      paragraphs: toParagraphs(optionalText(formData, "paragraphs_en", 6000)),
      image_alt: optionalText(formData, "image_alt_en", 300),
      /* Las cifras (30, 6, 3) son las mismas; lo que cambia es su rotulo. Se
         guarda la tripleta ENTERA o ninguna: media tabla traducida se lee peor
         que la española completa. */
      stats: statsEn.length === stats.length ? statsEn : [],
    });
    return okState("Sección “Sobre la reserva” actualizada.");
  });
}

export async function saveSeoAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await upsertContent("seo", {
      image: optionalText(formData, "image", 500) ?? "",
      image_alt: optionalText(formData, "image_alt", 300) ?? "",
    }, {
      image_alt: optionalText(formData, "image_alt_en", 300),
    });
    return okState("Imagen para redes sociales actualizada.");
  });
}

export async function saveContactAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await upsertContent("contact", {
      business_name: optionalText(formData, "business_name", 160) ?? "",
      phone_display: optionalText(formData, "phone_display", 40) ?? "",
      phone: optionalText(formData, "phone_display", 40) ?? "",
      whatsapp: (optionalText(formData, "whatsapp", 20) ?? "").replace(/\D/g, ""),
      address: optionalText(formData, "address", 200) ?? "",
      locality: optionalText(formData, "locality", 100) ?? "",
      region: optionalText(formData, "region", 100) ?? "",
      country: optionalText(formData, "country", 100) ?? "",
      note: optionalText(formData, "note", 300) ?? "",
      instagram: optionalText(formData, "instagram", 300) ?? "",
      facebook: optionalText(formData, "facebook", 300) ?? "",
      maps_url: optionalText(formData, "maps_url", 500) ?? "",
    });
    return okState("Datos de contacto guardados.");
  });
}

export async function saveListingHeroesAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await upsertContent("listing_heroes", {
      alojamientos: {
        image: optionalText(formData, "alojamientos_image", 500) ?? "",
        image_alt: optionalText(formData, "alojamientos_image_alt", 300) ?? "",
      },
      experiencias: {
        image: optionalText(formData, "experiencias_image", 500) ?? "",
        image_alt: optionalText(formData, "experiencias_image_alt", 300) ?? "",
      },
    }, {
      /* La fusión con el español es PROFUNDA (ver `mergeContent()` en
         `lib/content.ts`), así que basta con mandar el texto alternativo: la
         foto se hereda de la fila española y no puede desincronizarse.
         `altOnly()` devuelve `null` cuando el campo viene vacío, y una clave
         nula se borra del espejo en vez de guardarse a medias. */
      alojamientos: altOnly(formData, "alojamientos_image_alt_en"),
      experiencias: altOnly(formData, "experiencias_image_alt_en"),
    });
    return okState("Cabeceras de Alojamientos y Experiencias actualizadas.");
  });
}

export async function saveInstagramStripAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await upsertContent("instagram_strip", {
      gallery: galleryList(formData, "gallery").slice(0, 12),
    });
    return okState("Franja de Instagram actualizada.");
  });
}

export async function saveNotFoundAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await upsertContent("not_found", {
      image: optionalText(formData, "image", 500) ?? "",
      image_alt: optionalText(formData, "image_alt", 300) ?? "",
    });
    return okState("Imagen de la página 404 actualizada.");
  });
}
