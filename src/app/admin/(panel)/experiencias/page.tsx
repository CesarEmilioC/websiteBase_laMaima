import type { Metadata } from "next";
import Link from "next/link";

import {
  deleteExperienceAction,
  saveExperiencesOrderAction,
  toggleExperienceVisibilityAction,
} from "./actions";
import { Flash } from "@/components/admin/flash";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  Card,
  CardHeader,
  EmptyState,
  LinkButton,
  PageHeading,
  Pill,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listExperiences } from "@/lib/admin/data";
import { formatCOP } from "@/lib/format";

export const metadata: Metadata = { title: "Experiencias" };
export const dynamic = "force-dynamic";

const ORDER_FORM_ID = "form-orden-experiencias";

export default async function ExperiencesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const [params, experiences] = await Promise.all([
    searchParams,
    listExperiences(),
  ]);

  return (
    <>
      <Flash ok={params.ok} error={params.error} />

      <PageHeading
        title="Experiencias"
        description="Actividades de la reserva: senderos, fogata, piscina de río… Se muestran en la página de experiencias."
        action={
          <LinkButton href="/admin/experiencias/nueva">
            Nueva experiencia
          </LinkButton>
        }
      />

      <Card>
        <CardHeader
          title={`${experiences.length} experiencia${experiences.length === 1 ? "" : "s"}`}
          description="Ajusta el número de orden y guarda para cambiar la posición."
        />

        {experiences.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Todavía no hay experiencias"
              action={
                <LinkButton href="/admin/experiencias/nueva" size="sm">
                  Crear experiencia
                </LinkButton>
              }
            />
          </div>
        ) : (
          <>
            <ul className="divide-y divide-black/[0.07]">
              {experiences.map((item) => {
                const cover = item.gallery[0];
                const price =
                  item.price_cop === null
                    ? (item.price_note ?? "Sin tarifa")
                    : `${formatCOP(item.price_cop)} por persona`;

                return (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6"
                  >
                    <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-black/[0.06]">
                      {cover ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={cover.url}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[0.625rem] font-semibold uppercase text-ink-muted">
                          Sin foto
                        </span>
                      )}
                    </div>

                    <div className="min-w-[12rem] flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/experiencias/${item.id}`}
                          className="text-[1rem] font-semibold text-ink transition-colors hover:text-forest-700"
                        >
                          {item.name}
                        </Link>
                        {item.visible ? (
                          <Pill tone="green">Visible</Pill>
                        ) : (
                          <Pill tone="neutral">Oculta</Pill>
                        )}
                      </div>
                      <p className="mt-1 text-[0.8125rem] text-ink-muted">
                        {item.duration ? `${item.duration} · ` : ""}
                        {price} · {item.gallery.length}{" "}
                        {item.gallery.length === 1 ? "foto" : "fotos"}
                      </p>
                    </div>

                    <label className="flex items-center gap-2 text-[0.75rem] font-semibold text-ink-muted">
                      Orden
                      <input
                        form={ORDER_FORM_ID}
                        type="number"
                        name={`order__${item.id}`}
                        defaultValue={item.sort_order}
                        min={0}
                        max={9999}
                        aria-label={`Orden de ${item.name}`}
                        className="w-16 rounded-xl bg-black/[0.04] px-2.5 py-1.5 text-center text-[0.875rem] font-semibold text-ink ring-1 ring-inset ring-black/[0.06] focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500"
                      />
                    </label>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/experiencias/${item.id}`}
                        className="rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold text-forest-700 transition-colors hover:bg-forest-600/10"
                      >
                        Editar
                      </Link>

                      <form action={toggleExperienceVisibilityAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input
                          type="hidden"
                          name="visible"
                          value={item.visible ? "false" : "true"}
                        />
                        <SubmitButton tone="secondary" size="sm" pendingLabel="…">
                          {item.visible ? "Ocultar" : "Mostrar"}
                        </SubmitButton>
                      </form>

                      <form action={deleteExperienceAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <SubmitButton
                          tone="danger"
                          size="sm"
                          pendingLabel="…"
                          confirm={`¿Eliminar "${item.name}"? Esta acción no se puede deshacer.`}
                        >
                          Eliminar
                        </SubmitButton>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex justify-end border-t border-black/[0.07] px-5 py-4 sm:px-6">
              <form id={ORDER_FORM_ID} action={saveExperiencesOrderAction}>
                <SubmitButton tone="secondary" size="sm" pendingLabel="Guardando…">
                  Guardar orden
                </SubmitButton>
              </form>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
