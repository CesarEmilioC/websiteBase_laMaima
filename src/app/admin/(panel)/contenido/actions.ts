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
 * Direcciones de imagen que contiene un patch de contenido: el campo único
 * `image` y, si la clave tiene galería (hoy solo `home_about`), las de la
 * lista. Es lo que compara la higiene de Storage antes y después de guardar.
 */
function imageUrlsOf(value: Record<string, unknown>): string[] {
  const urls: string[] = [];
  if (typeof value.image === "string" && value.image) urls.push(value.image);
  if (Array.isArray(value.gallery)) {
    for (const item of value.gallery) {
      if (typeof item !== "object" || item === null) continue;
      const { url } = item as Record<string, unknown>;
      if (typeof url === "string" && url) urls.push(url);
    }
  }
  return urls;
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
): Promise<void> {
  const { supabase } = await requireAdmin();

  const { data: current, error: readError } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (readError) throw new Error(readError.message);

  const base =
    typeof current?.value === "object" && current?.value !== null
      ? (current.value as Record<string, unknown>)
      : {};

  const { error } = await supabase
    .from("site_content")
    .upsert({ key, value: { ...base, ...patch } }, { onConflict: "key" });

  if (error) throw new Error(error.message);

  // Higiene de Storage: las direcciones que estaban en esta fila y ya no están
  // tras guardar (foto de portada reemplazada, imagen sacada de la galería de
  // "Sobre la reserva") quedan potencialmente huérfanas.
  //
  // Solo se comparan los campos que ESTE patch trae: si el formulario no envió
  // `gallery`, la lista guardada sigue intacta y sus fotos no son candidatas a
  // nada. `cleanupRemovedGalleryImages` vuelve a comprobar después —ya con el
  // guardado hecho— que ninguna otra fila de la base las siga usando antes de
  // borrar un solo objeto.
  const touched: Record<string, unknown> = {};
  if (patch.image !== undefined) touched.image = base.image;
  if (patch.gallery !== undefined) touched.gallery = base.gallery;

  const stillUsed = new Set(imageUrlsOf(patch));
  const orphans = imageUrlsOf(touched).filter((url) => !stillUsed.has(url));

  if (orphans.length > 0) {
    await cleanupRemovedGalleryImages(supabase, orphans);
  }

  revalidatePath(PATH);
  revalidatePublicSite();
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
    });
    return okState("Portada actualizada. El sitio ya muestra el cambio.");
  });
}

export async function saveAboutAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
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
