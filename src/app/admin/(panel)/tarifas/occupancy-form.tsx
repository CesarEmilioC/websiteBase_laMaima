"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { saveOccupancyRatesAction } from "./actions";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  Banner,
  Card,
  CardBody,
  CardHeader,
  Field,
  INPUT_CLASS,
  Input,
  Textarea,
  buttonClass,
} from "@/components/admin/ui";
import type { AdminRateTier } from "@/lib/admin/rates";
import {
  IDLE_STATE,
  TIER_DAY_TYPE_LABEL,
  TIER_DAY_TYPES,
  type AdminAccommodation,
} from "@/lib/admin/types";
import { formatCOP } from "@/lib/format";
import type { TierDayType } from "@/lib/pricing";

/** Fila de la tabla mientras se edita: los números viven como texto. */
type Row = {
  key: string;
  guests: string;
  price: string;
  dayType: TierDayType;
};

let rowSeq = 0;
function newKey(): string {
  rowSeq += 1;
  return `row-${rowSeq}`;
}

function toRows(tiers: AdminRateTier[]): Row[] {
  return tiers.map((tier) => ({
    key: newKey(),
    guests: String(tier.guests),
    price: String(tier.price_cop),
    dayType: tier.day_type,
  }));
}

/**
 * Editor de la tabla de precios por ocupación de un alojamiento.
 *
 * La tabla es el corazón del modelo de La Maima ("2 personas: $570.000"), así
 * que se edita como una tabla de verdad —una fila por tramo— y no como un
 * campo de texto con formato. El JSON viaja en un input oculto: la Server
 * Action lo vuelve a validar entero.
 */
export function OccupancyForm({
  accommodation,
  tiers,
}: {
  accommodation: AdminAccommodation;
  tiers: AdminRateTier[];
}) {
  const [state, formAction] = useActionState(
    saveOccupancyRatesAction,
    IDLE_STATE,
  );

  const [rows, setRows] = useState<Row[]>(() => toRows(tiers));
  const [breakfastIncluded, setBreakfastIncluded] = useState(
    accommodation.breakfast_included ?? false,
  );

  const payload = useMemo(
    () =>
      JSON.stringify(
        rows.map((row) => ({
          guests: row.guests === "" ? "" : Number(row.guests),
          price_cop: row.price === "" ? "" : Number(row.price),
          day_type: row.dayType,
        })),
      ),
    [rows],
  );

  // La tarifa "Desde" que verá el sitio es el tramo más barato: mostrarla aquí
  // evita el viaje al sitio público para comprobar qué quedó publicado.
  const lowest = useMemo(() => {
    const prices = rows
      .map((row) => Number(row.price))
      .filter((price) => Number.isFinite(price) && price > 0);
    return prices.length ? Math.min(...prices) : null;
  }, [rows]);

  const usesTwoTables = rows.some((row) => row.dayType !== "any");

  function update(key: string, patch: Partial<Row>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((current) => {
      const last = current[current.length - 1];
      const nextGuests = last ? Number(last.guests) + 1 : 1;
      return [
        ...current,
        {
          key: newKey(),
          guests: Number.isFinite(nextGuests) ? String(nextGuests) : "",
          price: "",
          dayType: last?.dayType ?? "any",
        },
      ];
    });
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="accommodation_id" value={accommodation.id} />
      <input type="hidden" name="tiers" value={payload} />

      {state.status !== "idle" && (
        <Banner tone={state.status === "ok" ? "ok" : "error"}>
          {state.message}
        </Banner>
      )}

      <Card>
        <CardHeader
          title="Precio por número de huéspedes"
          description="Una fila por cada tarifa publicada. Se cobra la fila más baja que alcance para el grupo: si hay filas de 8 y de 10 personas, nueve huéspedes pagan la de 10."
        />
        <CardBody className="space-y-4">
          {rows.length === 0 ? (
            <p className="rounded-card bg-ink/[0.03] px-4 py-5 text-[0.875rem] leading-relaxed text-ink-muted">
              Este alojamiento todavía no tiene tabla de precios. Mientras no la
              tenga, el sitio muestra {formatCOP(accommodation.price_per_night_cop)}{" "}
              como tarifa de referencia.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] border-separate border-spacing-y-2 text-[0.9375rem]">
                <thead>
                  <tr className="text-left text-[0.75rem] uppercase tracking-wide text-ink-muted">
                    <th className="px-1 pb-1 font-semibold">Huéspedes</th>
                    <th className="px-1 pb-1 font-semibold">Precio por noche (COP)</th>
                    <th className="px-1 pb-1 font-semibold">Tipo de noche</th>
                    <th className="px-1 pb-1" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <td className="w-28 pr-2 align-middle">
                        <input
                          type="number"
                          min={1}
                          max={accommodation.capacity}
                          inputMode="numeric"
                          aria-label="Número de huéspedes"
                          value={row.guests}
                          onChange={(event) =>
                            update(row.key, { guests: event.target.value })
                          }
                          className={`${INPUT_CLASS} px-3 py-2`}
                        />
                      </td>
                      <td className="pr-2 align-middle">
                        <input
                          type="number"
                          // min=0 con step=1000: si el mínimo fuera 1, el
                          // navegador solo daría por válidos 1, 1001, 2001… y
                          // rechazaría $570.000. Que el precio sea mayor que
                          // cero lo valida la Server Action.
                          min={0}
                          step={1000}
                          inputMode="numeric"
                          aria-label="Precio por noche en pesos"
                          value={row.price}
                          onChange={(event) =>
                            update(row.key, { price: event.target.value })
                          }
                          className={`${INPUT_CLASS} px-3 py-2`}
                        />
                      </td>
                      <td className="pr-2 align-middle">
                        <select
                          aria-label="Tipo de noche"
                          value={row.dayType}
                          onChange={(event) =>
                            update(row.key, {
                              dayType: event.target.value as TierDayType,
                            })
                          }
                          className={`${INPUT_CLASS} px-3 py-2 pr-9`}
                        >
                          {TIER_DAY_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {TIER_DAY_TYPE_LABEL[type]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="w-20 align-middle">
                        <button
                          type="button"
                          onClick={() =>
                            setRows((current) =>
                              current.filter((item) => item.key !== row.key),
                            )
                          }
                          className={buttonClass("danger", "sm")}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={addRow} className={buttonClass("secondary", "sm")}>
              Añadir fila
            </button>
            {lowest !== null && (
              <p className="text-[0.8125rem] text-ink-muted">
                En el sitio se anunciará{" "}
                <strong className="font-semibold text-ink">
                  Desde {formatCOP(lowest)}
                </strong>{" "}
                por noche.
              </p>
            )}
          </div>

          <p className="rounded-card bg-ink/[0.03] px-4 py-3 text-[0.8125rem] leading-relaxed text-ink-muted">
            <strong className="font-semibold text-ink">Tipo de noche.</strong>{" "}
            Lo normal es dejar todas las filas en “Todos los días” y usar el
            descuento de lunes a jueves de más abajo. Solo si el alojamiento
            publica dos tablas distintas (como Tres Casitas) se usan las filas de
            “Fin de semana y festivos” y “Lunes a jueves”, y entonces el
            descuento se deja vacío.
            {usesTwoTables && (
              <>
                {" "}
                <strong className="font-semibold text-ink">
                  Ahora mismo este alojamiento usa dos tablas.
                </strong>
              </>
            )}
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Huésped adicional, desayuno y descuento"
          description="Se aplican sobre la tabla de arriba."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Huésped adicional (COP)"
            htmlFor="extra_person_price_cop"
            hint="Lo que se cobra por cada persona por encima de la fila más alta. Déjalo vacío si no se admiten adicionales."
          >
            <Input
              id="extra_person_price_cop"
              name="extra_person_price_cop"
              type="number"
              min={0}
              step={1000}
              defaultValue={accommodation.extra_person_price_cop ?? ""}
            />
          </Field>

          <Field
            label="Huésped adicional de lunes a jueves (COP)"
            htmlFor="extra_person_price_weekday_cop"
            hint="Solo si entre semana el adicional cuesta distinto. Si se cobra igual, déjalo vacío."
          >
            <Input
              id="extra_person_price_weekday_cop"
              name="extra_person_price_weekday_cop"
              type="number"
              min={0}
              step={1000}
              defaultValue={accommodation.extra_person_price_weekday_cop ?? ""}
            />
          </Field>

          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-ink/[0.035] px-4 py-3 ring-1 ring-inset ring-ink/[0.06]">
              <input
                type="checkbox"
                name="breakfast_included"
                checked={breakfastIncluded}
                onChange={(event) => setBreakfastIncluded(event.target.checked)}
                className="h-5 w-5 rounded-md accent-brand-600"
              />
              <span className="text-[0.9375rem] font-medium text-ink">
                Desayuno incluido en la tarifa
              </span>
            </label>
          </div>

          <Field
            label="Precio del desayuno por persona (COP)"
            htmlFor="breakfast_price_cop"
            hint={
              breakfastIncluded
                ? "Con el desayuno incluido este campo no se usa."
                : "Si el desayuno se cobra aparte. Vacío = no se menciona en el sitio."
            }
          >
            <Input
              id="breakfast_price_cop"
              name="breakfast_price_cop"
              type="number"
              min={0}
              step={1000}
              disabled={breakfastIncluded}
              defaultValue={accommodation.breakfast_price_cop ?? ""}
              className={breakfastIncluded ? "opacity-50" : ""}
            />
          </Field>

          <Field
            label="Descuento de lunes a jueves (%)"
            htmlFor="weekday_discount_pct"
            hint="25 en casi todos los alojamientos. No se aplica en festivos ni entre el 14 de diciembre y el 15 de enero. Déjalo vacío si el alojamiento publica dos tablas."
          >
            <Input
              id="weekday_discount_pct"
              name="weekday_discount_pct"
              type="number"
              min={1}
              max={99}
              defaultValue={accommodation.weekday_discount_pct ?? ""}
            />
          </Field>

          <Field
            label="Aclaración corta junto al precio"
            htmlFor="price_note"
            hint="Aparece bajo el “Desde”. Ej.: “2 personas · desayuno incluido”."
          >
            <Input
              id="price_note"
              name="price_note"
              maxLength={160}
              defaultValue={accommodation.price_note ?? ""}
            />
          </Field>

          <Field
            label="Nota larga de la tarifa"
            htmlFor="rate_note"
            hint="Se muestra debajo de la tabla de precios en la ficha del alojamiento."
            className="sm:col-span-2"
          >
            <Textarea
              id="rate_note"
              name="rate_note"
              rows={3}
              maxLength={600}
              defaultValue={accommodation.rate_note ?? ""}
            />
          </Field>
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel="Guardando…">Guardar tarifas</SubmitButton>
        <Link href="/admin/tarifas" className={buttonClass("secondary")}>
          Volver a tarifas
        </Link>
        <Link
          href={`/alojamientos/${accommodation.slug}`}
          target="_blank"
          rel="noreferrer"
          className={buttonClass("ghost")}
        >
          Ver en el sitio
        </Link>
      </div>
    </form>
  );
}
