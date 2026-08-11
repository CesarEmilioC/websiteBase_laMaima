import type { Metadata } from "next";
import Link from "next/link";

import {
  deleteAccommodationAction,
  saveAccommodationsOrderAction,
  toggleAccommodationVisibilityAction,
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
import { listAccommodations } from "@/lib/admin/data";
import { formatCOP, formatGuests } from "@/lib/format";

export const metadata: Metadata = { title: "Alojamientos" };
export const dynamic = "force-dynamic";

/** Id del formulario de orden: los inputs viven en la tabla y se enlazan con
 *  el atributo `form`, porque anidar formularios no es válido en HTML. */
const ORDER_FORM_ID = "form-orden-alojamientos";

export default async function AccommodationsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const [params, accommodations] = await Promise.all([
    searchParams,
    listAccommodations(),
  ]);

  return (
    <>
      <Flash ok={params.ok} error={params.error} />

      <PageHeading
        title="Alojamientos"
        description="Casas y cabañas que se publican en el sitio. Oculta un alojamiento en vez de borrarlo si solo quieres retirarlo temporalmente."
        action={
          <LinkButton href="/admin/alojamientos/nuevo">
            Nuevo alojamiento
          </LinkButton>
        }
      />

      <Card>
        <CardHeader
          title={`${accommodations.length} alojamiento${accommodations.length === 1 ? "" : "s"}`}
          description="Ajusta el número de orden y guarda para cambiar la posición en el listado público."
        />

        {accommodations.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Todavía no hay alojamientos"
              description="Crea el primero para que aparezca en el sitio."
              action={
                <LinkButton href="/admin/alojamientos/nuevo" size="sm">
                  Crear alojamiento
                </LinkButton>
              }
            />
          </div>
        ) : (
          <>
            <ul className="divide-y divide-black/[0.07]">
              {accommodations.map((item) => {
                const cover = item.gallery[0];
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
                          href={`/admin/alojamientos/${item.id}`}
                          className="text-[1rem] font-semibold text-ink transition-colors hover:text-forest-700"
                        >
                          {item.name}
                        </Link>
                        {item.visible ? (
                          <Pill tone="green">Visible</Pill>
                        ) : (
                          <Pill tone="neutral">Oculto</Pill>
                        )}
                      </div>
                      <p className="mt-1 text-[0.8125rem] text-ink-muted">
                        /alojamientos/{item.slug} · {formatGuests(item.capacity)} ·{" "}
                        {formatCOP(item.price_per_night_cop)} / noche ·{" "}
                        {item.gallery.length}{" "}
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
                        href={`/admin/alojamientos/${item.id}`}
                        className="rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold text-forest-700 transition-colors hover:bg-forest-600/10"
                      >
                        Editar
                      </Link>

                      <form action={toggleAccommodationVisibilityAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input
                          type="hidden"
                          name="visible"
                          value={item.visible ? "false" : "true"}
                        />
                        <SubmitButton
                          tone="secondary"
                          size="sm"
                          pendingLabel="…"
                        >
                          {item.visible ? "Ocultar" : "Mostrar"}
                        </SubmitButton>
                      </form>

                      <form action={deleteAccommodationAction}>
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
              <form id={ORDER_FORM_ID} action={saveAccommodationsOrderAction}>
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
