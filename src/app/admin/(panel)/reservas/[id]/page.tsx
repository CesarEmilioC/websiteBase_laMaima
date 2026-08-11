import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookingForm } from "../booking-form";
import { changeBookingStatusAction, deleteBookingAction } from "../actions";
import { Flash } from "@/components/admin/flash";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  Card,
  CardBody,
  CardHeader,
  PageHeading,
  Pill,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getBooking, listAccommodationOptions } from "@/lib/admin/data";
import {
  formatRangeEs,
  formatTimestampEs,
  nightsBetween,
} from "@/lib/admin/dates";
import { statusTone } from "@/lib/admin/status";
import {
  BOOKING_SOURCE_LABEL,
  BOOKING_STATUS_LABEL,
  BOOKING_STATUSES,
} from "@/lib/admin/types";
import { isUuid } from "@/lib/admin/validation";
import { formatCOP } from "@/lib/format";

export const metadata: Metadata = { title: "Detalle de reserva" };
export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);

  if (!isUuid(id)) notFound();

  const [booking, accommodations] = await Promise.all([
    getBooking(id),
    listAccommodationOptions(),
  ]);

  if (!booking) notFound();

  const nights = nightsBetween(booking.check_in, booking.check_out);
  const otherStatuses = BOOKING_STATUSES.filter(
    (value) => value !== booking.status,
  );

  return (
    <>
      <Flash ok={query.ok} error={query.error} />

      <PageHeading
        title={booking.guest_name}
        description={`${booking.accommodation_name ?? "Alojamiento"} · ${formatRangeEs(
          booking.check_in,
          booking.check_out,
        )} · ${nights} ${nights === 1 ? "noche" : "noches"}`}
        action={
          <Pill tone={statusTone(booking.status)}>
            {BOOKING_STATUS_LABEL[booking.status]}
          </Pill>
        }
      />

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Resumen" />
          <CardBody>
            <dl className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
              <Detail label="Alojamiento" value={booking.accommodation_name ?? "—"} />
              <Detail
                label="Fechas"
                value={`${formatRangeEs(booking.check_in, booking.check_out)} (${nights} ${
                  nights === 1 ? "noche" : "noches"
                })`}
              />
              <Detail
                label="Huéspedes"
                value={`${booking.guests} ${booking.guests === 1 ? "persona" : "personas"}`}
              />
              <Detail label="Total" value={formatCOP(booking.total_cop)} />
              <Detail label="Origen" value={BOOKING_SOURCE_LABEL[booking.source]} />
              <Detail label="Referencia" value={booking.payment_ref ?? "—"} />
              <Detail label="Correo" value={booking.guest_email ?? "—"} />
              <Detail label="Teléfono" value={booking.guest_phone ?? "—"} />
              <Detail
                label="Creada"
                value={formatTimestampEs(booking.created_at)}
              />
              <Detail
                label="Última modificación"
                value={formatTimestampEs(booking.updated_at)}
              />
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Cambiar estado"
            description="Cancelar libera las fechas; volver a activarla vuelve a comprobar la disponibilidad."
          />
          <CardBody className="space-y-2.5">
            {otherStatuses.map((value) => (
              <form key={value} action={changeBookingStatusAction}>
                <input type="hidden" name="id" value={booking.id} />
                <input type="hidden" name="status" value={value} />
                <SubmitButton
                  tone={value === "cancelled" ? "danger" : "secondary"}
                  size="sm"
                  className="w-full"
                  pendingLabel="Aplicando…"
                  confirm={
                    value === "cancelled"
                      ? "¿Cancelar esta reserva? Las fechas quedarán libres."
                      : undefined
                  }
                >
                  Marcar como {BOOKING_STATUS_LABEL[value].toLowerCase()}
                </SubmitButton>
              </form>
            ))}

            <div className="border-t border-black/[0.07] pt-3">
              <form action={deleteBookingAction}>
                <input type="hidden" name="id" value={booking.id} />
                <SubmitButton
                  tone="danger"
                  size="sm"
                  className="w-full"
                  pendingLabel="Eliminando…"
                  confirm="¿Eliminar la reserva del todo? Se pierde el historial. Si solo quieres liberar las fechas, cancélala en vez de borrarla."
                >
                  Eliminar reserva
                </SubmitButton>
              </form>
            </div>
          </CardBody>
        </Card>
      </div>

      <h2 className="mb-3 text-[1.125rem] font-semibold tracking-[-0.02em] text-ink">
        Editar la reserva
      </h2>
      <BookingForm booking={booking} accommodations={accommodations} />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.75rem] font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-[0.9375rem] text-ink">{value}</dd>
    </div>
  );
}
