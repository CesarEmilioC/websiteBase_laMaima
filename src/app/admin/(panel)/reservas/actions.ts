"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin/auth";
import { describeConflicts, findCalendarConflicts } from "@/lib/admin/availability";
import { nightsBetween } from "@/lib/admin/dates";
import {
  BOOKING_SOURCES,
  BOOKING_STATUSES,
  OCCUPYING_STATUSES,
  okState,
  type ActionState,
  type BookingStatus,
} from "@/lib/admin/types";
import {
  ValidationError,
  optionalEmail,
  optionalText,
  requiredDate,
  requiredEnum,
  requiredInt,
  requiredText,
  requiredUuid,
  runAction,
} from "@/lib/admin/validation";

const LIST_PATH = "/admin/reservas";

/** Violación de la restricción EXCLUDE `bookings_no_overlap`. */
const EXCLUSION_VIOLATION = "23P01";

function refreshAdmin() {
  revalidatePath(LIST_PATH);
  revalidatePath("/admin");
  revalidatePath("/admin/bloqueos");
}

/**
 * Crea o edita una reserva desde el panel.
 *
 * Este es el registro MANUAL del calendario (reservas por teléfono, WhatsApp,
 * Airbnb o Booking). El motor de reservas público con pago en línea es una
 * fase aparte y no pasa por aquí.
 */
export async function saveBookingAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const { supabase } = await requireAdmin();

    const id = String(formData.get("id") ?? "").trim();
    const accommodationId = requiredUuid(
      formData,
      "accommodation_id",
      "Alojamiento",
    );
    const checkIn = requiredDate(formData, "check_in", "Fecha de entrada");
    const checkOut = requiredDate(formData, "check_out", "Fecha de salida");

    if (nightsBetween(checkIn, checkOut) < 1) {
      throw new ValidationError(
        "La fecha de salida debe ser posterior a la de entrada (mínimo una noche).",
      );
    }

    const status = requiredEnum(formData, "status", "Estado", BOOKING_STATUSES);
    const source = requiredEnum(formData, "source", "Origen", BOOKING_SOURCES);

    const guests = requiredInt(formData, "guests", "Número de huéspedes", {
      min: 1,
      max: 200,
    });

    // El cupo del alojamiento es una guía, no una prohibición: a veces se
    // acuerda un cupo extra. Se avisa, pero no se bloquea.
    const { data: accommodation } = await supabase
      .from("accommodations")
      .select("name, capacity")
      .eq("id", accommodationId)
      .maybeSingle();

    if (!accommodation) {
      throw new ValidationError("El alojamiento seleccionado ya no existe.");
    }

    // Solo se comprueba el calendario si la reserva realmente lo ocupa.
    if (OCCUPYING_STATUSES.includes(status)) {
      const conflicts = await findCalendarConflicts(
        supabase,
        accommodationId,
        checkIn,
        checkOut,
        id || undefined,
      );
      if (conflicts.length > 0) {
        throw new ValidationError(describeConflicts(conflicts));
      }
    }

    const payload = {
      accommodation_id: accommodationId,
      guest_name: requiredText(formData, "guest_name", "Nombre del huésped", 160),
      guest_email: optionalEmail(formData, "guest_email"),
      guest_phone: optionalText(formData, "guest_phone", 60),
      check_in: checkIn,
      check_out: checkOut,
      guests,
      total_cop: requiredInt(formData, "total_cop", "Total", {
        min: 0,
        max: 2_000_000_000,
      }),
      status,
      source,
      payment_ref: optionalText(formData, "payment_ref", 120),
    };

    const overCapacity = guests > accommodation.capacity;

    if (id) {
      const { error } = await supabase.from("bookings").update(payload).eq("id", id);
      if (error) throw translate(error);

      refreshAdmin();
      revalidatePath(`${LIST_PATH}/${id}`);
      return okState(
        withCapacityWarning("Reserva actualizada.", overCapacity, accommodation.capacity),
      );
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw translate(error);

    refreshAdmin();
    redirect(
      `${LIST_PATH}/${data.id}?ok=${encodeURIComponent(
        withCapacityWarning(
          "Reserva registrada. Las fechas quedan ocupadas en el calendario.",
          overCapacity,
          accommodation.capacity,
        ),
      )}`,
    );
  });
}

function withCapacityWarning(
  message: string,
  over: boolean,
  capacity: number,
): string {
  if (!over) return message;
  return `${message}\nAviso: el número de huéspedes supera la capacidad indicada del alojamiento (${capacity}).`;
}

/** Cambia el estado de una reserva desde la ficha o el listado. */
export async function changeBookingStatusAction(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const rawStatus = String(formData.get("status") ?? "").trim();

  if (!BOOKING_STATUSES.includes(rawStatus as BookingStatus)) {
    redirect(
      `${LIST_PATH}/${id}?error=${encodeURIComponent("Estado no válido.")}`,
    );
  }
  const status = rawStatus as BookingStatus;

  const { data: booking, error: readError } = await supabase
    .from("bookings")
    .select("accommodation_id, check_in, check_out")
    .eq("id", id)
    .maybeSingle();

  if (readError || !booking) {
    redirect(
      `${LIST_PATH}?error=${encodeURIComponent("No se encontró la reserva.")}`,
    );
  }

  // Reactivar una reserva cancelada puede chocar con lo que se haya agendado
  // entretanto: se comprueba antes de escribir.
  if (OCCUPYING_STATUSES.includes(status)) {
    const conflicts = await findCalendarConflicts(
      supabase,
      String(booking.accommodation_id),
      String(booking.check_in),
      String(booking.check_out),
      id,
    );
    if (conflicts.length > 0) {
      redirect(
        `${LIST_PATH}/${id}?error=${encodeURIComponent(
          `No se pudo cambiar el estado. ${describeConflicts(conflicts)}`,
        )}`,
      );
    }
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id);

  if (error) {
    redirect(`${LIST_PATH}/${id}?error=${encodeURIComponent(error.message)}`);
  }

  refreshAdmin();
  revalidatePath(`${LIST_PATH}/${id}`);
  redirect(
    `${LIST_PATH}/${id}?ok=${encodeURIComponent("Estado de la reserva actualizado.")}`,
  );
}

/**
 * Borra la reserva definitivamente.
 * Se ofrece además de "cancelar" para depurar registros de prueba; el flujo
 * recomendado sigue siendo cancelar, que conserva el historial.
 */
export async function deleteBookingAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();

  const { error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) {
    redirect(`${LIST_PATH}/${id}?error=${encodeURIComponent(error.message)}`);
  }

  refreshAdmin();
  redirect(`${LIST_PATH}?ok=${encodeURIComponent("Reserva eliminada.")}`);
}

function translate(error: { code?: string; message: string }): Error {
  if (error.code === EXCLUSION_VIOLATION) {
    return new ValidationError(
      "Esas fechas se cruzan con otra reserva activa del mismo alojamiento.",
    );
  }
  return new Error(error.message);
}
