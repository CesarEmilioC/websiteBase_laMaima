import type { Metadata } from "next";

import { BlockForm } from "./block-form";
import { deleteBlockAction } from "./actions";
import { Flash } from "@/components/admin/flash";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeading,
  Pill,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listAccommodationOptions, listBlockedDates } from "@/lib/admin/data";
import {
  addDays,
  formatRangeEs,
  nightsBetween,
  todayInBogota,
} from "@/lib/admin/dates";

export const metadata: Metadata = { title: "Bloqueo de fechas" };
export const dynamic = "force-dynamic";

export default async function BlockedDatesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const [params, accommodations, blocks] = await Promise.all([
    searchParams,
    listAccommodationOptions(),
    listBlockedDates(),
  ]);

  const today = todayInBogota();
  const upcoming = blocks.filter((block) => block.end > today);
  const past = blocks.filter((block) => block.end <= today);

  return (
    <>
      <Flash ok={params.ok} error={params.error} />

      <PageHeading
        title="Bloqueo de fechas"
        description="Fechas que no se ofrecerán aunque no correspondan a una reserva: mantenimiento, uso propio o un cierre puntual."
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Bloquear un rango" />
          <CardBody>
            <BlockForm accommodations={accommodations} />
          </CardBody>
        </Card>

        <div className="space-y-5 lg:col-span-3">
          <Card>
            <CardHeader
              title="Próximos bloqueos"
              description={`${upcoming.length} vigente${upcoming.length === 1 ? "" : "s"} de hoy en adelante.`}
            />
            <CardBody className="pt-0">
              {upcoming.length === 0 ? (
                <EmptyState
                  title="No hay fechas bloqueadas"
                  description="Todo el calendario está disponible salvo lo que ocupen las reservas."
                />
              ) : (
                <ul className="divide-y divide-black/[0.07]">
                  {upcoming.map((block) => {
                    const lastNight = addDays(block.end, -1);
                    const nights = nightsBetween(block.start, block.end);
                    return (
                      <li
                        key={block.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-[0.9375rem] font-semibold text-ink">
                            {block.accommodation_name ?? "Alojamiento"}
                          </p>
                          <p className="mt-0.5 text-[0.8125rem] text-ink-muted">
                            {formatRangeEs(block.start, lastNight)} ·{" "}
                            {nights} {nights === 1 ? "noche" : "noches"}
                            {block.reason ? ` · ${block.reason}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {block.start > today ? (
                            <Pill tone="neutral">Programado</Pill>
                          ) : (
                            <Pill tone="amber">En curso</Pill>
                          )}
                          <form action={deleteBlockAction}>
                            <input type="hidden" name="id" value={block.id} />
                            <SubmitButton
                              tone="danger"
                              size="sm"
                              pendingLabel="…"
                              confirm="¿Quitar este bloqueo? Las fechas volverán a estar disponibles."
                            >
                              Quitar
                            </SubmitButton>
                          </form>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          {past.length > 0 && (
            <Card>
              <CardHeader
                title="Bloqueos pasados"
                description="Ya no afectan al calendario. Puedes borrarlos para mantener la lista limpia."
              />
              <CardBody className="pt-0">
                <ul className="divide-y divide-black/[0.07]">
                  {past.slice(-15).reverse().map((block) => (
                    <li
                      key={block.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                    >
                      <p className="text-[0.8125rem] text-ink-muted">
                        <span className="font-semibold text-ink-soft">
                          {block.accommodation_name ?? "Alojamiento"}
                        </span>{" "}
                        · {formatRangeEs(block.start, addDays(block.end, -1))}
                        {block.reason ? ` · ${block.reason}` : ""}
                      </p>
                      <form action={deleteBlockAction}>
                        <input type="hidden" name="id" value={block.id} />
                        <SubmitButton tone="secondary" size="sm" pendingLabel="…">
                          Borrar
                        </SubmitButton>
                      </form>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
