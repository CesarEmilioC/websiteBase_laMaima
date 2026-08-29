"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { saveBookingAction } from "./actions";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  Banner,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Select,
  buttonClass,
} from "@/components/admin/ui";
import { addDays, nightsBetween, todayInBogota } from "@/lib/admin/dates";
import {
  BOOKING_SOURCES,
  BOOKING_SOURCE_LABEL,
  BOOKING_STATUSES,
  BOOKING_STATUS_LABEL,
  IDLE_STATE,
  type AccommodationOption,
  type AdminBooking,
} from "@/lib/admin/types";
import { formatCOP } from "@/lib/format";

/**
 * Alta y edición de reservas.
 *
 * El estado local solo existe para dos ayudas: calcular las noches y proponer
 * el total (noches × tarifa del alojamiento). La validación de verdad —
 * incluido el cruce de fechas contra otras reservas y contra los bloqueos —
 * ocurre en el servidor, dentro de `saveBookingAction`.
 */
export function BookingForm({
  booking,
  accommodations,
}: {
  booking: AdminBooking | null;
  accommodations: AccommodationOption[];
}) {
  const [state, formAction] = useActionState(saveBookingAction, IDLE_STATE);

  const today = todayInBogota();
  const [accommodationId, setAccommodationId] = useState(
    booking?.accommodation_id ?? accommodations[0]?.id ?? "",
  );
  const [checkIn, setCheckIn] = useState(booking?.check_in ?? today);
  const [checkOut, setCheckOut] = useState(
    booking?.check_out ?? addDays(today, 1),
  );
  const [total, setTotal] = useState(String(booking?.total_cop ?? 0));

  const selected = accommodations.find((item) => item.id === accommodationId);
  const nights =
    checkIn && checkOut && checkOut > checkIn
      ? nightsBetween(checkIn, checkOut)
      : 0;
  const suggested = selected ? nights * selected.price_per_night_cop : 0;

  if (accommodations.length === 0) {
    return (
      <Banner tone="info">
        Primero crea al menos un alojamiento: una reserva siempre va asociada a
        una casa o cabaña.
      </Banner>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {booking && <input type="hidden" name="id" value={booking.id} />}

      {state.status !== "idle" && (
        <Banner tone={state.status === "ok" ? "ok" : "error"}>
          {state.message}
        </Banner>
      )}

      <Card>
        <CardHeader
          title="Alojamiento y fechas"
          description="Al guardar se comprueba que las fechas no choquen con otra reserva ni con un bloqueo."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Alojamiento"
            htmlFor="accommodation_id"
            required
            className="sm:col-span-2"
          >
            <Select
              id="accommodation_id"
              name="accommodation_id"
              required
              value={accommodationId}
              onChange={(event) => setAccommodationId(event.target.value)}
            >
              {accommodations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {formatCOP(item.price_per_night_cop)} / noche ·
                  hasta {item.capacity} personas
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Entrada (check-in)" htmlFor="check_in" required>
            <Input
              id="check_in"
              name="check_in"
              type="date"
              required
              value={checkIn}
              onChange={(event) => {
                const value = event.target.value;
                setCheckIn(value);
                if (value && checkOut <= value) setCheckOut(addDays(value, 1));
              }}
            />
          </Field>

          <Field
            label="Salida (check-out)"
            htmlFor="check_out"
            required
            hint={
              nights > 0
                ? `${nights} ${nights === 1 ? "noche" : "noches"}`
                : "La salida debe ser posterior a la entrada."
            }
          >
            <Input
              id="check_out"
              name="check_out"
              type="date"
              required
              min={checkIn ? addDays(checkIn, 1) : undefined}
              value={checkOut}
              onChange={(event) => setCheckOut(event.target.value)}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Huésped"
          description="Solo el nombre es obligatorio; el contacto ayuda para confirmar y para el aviso de llegada."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nombre completo"
            htmlFor="guest_name"
            required
            className="sm:col-span-2"
          >
            <Input
              id="guest_name"
              name="guest_name"
              required
              maxLength={160}
              defaultValue={booking?.guest_name ?? ""}
            />
          </Field>

          <Field label="Correo electrónico" htmlFor="guest_email">
            <Input
              id="guest_email"
              name="guest_email"
              type="email"
              maxLength={200}
              defaultValue={booking?.guest_email ?? ""}
            />
          </Field>

          <Field
            label="Teléfono / WhatsApp"
            htmlFor="guest_phone"
            hint="Ej.: +57 311 308 2813"
          >
            <Input
              id="guest_phone"
              name="guest_phone"
              type="tel"
              maxLength={60}
              defaultValue={booking?.guest_phone ?? ""}
            />
          </Field>

          <Field
            label="Número de huéspedes"
            htmlFor="guests"
            required
            hint={selected ? `Capacidad indicada: ${selected.capacity}` : undefined}
          >
            <Input
              id="guests"
              name="guests"
              type="number"
              min={1}
              max={200}
              required
              defaultValue={booking?.guests ?? 2}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Estado y cobro"
          description="Las reservas pendientes y pagadas ocupan calendario; las canceladas lo liberan."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Estado" htmlFor="status" required>
            <Select
              id="status"
              name="status"
              required
              defaultValue={booking?.status ?? "external"}
            >
              {BOOKING_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {BOOKING_STATUS_LABEL[value]}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Origen"
            htmlFor="source"
            required
            hint="De dónde llegó la reserva."
          >
            <Select
              id="source"
              name="source"
              required
              defaultValue={booking?.source ?? "manual"}
            >
              {BOOKING_SOURCES.map((value) => (
                <option key={value} value={value}>
                  {BOOKING_SOURCE_LABEL[value]}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Total (COP)"
            htmlFor="total_cop"
            required
            hint={
              suggested > 0
                ? `Sugerido: ${formatCOP(suggested)} (${nights} × ${formatCOP(
                    selected?.price_per_night_cop ?? 0,
                  )})`
                : "Solo el número, sin puntos."
            }
          >
            <div className="flex gap-2">
              <Input
                id="total_cop"
                name="total_cop"
                type="number"
                min={0}
                step={1000}
                required
                value={total}
                onChange={(event) => setTotal(event.target.value)}
              />
              {suggested > 0 && (
                <button
                  type="button"
                  onClick={() => setTotal(String(suggested))}
                  className="shrink-0 rounded-2xl bg-ink/[0.06] px-4 text-[0.8125rem] font-semibold text-ink transition-colors hover:bg-ink/[0.1]"
                >
                  Usar sugerido
                </button>
              )}
            </div>
          </Field>

          <Field
            label="Referencia"
            htmlFor="payment_ref"
            hint="Código de la transacción o del canal externo (Airbnb, Booking)."
          >
            <Input
              id="payment_ref"
              name="payment_ref"
              maxLength={120}
              defaultValue={booking?.payment_ref ?? ""}
            />
          </Field>
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel="Guardando…">
          {booking ? "Guardar cambios" : "Registrar reserva"}
        </SubmitButton>
        <Link href="/admin/reservas" className={buttonClass("secondary")}>
          Volver al listado
        </Link>
      </div>
    </form>
  );
}
