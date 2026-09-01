import type { Metadata } from "next";
import Link from "next/link";

import { Flash } from "@/components/admin/flash";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  LinkButton,
  PageHeading,
  Pill,
  StatTile,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getDashboardStats,
  listBlockedDates,
  listPendingRequests,
  listRecentBookings,
  listUpcomingBookings,
} from "@/lib/admin/data";
import { formatRangeEs, formatTimestampEs, nightsBetween } from "@/lib/admin/dates";
import { statusTone } from "@/lib/admin/status";
import {
  BOOKING_SOURCE_LABEL,
  BOOKING_STATUS_LABEL,
  type AdminBooking,
} from "@/lib/admin/types";
import { formatHoldCountdownEs, isExpiringSoon } from "@/lib/booking/holds";
import { formatCOP } from "@/lib/format";

export const metadata: Metadata = { title: "Resumen" };

/** El panel siempre muestra el estado actual de la base: nunca se cachea. */
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const [stats, upcoming, recent, blocks, pendingRequests] = await Promise.all([
    getDashboardStats(),
    listUpcomingBookings(6),
    listRecentBookings(5),
    listBlockedDates({ onlyUpcoming: true, limit: 100 }),
    listPendingRequests(8),
  ]);

  return (
    <>
      <Flash ok={params.ok} error={params.error} />

      <PageHeading
        title="Resumen"
        description="Todo lo que se publica en lamaima.com y todas las reservas del calendario se administran desde aquí."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          href="/admin/alojamientos"
          value={stats.accommodationsVisible}
          label="Alojamientos visibles"
          hint={`${stats.accommodationsTotal} en total`}
        />
        <StatTile
          href="/admin/experiencias"
          value={stats.experiencesVisible}
          label="Experiencias visibles"
          hint={`${stats.experiencesTotal} en total`}
        />
        <StatTile
          href="/admin/reservas"
          value={stats.bookingsUpcoming}
          label="Reservas próximas"
          hint={
            stats.bookingsPending === 0
              ? "Sin solicitudes pendientes"
              : stats.bookingsExpiringSoon > 0
                ? `${stats.bookingsPending} pendiente(s) · ${stats.bookingsExpiringSoon} por vencer`
                : `${stats.bookingsPending} pendiente(s) de confirmar`
          }
        />
        <StatTile
          href="/admin/bloqueos"
          value={stats.blocksUpcoming}
          label="Bloqueos vigentes"
          hint="Mantenimiento o uso propio"
        />
      </div>

      {/* Solicitudes por confirmar: la cola de trabajo real. Va antes que nada
          porque tiene reloj — pasadas 48 horas el hold caduca y las fechas se
          liberan solas. */}
      {pendingRequests.length > 0 && (
        <Card className="mt-6">
          <CardHeader
            title={`${pendingRequests.length} reserva${
              pendingRequests.length === 1 ? "" : "s"
            } por confirmar`}
            description="Las que llegan del sitio apartan sus fechas 48 horas: si nadie confirma antes, el hold caduca y el calendario las vuelve a ofrecer."
            action={
              <LinkButton href="/admin/reservas?estado=pending" tone="ghost" size="sm">
                Ver todas
              </LinkButton>
            }
          />
          <CardBody className="pt-0">
            <ul className="divide-y divide-ink/[0.07]">
              {pendingRequests.map((booking) => {
                const urgent = isExpiringSoon(booking.status, booking.expires_at);
                return (
                  <li key={booking.id} className="py-3">
                    <Link
                      href={`/admin/reservas/${booking.id}`}
                      className="group flex flex-wrap items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.9375rem] font-semibold text-ink group-hover:text-brand-700">
                          {booking.guest_name}
                          {booking.booking_code && (
                            <Pill tone="blue">{booking.booking_code}</Pill>
                          )}
                        </p>
                        <p className="mt-0.5 truncate text-[0.8125rem] text-ink-muted">
                          {booking.accommodation_name ?? "Alojamiento"} ·{" "}
                          {formatRangeEs(booking.check_in, booking.check_out)} ·{" "}
                          {formatCOP(booking.total_cop)}
                        </p>
                      </div>
                      <Pill tone={urgent ? "amber" : "neutral"}>
                        {formatHoldCountdownEs(booking.expires_at) ?? "Sin vencimiento"}
                      </Pill>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Próximas llegadas"
            description="Reservas que ocupan calendario de hoy en adelante."
            action={
              <LinkButton href="/admin/reservas" tone="ghost" size="sm">
                Ver todas
              </LinkButton>
            }
          />
          <CardBody className="pt-0">
            {upcoming.length === 0 ? (
              <EmptyState
                title="Sin reservas próximas"
                description="Cuando registres una reserva o llegue una por Airbnb/Booking, aparecerá aquí."
                action={
                  <LinkButton href="/admin/reservas/nueva" size="sm">
                    Registrar reserva
                  </LinkButton>
                }
              />
            ) : (
              <ul className="divide-y divide-ink/[0.07]">
                {upcoming.map((booking) => (
                  <BookingRow key={booking.id} booking={booking} />
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Últimas reservas registradas"
              description="Ordenadas por fecha de creación."
            />
            <CardBody className="pt-0">
              {recent.length === 0 ? (
                <EmptyState title="Todavía no hay reservas registradas" />
              ) : (
                <ul className="divide-y divide-ink/[0.07]">
                  {recent.map((booking) => (
                    <li key={booking.id} className="py-3">
                      <Link
                        href={`/admin/reservas/${booking.id}`}
                        className="group flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[0.9375rem] font-semibold text-ink group-hover:text-brand-700">
                            {booking.guest_name}
                          </p>
                          <p className="mt-0.5 truncate text-[0.8125rem] text-ink-muted">
                            {booking.accommodation_name ?? "Alojamiento"} ·{" "}
                            {formatRangeEs(booking.check_in, booking.check_out)}
                          </p>
                          <p className="mt-0.5 text-[0.75rem] text-ink-muted">
                            Creada el {formatTimestampEs(booking.created_at)}
                          </p>
                        </div>
                        <Pill tone={statusTone(booking.status)}>
                          {BOOKING_STATUS_LABEL[booking.status]}
                        </Pill>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Accesos rápidos"
              description="Las tareas del día a día."
            />
            <CardBody className="flex flex-wrap gap-2.5 pt-0">
              <LinkButton href="/admin/reservas/nueva" size="sm">
                Registrar reserva
              </LinkButton>
              <LinkButton href="/admin/bloqueos" tone="secondary" size="sm">
                Bloquear fechas
              </LinkButton>
              <LinkButton href="/admin/alojamientos/nuevo" tone="secondary" size="sm">
                Nuevo alojamiento
              </LinkButton>
              <LinkButton href="/admin/experiencias/nueva" tone="secondary" size="sm">
                Nueva experiencia
              </LinkButton>
              <LinkButton href="/admin/contenido" tone="secondary" size="sm">
                Editar textos del sitio
              </LinkButton>
            </CardBody>
          </Card>
        </div>
      </div>

      {blocks.length > 0 && (
        <Card className="mt-5">
          <CardHeader
            title="Bloqueos vigentes"
            description="Fechas que no se ofrecerán, aunque no correspondan a una reserva."
            action={
              <LinkButton href="/admin/bloqueos" tone="ghost" size="sm">
                Gestionar
              </LinkButton>
            }
          />
          <CardBody className="pt-0">
            <ul className="flex flex-wrap gap-2">
              {blocks.slice(0, 10).map((block) => (
                <li
                  key={block.id}
                  className="rounded-full bg-ink/[0.05] px-3.5 py-1.5 text-[0.8125rem] text-ink-soft"
                >
                  <span className="font-semibold text-ink">
                    {block.accommodation_name ?? "Alojamiento"}
                  </span>{" "}
                  · {formatRangeEs(block.start, block.end)}
                  {block.reason ? ` · ${block.reason}` : ""}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </>
  );
}

function BookingRow({ booking }: { booking: AdminBooking }) {
  const nights = nightsBetween(booking.check_in, booking.check_out);

  return (
    <li className="py-3">
      <Link
        href={`/admin/reservas/${booking.id}`}
        className="group flex flex-wrap items-start justify-between gap-3"
      >
        <div className="min-w-0">
          <p className="truncate text-[0.9375rem] font-semibold text-ink group-hover:text-brand-700">
            {booking.accommodation_name ?? "Alojamiento"}
          </p>
          <p className="mt-0.5 text-[0.8125rem] text-ink-muted">
            {formatRangeEs(booking.check_in, booking.check_out)} ·{" "}
            {nights} {nights === 1 ? "noche" : "noches"} · {booking.guest_name}
          </p>
          <p className="mt-0.5 text-[0.75rem] text-ink-muted">
            {BOOKING_SOURCE_LABEL[booking.source]}
            {booking.total_cop > 0 ? ` · ${formatCOP(booking.total_cop)}` : ""}
          </p>
        </div>
        <Pill tone={statusTone(booking.status)}>
          {BOOKING_STATUS_LABEL[booking.status]}
        </Pill>
      </Link>
    </li>
  );
}
