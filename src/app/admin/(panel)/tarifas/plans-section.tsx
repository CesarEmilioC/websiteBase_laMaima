import Link from "next/link";

import { deleteRatePlanAction, toggleRatePlanAction } from "./actions";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  LinkButton,
  Pill,
  buttonClass,
} from "@/components/admin/ui";
import { formatRangeEs } from "@/lib/admin/dates";
import {
  PLAN_STATUS_LABEL,
  planOverlaps,
  planStatus,
  type AdminRatePlan,
} from "@/lib/admin/rates";
import { formatCOP, formatGuests } from "@/lib/format";

/**
 * Área B de /admin/tarifas: los planes especiales (San Valentín, cumpleaños,
 * puentes con cena…).
 *
 * Es la parte que la administradora va a usar sola, así que la precedencia se
 * explica en pantalla —no solo en el código— y los solapes se avisan diciendo
 * cuál de los dos planes va a cobrar.
 */
export function PlansSection({ plans }: { plans: AdminRatePlan[] }) {
  const overlaps = planOverlaps(plans);

  return (
    <section aria-labelledby="tarifas-planes" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="tarifas-planes"
            className="text-[1.375rem] font-semibold tracking-[-0.02em] text-ink"
          >
            Planes especiales
          </h2>
          <p className="mt-1 max-w-3xl text-[0.9375rem] leading-relaxed text-ink-muted">
            Paquetes con precio propio para unas fechas concretas.{" "}
            <strong className="font-semibold text-ink">
              Cuando un plan está activo y las fechas elegidas caen dentro de su
              rango, su precio reemplaza la tarifa normal y el descuento entre
              semana.
            </strong>{" "}
            El nombre del plan aparece en la ficha del alojamiento y en el
            desglose del precio.
          </p>
        </div>
        <LinkButton href="/admin/tarifas/planes/nuevo">Nuevo plan</LinkButton>
      </div>

      {overlaps.length > 0 && (
        <div className="rounded-panel bg-amber-500/10 px-5 py-4 ring-1 ring-amber-500/25">
          <p className="text-[0.875rem] font-semibold text-amber-900">
            Hay planes activos que se cruzan en fechas
          </p>
          <ul className="mt-2 space-y-1.5 text-[0.8125rem] leading-relaxed text-amber-900/90">
            {overlaps.map((overlap) => (
              <li key={`${overlap.winner.id}-${overlap.loser.id}`}>
                “{overlap.winner.name}” y “{overlap.loser.name}” se pisan del{" "}
                {formatRangeEs(overlap.from, overlap.to)}. En esas noches cobrará{" "}
                <strong className="font-semibold">{overlap.winner.name}</strong>.
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[0.75rem] leading-relaxed text-amber-900/80">
            No es un error: puedes dejarlo así. Manda el plan del alojamiento
            concreto sobre el de “todos los alojamientos”; entre iguales, el de
            orden más bajo; y si aún empatan, el de menos noches.
          </p>
        </div>
      )}

      {plans.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="Todavía no hay planes especiales"
              description="Aquí se crean los paquetes con precio propio para unas fechas: San Valentín, cumpleaños, un puente con cena incluida. Mientras no haya ninguno, cada alojamiento cobra su tarifa normal."
              action={
                <LinkButton href="/admin/tarifas/planes/nuevo">
                  Crear el primer plan
                </LinkButton>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title={`${plans.length} plan${plans.length === 1 ? "" : "es"}`}
            description="Ordenados por el número de orden. Desactivar un plan lo deja guardado sin cobrar ni anunciarse."
          />
          <CardBody className="pt-0">
            <ul className="divide-y divide-ink/[0.07]">
              {plans.map((plan) => {
                const status = planStatus(plan);
                return (
                  <li
                    key={plan.id}
                    className="flex flex-wrap items-start justify-between gap-4 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/tarifas/planes/${plan.id}`}
                          className="text-[1rem] font-semibold text-ink hover:text-brand-700"
                        >
                          {plan.name}
                        </Link>
                        <Pill
                          tone={
                            status === "vigente"
                              ? "green"
                              : status === "proximo"
                                ? "blue"
                                : status === "inactivo"
                                  ? "amber"
                                  : "neutral"
                          }
                        >
                          {PLAN_STATUS_LABEL[status]}
                        </Pill>
                      </div>

                      <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-muted">
                        {formatRangeEs(plan.date_from, plan.date_to)} ·{" "}
                        {plan.accommodation_name ?? "Todos los alojamientos"} ·{" "}
                        {plan.price_per_night_cop === null
                          ? "sin precio propio (cobra la tarifa normal)"
                          : `${formatCOP(plan.price_per_night_cop)} por noche`}
                        {plan.guests_included !== null &&
                          ` · incluye ${formatGuests(plan.guests_included)}`}
                        {` · orden ${plan.sort}`}
                      </p>

                      {plan.description && (
                        <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-muted/85">
                          {plan.description}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/tarifas/planes/${plan.id}`}
                        className={buttonClass("secondary", "sm")}
                      >
                        Editar
                      </Link>
                      <form action={toggleRatePlanAction}>
                        <input type="hidden" name="id" value={plan.id} />
                        <input
                          type="hidden"
                          name="active"
                          value={plan.active ? "false" : "true"}
                        />
                        <SubmitButton
                          tone={plan.active ? "ghost" : "primary"}
                          size="sm"
                          pendingLabel="…"
                        >
                          {plan.active ? "Desactivar" : "Activar"}
                        </SubmitButton>
                      </form>
                      <form action={deleteRatePlanAction}>
                        <input type="hidden" name="id" value={plan.id} />
                        <SubmitButton
                          tone="danger"
                          size="sm"
                          pendingLabel="…"
                          confirm={`¿Eliminar el plan “${plan.name}”? Esta acción no se puede deshacer. Si solo quieres dejar de usarlo, desactívalo.`}
                        >
                          Eliminar
                        </SubmitButton>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      )}
    </section>
  );
}
