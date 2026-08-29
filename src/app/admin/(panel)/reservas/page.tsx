import type { Metadata } from "next";
import Link from "next/link";

import { Flash } from "@/components/admin/flash";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  LinkButton,
  PageHeading,
  Pill,
  Select,
  buttonClass,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listAccommodationOptions, listBookings } from "@/lib/admin/data";
import { formatRangeEs, nightsBetween } from "@/lib/admin/dates";
import { statusTone } from "@/lib/admin/status";
import {
  BOOKING_SOURCES,
  BOOKING_SOURCE_LABEL,
  BOOKING_STATUSES,
  BOOKING_STATUS_LABEL,
  type BookingSource,
  type BookingStatus,
} from "@/lib/admin/types";
import { formatCOP } from "@/lib/format";
import { isIsoDate } from "@/lib/admin/dates";

export const metadata: Metadata = { title: "Reservas" };
export const dynamic = "force-dynamic";

type Query = {
  ok?: string;
  error?: string;
  estado?: string;
  origen?: string;
  desde?: string;
  hasta?: string;
  alojamiento?: string;
};

export default async function BookingsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  await requireAdmin();
  const params = await searchParams;

  // Los filtros llegan por querystring (formulario GET): así el estado de la
  // vista es compartible y sobrevive a un refresco.
  const status = BOOKING_STATUSES.includes(params.estado as BookingStatus)
    ? (params.estado as BookingStatus)
    : "all";
  const source = BOOKING_SOURCES.includes(params.origen as BookingSource)
    ? (params.origen as BookingSource)
    : "all";
  const from = params.desde && isIsoDate(params.desde) ? params.desde : undefined;
  const to = params.hasta && isIsoDate(params.hasta) ? params.hasta : undefined;
  const accommodationId = params.alojamiento || undefined;

  const [accommodations, bookings] = await Promise.all([
    listAccommodationOptions(),
    listBookings({ status, source, from, to, accommodationId }),
  ]);

  const hasFilters =
    status !== "all" || source !== "all" || !!from || !!to || !!accommodationId;

  return (
    <>
      <Flash ok={params.ok} error={params.error} />

      <PageHeading
        title="Reservas"
        description="Todas las reservas del calendario: las que se registran aquí y, más adelante, las que lleguen del sitio con pago en línea."
        action={
          <LinkButton href="/admin/reservas/nueva">Registrar reserva</LinkButton>
        }
      />

      <Card className="mb-5">
        <CardHeader title="Filtros" />
        <CardBody>
          <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Estado" htmlFor="estado">
              <Select id="estado" name="estado" defaultValue={status}>
                <option value="all">Todos</option>
                {BOOKING_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {BOOKING_STATUS_LABEL[value]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Origen" htmlFor="origen">
              <Select id="origen" name="origen" defaultValue={source}>
                <option value="all">Todos</option>
                {BOOKING_SOURCES.map((value) => (
                  <option key={value} value={value}>
                    {BOOKING_SOURCE_LABEL[value]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Alojamiento" htmlFor="alojamiento">
              <Select
                id="alojamiento"
                name="alojamiento"
                defaultValue={accommodationId ?? ""}
              >
                <option value="">Todos</option>
                {accommodations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Desde" htmlFor="desde">
              <Input id="desde" name="desde" type="date" defaultValue={from ?? ""} />
            </Field>

            <Field label="Hasta" htmlFor="hasta">
              <Input id="hasta" name="hasta" type="date" defaultValue={to ?? ""} />
            </Field>

            <div className="flex items-center gap-2.5 sm:col-span-2 lg:col-span-5">
              <button type="submit" className={buttonClass("primary", "sm")}>
                Aplicar filtros
              </button>
              {hasFilters && (
                <Link href="/admin/reservas" className={buttonClass("secondary", "sm")}>
                  Limpiar
                </Link>
              )}
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={`${bookings.length} reserva${bookings.length === 1 ? "" : "s"}`}
          description={
            hasFilters
              ? "Resultado del filtro aplicado."
              : "Ordenadas de la fecha de entrada más reciente a la más antigua."
          }
        />

        {bookings.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title={hasFilters ? "Ninguna reserva coincide" : "Todavía no hay reservas"}
              description={
                hasFilters
                  ? "Prueba a quitar algún filtro."
                  : "Registra las reservas que lleguen por teléfono, WhatsApp, Airbnb o Booking para que el calendario esté completo."
              }
              action={
                <LinkButton href="/admin/reservas/nueva" size="sm">
                  Registrar reserva
                </LinkButton>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-ink/[0.07]">
            {bookings.map((booking) => {
              const nights = nightsBetween(booking.check_in, booking.check_out);
              return (
                <li key={booking.id}>
                  <Link
                    href={`/admin/reservas/${booking.id}`}
                    className="group flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-ink/[0.02] sm:px-6"
                  >
                    <div className="min-w-[13rem] flex-1">
                      <p className="text-[1rem] font-semibold text-ink group-hover:text-brand-700">
                        {booking.guest_name}
                      </p>
                      <p className="mt-0.5 text-[0.8125rem] text-ink-muted">
                        {booking.accommodation_name ?? "Alojamiento"} ·{" "}
                        {formatRangeEs(booking.check_in, booking.check_out)} ·{" "}
                        {nights} {nights === 1 ? "noche" : "noches"} ·{" "}
                        {booking.guests}{" "}
                        {booking.guests === 1 ? "huésped" : "huéspedes"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[0.9375rem] font-semibold text-ink">
                        {formatCOP(booking.total_cop)}
                      </p>
                      <p className="text-[0.75rem] text-ink-muted">
                        {BOOKING_SOURCE_LABEL[booking.source]}
                      </p>
                    </div>

                    <Pill tone={statusTone(booking.status)}>
                      {BOOKING_STATUS_LABEL[booking.status]}
                    </Pill>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
