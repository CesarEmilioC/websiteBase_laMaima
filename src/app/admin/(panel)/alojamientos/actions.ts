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
  optionalText,
  requiredInt,
  requiredText,
  runAction,
  stringList,
} from "@/lib/admin/validation";

const LIST_PATH = "/admin/alojamientos";

/** Códigos de error de Postgres que sí sabemos traducir al usuario. */
const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

function refreshAdmin() {
  revalidatePath(LIST_PATH);
  revalidatePath("/admin");
}

/**
 * Crea o actualiza un alojamiento.
 * El mismo formulario sirve para ambos casos: si llega `id`, es edición.
 */
export async function saveAccommodationAction(
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
      capacity: requiredInt(formData, "capacity", "Capacidad", {
        min: 1,
        max: 100,
      }),
      price_per_night_cop: requiredInt(
        formData,
        "price_per_night_cop",
        "Precio por noche",
        { min: 0, max: 100_000_000 },
      ),
      price_note: optionalText(formData, "price_note", 160),
      amenities: stringList(formData, "amenities"),
      gallery: galleryList(formData, "gallery"),
      visible: checkbox(formData, "visible"),
      sort_order: requiredInt(formData, "sort_order", "Orden", {
        min: 0,
        max: 9999,
      }),
    };

    if (id) {
      const { error } = await supabase
        .from("accommodations")
        .update(payload)
        .eq("id", id);

      if (error) throw translate(error);

      refreshAdmin();
      revalidatePublicSite();
      return okState("Cambios guardados. El sitio público ya los muestra.");
    }

    const { data, error } = await supabase
      .from("accommodations")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw translate(error);

    refreshAdmin();
    revalidatePublicSite();
    redirect(
      `${LIST_PATH}/${data.id}?ok=${encodeURIComponent(
        `Alojamiento "${name}" creado. Añade sus fotos para que se vea bien en el sitio.`,
      )}`,
    );
  });
}

/** Guarda el orden de todas las filas de la lista de una sola vez. */
export async function saveAccommodationsOrderAction(formData: FormData) {
  const { supabase } = await requireAdmin();

  const updates: { id: string; sort_order: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("order__")) continue;
    const id = key.slice("order__".length);
    const order = Number(String(value).trim());
    if (!Number.isInteger(order) || order < 0 || order > 9999) continue;
    updates.push({ id, sort_order: order });
  }

  for (const item of updates) {
    const { error } = await supabase
      .from("accommodations")
      .update({ sort_order: item.sort_order })
      .eq("id", item.id);

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

/** Muestra u oculta un alojamiento en el sitio público. */
export async function toggleAccommodationVisibilityAction(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const visible = String(formData.get("visible") ?? "") === "true";

  const { error } = await supabase
    .from("accommodations")
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
        ? "El alojamiento vuelve a verse en el sitio."
        : "El alojamiento quedó oculto en el sitio.",
    )}`,
  );
}

/**
 * Elimina un alojamiento.
 * `bookings.accommodation_id` tiene ON DELETE RESTRICT, así que se comprueba
 * antes para poder explicar el motivo en vez de mostrar el error de Postgres.
 */
export async function deleteAccommodationAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();

  const { count, error: countError } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("accommodation_id", id);

  if (countError) {
    redirect(`${LIST_PATH}?error=${encodeURIComponent(countError.message)}`);
  }

  if ((count ?? 0) > 0) {
    redirect(
      `${LIST_PATH}?error=${encodeURIComponent(
        `No se puede eliminar: el alojamiento tiene ${count} reserva(s) registrada(s). Ocúltalo en vez de borrarlo para conservar el historial.`,
      )}`,
    );
  }

  const { error } = await supabase.from("accommodations").delete().eq("id", id);

  if (error) {
    const message =
      error.code === FOREIGN_KEY_VIOLATION
        ? "No se puede eliminar: hay reservas asociadas a este alojamiento."
        : error.message;
    redirect(`${LIST_PATH}?error=${encodeURIComponent(message)}`);
  }

  refreshAdmin();
  revalidatePublicSite();
  redirect(`${LIST_PATH}?ok=${encodeURIComponent("Alojamiento eliminado.")}`);
}

/** Traduce los errores de Postgres que el cliente puede llegar a provocar. */
function translate(error: { code?: string; message: string }): Error {
  if (error.code === UNIQUE_VIOLATION) {
    return new ValidationError(
      "Ya existe un alojamiento con esa dirección (slug). Cámbiala por una distinta.",
    );
  }
  return new Error(error.message);
}
