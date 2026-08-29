"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { saveRatePlanAction } from "./actions";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  Banner,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Select,
  Textarea,
  buttonClass,
} from "@/components/admin/ui";
import type { AdminRatePlan } from "@/lib/admin/rates";
import { IDLE_STATE, type AccommodationOption } from "@/lib/admin/types";

/**
 * Alta y edición de un plan especial ("San Valentín", "Cumpleaños"…).
 *
 * El mismo formulario sirve para los dos casos: si llega `plan`, es edición.
 * Los textos van escritos para alguien que no administra bases de datos: cada
 * campo dice qué efecto tiene en el precio que verá el huésped.
 */
export function PlanForm({
  plan,
  accommodations,
  nextSort,
}: {
  plan: AdminRatePlan | null;
  accommodations: AccommodationOption[];
  /** Orden sugerido al crear (uno más que el último plan). */
  nextSort: number;
}) {
  const [state, formAction] = useActionState(saveRatePlanAction, IDLE_STATE);
  const [hasPrice, setHasPrice] = useState(
    plan ? plan.price_per_night_cop !== null : true,
  );
  const isEdit = plan !== null;

  return (
    <form action={formAction} className="space-y-5">
      {plan && <input type="hidden" name="id" value={plan.id} />}

      {state.status !== "idle" && (
        <Banner tone={state.status === "ok" ? "ok" : "error"}>
          {state.message}
        </Banner>
      )}

      <Card>
        <CardHeader
          title="Qué plan es"
          description="El nombre es el que verá el huésped en la ficha del alojamiento y en el desglose del precio."
        />
        <CardBody className="space-y-4">
          <Field label="Nombre del plan" htmlFor="name" required>
            <Input
              id="name"
              name="name"
              required
              maxLength={120}
              placeholder="Ej.: Plan San Valentín"
              defaultValue={plan?.name ?? ""}
            />
          </Field>

          <Field
            label="Descripción corta"
            htmlFor="description"
            hint="Una línea explicando qué incluye. Ej.: “Cena a la luz de las velas y desayuno en la terraza”."
          >
            <Textarea
              id="description"
              name="description"
              rows={2}
              maxLength={400}
              defaultValue={plan?.description ?? ""}
              className="min-h-0"
            />
          </Field>

          <Field
            label="Alojamiento"
            htmlFor="accommodation_id"
            hint="Elige “Todos los alojamientos” si el plan vale para toda la reserva."
          >
            <Select
              id="accommodation_id"
              name="accommodation_id"
              defaultValue={plan?.accommodation_id ?? "all"}
            >
              <option value="all">Todos los alojamientos</option>
              {accommodations.map((accommodation) => (
                <option key={accommodation.id} value={accommodation.id}>
                  {accommodation.name}
                </option>
              ))}
            </Select>
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Fechas y precio"
          description="Cuando un plan está activo y las fechas elegidas caen dentro de su rango, su precio reemplaza la tarifa normal y el descuento de lunes a jueves."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Desde (primera noche)"
            htmlFor="date_from"
            required
            hint="La noche en que empieza a valer el plan."
          >
            <Input
              id="date_from"
              name="date_from"
              type="date"
              required
              defaultValue={plan?.date_from ?? ""}
            />
          </Field>

          <Field
            label="Hasta (última noche)"
            htmlFor="date_to"
            required
            hint="La última noche que cubre el plan, incluida."
          >
            <Input
              id="date_to"
              name="date_to"
              type="date"
              required
              defaultValue={plan?.date_to ?? ""}
            />
          </Field>

          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-ink/[0.035] px-4 py-3 ring-1 ring-inset ring-ink/[0.06]">
              <input
                type="checkbox"
                checked={hasPrice}
                onChange={(event) => setHasPrice(event.target.checked)}
                className="mt-0.5 h-5 w-5 rounded-md accent-brand-600"
              />
              <span>
                <span className="block text-[0.9375rem] font-medium text-ink">
                  El plan tiene precio propio por noche
                </span>
                <span className="mt-0.5 block text-[0.75rem] leading-relaxed text-ink-muted">
                  Si lo desmarcas, el plan solo le pone nombre a esas fechas y se
                  sigue cobrando la tarifa normal del alojamiento.
                </span>
              </span>
            </label>
          </div>

          {hasPrice && (
            <>
              <Field
                label="Precio por noche (COP)"
                htmlFor="price_per_night_cop"
                hint="Solo el número, sin puntos ni signo de peso. Ej.: 800000"
              >
                <Input
                  id="price_per_night_cop"
                  name="price_per_night_cop"
                  type="number"
                  // `min` va en 0 a propósito: con min=1 el navegador solo
                  // aceptaría 1, 1001, 2001… (múltiplos del paso desde el
                  // mínimo) y rechazaría un precio redondo como 777000. Que
                  // sea mayor que cero lo comprueba la Server Action, con un
                  // mensaje en español.
                  min={0}
                  step={1000}
                  defaultValue={plan?.price_per_night_cop ?? ""}
                />
              </Field>

              <Field
                label="Huéspedes incluidos"
                htmlFor="guests_included"
                hint="Cuántas personas cubre ese precio. Por encima se cobra el huésped adicional del alojamiento. Vacío = todas las que quepan."
              >
                <Input
                  id="guests_included"
                  name="guests_included"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={plan?.guests_included ?? ""}
                />
              </Field>
            </>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Publicación"
          description="Un plan desactivado no cobra nada ni se anuncia en el sitio, pero se conserva para volver a usarlo el año que viene."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Orden"
            htmlFor="sort"
            hint="Menor número = manda. Si dos planes activos se cruzan en fechas, gana el del alojamiento concreto y, entre iguales, el de orden más bajo."
          >
            <Input
              id="sort"
              name="sort"
              type="number"
              min={0}
              max={9999}
              defaultValue={plan?.sort ?? nextSort}
            />
          </Field>

          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-ink/[0.035] px-4 py-3 ring-1 ring-inset ring-ink/[0.06]">
              <input
                type="checkbox"
                name="active"
                defaultChecked={plan?.active ?? true}
                className="h-5 w-5 rounded-md accent-brand-600"
              />
              <span className="text-[0.9375rem] font-medium text-ink">
                Plan activo
              </span>
            </label>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel="Guardando…">
          {isEdit ? "Guardar plan" : "Crear plan"}
        </SubmitButton>
        <Link href="/admin/tarifas" className={buttonClass("secondary")}>
          Volver a tarifas
        </Link>
      </div>
    </form>
  );
}
