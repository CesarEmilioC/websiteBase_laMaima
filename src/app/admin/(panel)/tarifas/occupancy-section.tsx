import {
  Card,
  CardBody,
  CardHeader,
  LinkButton,
  Pill,
} from "@/components/admin/ui";
import type { AdminRateTier } from "@/lib/admin/rates";
import type { AdminAccommodation } from "@/lib/admin/types";
import { formatCOP } from "@/lib/format";
import { lowestRate, tierRows } from "@/lib/pricing";

/**
 * Área A de /admin/tarifas: la tabla por ocupación de cada alojamiento.
 *
 * Aquí solo se resume lo publicado; editar lleva a la página propia del
 * alojamiento, que es donde cabe la tabla completa sin apretujar la pantalla.
 */
export function OccupancySection({
  accommodations,
  tiersByAccommodation,
}: {
  accommodations: AdminAccommodation[];
  tiersByAccommodation: Map<string, AdminRateTier[]>;
}) {
  return (
    <section aria-labelledby="tarifas-ocupacion" className="space-y-4">
      <div>
        <h2
          id="tarifas-ocupacion"
          className="text-[1.375rem] font-semibold tracking-[-0.02em] text-ink"
        >
          Tarifas por ocupación
        </h2>
        <p className="mt-1 max-w-3xl text-[0.9375rem] leading-relaxed text-ink-muted">
          El precio de cada alojamiento depende de cuántas personas se queden.
          Aquí ves la tabla publicada de cada uno; entra a editar para cambiar
          precios, el valor del huésped adicional, el desayuno o el descuento de
          lunes a jueves.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {accommodations.map((accommodation) => {
          const tiers = tiersByAccommodation.get(accommodation.id) ?? [];
          const from = lowestRate(tiers, accommodation.price_per_night_cop);
          const rows = tierRows(tiers);

          return (
            <Card key={accommodation.id}>
              <CardHeader
                title={accommodation.name}
                description={`Hasta ${accommodation.capacity} personas · Desde ${formatCOP(from.amountCop)} por noche`}
                action={
                  <LinkButton
                    href={`/admin/tarifas/${accommodation.id}`}
                    size="sm"
                  >
                    Editar tarifas
                  </LinkButton>
                }
              />
              <CardBody className="space-y-3">
                {rows.length === 0 ? (
                  <p className="rounded-card bg-amber-500/10 px-4 py-3 text-[0.8125rem] leading-relaxed text-amber-800">
                    Sin tabla de precios. El sitio muestra{" "}
                    {formatCOP(accommodation.price_per_night_cop)} como tarifa de
                    referencia hasta que se publique una.
                  </p>
                ) : (
                  <dl className="overflow-hidden rounded-card bg-ink/[0.03] text-[0.875rem]">
                    {rows.map((row, index) => (
                      <div
                        key={row.key}
                        className={`flex items-center justify-between gap-4 px-4 py-2 ${
                          index > 0 ? "border-t border-ink/[0.06]" : ""
                        }`}
                      >
                        <dt className="text-ink-muted">{row.label}</dt>
                        <dd className="font-semibold tabular-nums text-ink">
                          {formatCOP(row.price)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}

                <div className="flex flex-wrap gap-2">
                  {accommodation.weekday_discount_pct !== null && (
                    <Pill tone="green">
                      {accommodation.weekday_discount_pct} % de lunes a jueves
                    </Pill>
                  )}
                  {accommodation.extra_person_price_cop !== null && (
                    <Pill tone="neutral">
                      Adicional {formatCOP(accommodation.extra_person_price_cop)}
                      {accommodation.extra_person_price_weekday_cop !== null &&
                        ` · ${formatCOP(accommodation.extra_person_price_weekday_cop)} L-J`}
                    </Pill>
                  )}
                  <Pill tone={accommodation.breakfast_included ? "green" : "neutral"}>
                    {accommodation.breakfast_included
                      ? "Desayuno incluido"
                      : accommodation.breakfast_price_cop !== null
                        ? `Desayuno ${formatCOP(accommodation.breakfast_price_cop)}`
                        : "Desayuno sin definir"}
                  </Pill>
                  {!accommodation.visible && <Pill tone="amber">Oculto en el sitio</Pill>}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
