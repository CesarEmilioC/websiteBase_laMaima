"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin/auth";
import { findCalendarConflicts } from "@/lib/admin/availability";
import { addDays, nightsBetween, toDateRangeLiteral } from "@/lib/admin/dates";
import { okState, type ActionState } from "@/lib/admin/types";
import {
  ValidationError,
  optionalText,
  requiredDate,
  requiredUuid,
  runAction,
} from "@/lib/admin/validation";

const PATH = "/admin/bloqueos";

/**
 * Bloquea un rango de fechas de un alojamiento (mantenimiento, uso propio,
 * cierre por lluvias…).
 *
 * En la interfaz se piden la PRIMERA y la ÚLTIMA noche bloqueada, que es como
 * lo piensa quien administra el hotel. Internamente se guarda como el rango
 * medio-abierto [primera, última+1) que usa Postgres, el mismo criterio que
 * `bookings` — así el día de liberación puede ser el día de entrada de otro
 * huésped sin que se considere un cruce.
 */
export async function createBlockAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const { supabase } = await requireAdmin();

    const accommodationId = requiredUuid(
      formData,
      "accommodation_id",
      "Alojamiento",
    );
    const firstNight = requiredDate(formData, "start", "Primera noche");
    const lastNight = requiredDate(formData, "last_night", "Última noche");

    if (nightsBetween(firstNight, lastNight) < 0) {
      throw new ValidationError(
        "La última noche no puede ser anterior a la primera.",
      );
    }

    const end = addDays(lastNight, 1);

    // Un bloqueo no debe pisar una reserva activa: primero hay que decidir qué
    // pasa con esos huéspedes.
    const conflicts = (
      await findCalendarConflicts(supabase, accommodationId, firstNight, end)
    ).filter((conflict) => conflict.kind === "reserva");

    if (conflicts.length > 0) {
      throw new ValidationError(
        `No se puede bloquear: hay reservas activas en esas fechas.\n${conflicts
          .map((conflict) => `• ${conflict.description}`)
          .join("\n")}\nCancela o mueve esas reservas antes de bloquear.`,
      );
    }

    const { error } = await supabase.from("blocked_dates").insert({
      accommodation_id: accommodationId,
      date_range: toDateRangeLiteral(firstNight, end),
      reason: optionalText(formData, "reason", 200),
    });

    if (error) throw new Error(error.message);

    revalidatePath(PATH);
    revalidatePath("/admin");
    return okState("Fechas bloqueadas.");
  });
}

export async function deleteBlockAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();

  const { error } = await supabase.from("blocked_dates").delete().eq("id", id);

  if (error) {
    redirect(`${PATH}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(PATH);
  revalidatePath("/admin");
  redirect(
    `${PATH}?ok=${encodeURIComponent("Bloqueo eliminado. Las fechas vuelven a estar libres.")}`,
  );
}
