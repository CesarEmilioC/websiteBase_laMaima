"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin/auth";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import { isValidSlug, slugify } from "@/lib/admin/slug";
import { okState, type ActionState } from "@/lib/admin/types";
import {
  ValidationError,
  checkbox,
  galleryList,
  optionalInt,
  optionalText,
  requiredInt,
  requiredText,
  runAction,
} from "@/lib/admin/validation";

const LIST_PATH = "/admin/experiencias";
const UNIQUE_VIOLATION = "23505";

function refreshAdmin() {
  revalidatePath(LIST_PATH);
  revalidatePath("/admin");
}

/** Crea o actualiza una experiencia (si llega `id`, es edición). */
export async function saveExperienceAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const { supabase } = await requireAdmin();

    const id = String(formData.get("id") ?? "").trim();
    const name = requiredText(formData, "name", "Nombre", 120);

    const rawSlug = String(formData.get("slug") ?? "").trim();
    const slug = slugify(rawSlug || name);
    if (!isValidSlug(slug)) {
      throw new ValidationError(
        "La dirección (slug) solo puede llevar letras minúsculas, números y guiones.",
      );
    }

    const payload = {
      slug,
      name,
      short_description: optionalText(formData, "short_description", 400),
      description: optionalText(formData, "description", 6000),
      duration: optionalText(formData, "duration", 80),
      // Capacidad y precio son opcionales a propósito: hoy varias experiencias
      // están incluidas en la estadía y no tienen cupo ni tarifa definidos.
      capacity: optionalInt(formData, "capacity", "Capacidad", {
        min: 1,
        max: 500,
      }),
      price_cop: optionalInt(formData, "price_cop", "Precio", {
        min: 0,
        max: 100_000_000,
      }),
      price_note: optionalText(formData, "price_note", 160),
      gallery: galleryList(formData, "gallery"),
      visible: checkbox(formData, "visible"),
      sort_order: requiredInt(formData, "sort_order", "Orden", {
        min: 0,
        max: 9999,
      }),
    };

    if (id) {
      const { error } = await supabase
        .from("experiences")
        .update(payload)
        .eq("id", id);

      if (error) throw translate(error);

      refreshAdmin();
      revalidatePublicSite();
      return okState("Cambios guardados. El sitio público ya los muestra.");
    }

    const { data, error } = await supabase
      .from("experiences")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw translate(error);

    refreshAdmin();
    revalidatePublicSite();
    redirect(
      `${LIST_PATH}/${data.id}?ok=${encodeURIComponent(
        `Experiencia "${name}" creada.`,
      )}`,
    );
  });
}

export async function saveExperiencesOrderAction(formData: FormData) {
  const { supabase } = await requireAdmin();

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("order__")) continue;
    const id = key.slice("order__".length);
    const order = Number(String(value).trim());
    if (!Number.isInteger(order) || order < 0 || order > 9999) continue;

    const { error } = await supabase
      .from("experiences")
      .update({ sort_order: order })
      .eq("id", id);

    if (error) {
      redirect(
        `${LIST_PATH}?error=${encodeURIComponent(
          `No se pudo guardar el orden: ${error.message}`,
        )}`,
      );
    }
  }

  refreshAdmin();
  revalidatePublicSite();
  redirect(`${LIST_PATH}?ok=${encodeURIComponent("Orden actualizado.")}`);
}

export async function toggleExperienceVisibilityAction(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const visible = String(formData.get("visible") ?? "") === "true";

  const { error } = await supabase
    .from("experiences")
    .update({ visible })
    .eq("id", id);

  if (error) {
    redirect(`${LIST_PATH}?error=${encodeURIComponent(error.message)}`);
  }

  refreshAdmin();
  revalidatePublicSite();
  redirect(
    `${LIST_PATH}?ok=${encodeURIComponent(
      visible
        ? "La experiencia vuelve a verse en el sitio."
        : "La experiencia quedó oculta en el sitio.",
    )}`,
  );
}

export async function deleteExperienceAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();

  const { error } = await supabase.from("experiences").delete().eq("id", id);

  if (error) {
    redirect(`${LIST_PATH}?error=${encodeURIComponent(error.message)}`);
  }

  refreshAdmin();
  revalidatePublicSite();
  redirect(`${LIST_PATH}?ok=${encodeURIComponent("Experiencia eliminada.")}`);
}

function translate(error: { code?: string; message: string }): Error {
  if (error.code === UNIQUE_VIOLATION) {
    return new ValidationError(
      "Ya existe una experiencia con esa dirección (slug). Cámbiala por una distinta.",
    );
  }
  return new Error(error.message);
}
