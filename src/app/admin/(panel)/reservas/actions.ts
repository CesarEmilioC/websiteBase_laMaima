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
import { releaseExpiredHolds } from "@/lib/booking/sweep";
import { sendBookingConfirmation } from "@/lib/email";
import { isLocale } from "@/lib/i18n/config";

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
 * Airbnb o Booking). Las solicitudes que llegan del sitio las crea la Server
 * Action pública (`@/lib/booking/actions`), pero se editan y se confirman
 * desde aquí.
 *
 * REGLA COMPARTIDA CON EL FLUJO PÚBLICO: antes de comprobar el calendario se
 * liberan los holds vencidos del alojamiento. Sin eso, la restricción
 * `bookings_no_overlap` —que no puede leer `now()`— rechazaría unas fechas que
 * en realidad están libres porque una solicitud web caducada sigue en
 * 'pending'. Ver `@/lib/booking/holds`.
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
      await releaseExpiredHolds(supabase, accommodationId);

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
      notes: optionalText(formData, "notes", 2000),
      /* El hold solo tiene sentido mientras la reserva está pendiente: en
         cuanto pasa a confirmada, pagada o externa deja de vencer, y si se
         cancela el vencimiento sobra. Una reserva que el equipo registra a
         mano nace ya sin vencimiento (este formulario no crea holds). */
      ...(status === "pending" ? {} : { expires_at: null }),
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

/* ---------------------------------------------------------------------------
 * Confirmar una solicitud
 * ------------------------------------------------------------------------- */

/**
 * Pasa una solicitud a **confirmada**.
 *
 * Es la acción central del panel ahora que el sitio crea reservas solo: una
 * solicitud `pending` ocupa fechas pero con fecha de caducidad; confirmarla
 * hace tres cosas a la vez y las tres importan.
 *
 *   1. `status = 'confirmed'` — pasa a ocupar calendario en firme, y así lo
 *      exportan el .ics de Airbnb y Booking y lo ve el widget público.
 *   2. `expires_at = null` — se le quita el vencimiento. Sin esto, el barrido
 *      de holds la cancelaría a las 48 horas.
 *   3. Sale el correo de confirmación definitiva al huésped, en SU idioma.
 *
 * Antes de escribir se vuelve a comprobar el calendario (por si el hold venció
 * y entretanto entró otra reserva) igual que en cualquier otro cambio de
 * estado.
 */
export async function confirmBookingAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();

  const { data: booking, error: readError } = await supabase
    .from("bookings")
    .select(
      "id, accommodation_id, guest_name, guest_email, guest_phone, check_in, check_out, guests, total_cop, booking_code, notes, locale, source, accommodations(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (readError || !booking) {
    redirect(
      `${LIST_PATH}?error=${encodeURIComponent("No se encontró la reserva.")}`,
    );
  }

  const accommodationId = String(booking.accommodation_id);

  await releaseExpiredHolds(supabase, accommodationId);

  const conflicts = await findCalendarConflicts(
    supabase,
    accommodationId,
    String(booking.check_in),
    String(booking.check_out),
    id,
  );
  if (conflicts.length > 0) {
    redirect(
      `${LIST_PATH}/${id}?error=${encodeURIComponent(
        `No se pudo confirmar. ${describeConflicts(conflicts)}`,
      )}`,
    );
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "confirmed", expires_at: null })
    .eq("id", id);

  if (error) {
    redirect(`${LIST_PATH}/${id}?error=${encodeURIComponent(error.message)}`);
  }

  /* El correo va después de escribir y no puede tumbar la confirmación: la
     reserva ya está confirmada en la base aunque Resend falle (o, como hoy,
     no esté configurado y la función solo lo registre en consola). */
  let emailNote = "";
  try {
    const locale = isLocale(booking.locale) ? booking.locale : "es";
    const result = await sendBookingConfirmation({
      id: String(booking.id),
      bookingCode: (booking.booking_code as string | null) ?? null,
      accommodationName: joinedAccommodationName(booking.accommodations),
      checkIn: String(booking.check_in),
      checkOut: String(booking.check_out),
      guests: Number(booking.guests),
      totalCop: Number(booking.total_cop),
      guestName: String(booking.guest_name),
      guestEmail: (booking.guest_email as string | null) ?? null,
      guestPhone: (booking.guest_phone as string | null) ?? null,
      guestNotes: (booking.notes as string | null) ?? null,
      status: "confirmed",
      source: String(booking.source ?? "web"),
      locale,
    });
    if (!result.sent && result.reason === "no-recipient") {
      emailNote = "\nLa reserva no tiene correo: avísale al huésped por WhatsApp.";
    }
  } catch (cause) {
    console.error("[admin] fallo al enviar la confirmación:", cause);
  }

  refreshAdmin();
  revalidatePath(`${LIST_PATH}/${id}`);
  redirect(
    `${LIST_PATH}/${id}?ok=${encodeURIComponent(
      `Reserva confirmada. Las fechas quedan bloqueadas sin vencimiento y se envió la confirmación al huésped.${emailNote}`,
    )}`,
  );
}

/** El join de PostgREST puede llegar como objeto o como arreglo de uno. */
function joinedAccommodationName(value: unknown): string {
  if (Array.isArray(value)) return joinedAccommodationName(value[0]);
  if (typeof value !== "object" || value === null) return "Alojamiento";
  const { name } = value as Record<string, unknown>;
  return typeof name === "string" ? name : "Alojamiento";
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
  // entretanto: se comprueba antes de escribir, y con los holds vencidos ya
  // liberados para no rechazarla por una solicitud caducada.
  if (OCCUPYING_STATUSES.includes(status)) {
    await releaseExpiredHolds(supabase, String(booking.accommodation_id));

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
    .update({
      status,
      // Solo lo pendiente vence. Cualquier otro estado deja de tener hold.
      ...(status === "pending" ? {} : { expires_at: null }),
    })
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
