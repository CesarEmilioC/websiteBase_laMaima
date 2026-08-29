import {
  createHolidayAction,
  deleteHolidayAction,
  deleteMinStayRuleAction,
  saveMinStayRuleAction,
} from "./actions";
import { ActionForm } from "@/components/admin/action-form";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Pill,
  Select,
} from "@/components/admin/ui";
import { formatDateEs, formatRangeEs, todayInBogota } from "@/lib/admin/dates";
import type { AdminHoliday, AdminMinStayRule } from "@/lib/admin/rates";
import type { AccommodationOption } from "@/lib/admin/types";

/**
 * Área C de /admin/tarifas: festivos y temporadas.
 *
 * Son las dos tablas que hacen que el motor sepa qué noche es cara y cuántas
 * noches hay que quedarse. No se tocan a diario —los festivos se siembran una
 * vez al año— así que van al final de la página y con explicación larga.
 */
export function SeasonsSection({
  holidays,
  rules,
  accommodations,
}: {
  holidays: AdminHoliday[];
  rules: AdminMinStayRule[];
  accommodations: AccommodationOption[];
}) {
  const today = todayInBogota();
  const upcoming = holidays.filter((holiday) => holiday.date >= today);

  // Los festivos se agrupan por año: es como los publica el Gobierno y como se
  // siembran (un año entero de una vez).
  const byYear = new Map<string, AdminHoliday[]>();
  for (const holiday of upcoming) {
    const year = holiday.date.slice(0, 4);
    byYear.set(year, [...(byYear.get(year) ?? []), holiday]);
  }
  const lastYear = [...byYear.keys()].sort().pop() ?? null;

  const rulesByAccommodation = new Map<string, AdminMinStayRule[]>();
  for (const rule of rules) {
    rulesByAccommodation.set(rule.accommodation_id, [
      ...(rulesByAccommodation.get(rule.accommodation_id) ?? []),
      rule,
    ]);
  }

  return (
    <section aria-labelledby="tarifas-temporadas" className="space-y-4">
      <div>
        <h2
          id="tarifas-temporadas"
          className="text-[1.375rem] font-semibold tracking-[-0.02em] text-ink"
        >
          Festivos y temporadas
        </h2>
        <p className="mt-1 max-w-3xl text-[0.9375rem] leading-relaxed text-ink-muted">
          Los festivos se cobran como fin de semana (sin el descuento de lunes a
          jueves) y, cuando caen en lunes, arman puente. Las temporadas fijan
          cuántas noches como mínimo hay que reservar.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* --- Festivos ---------------------------------------------------- */}
        <Card>
          <CardHeader
            title="Festivos de Colombia"
            description={
              lastYear
                ? `Sembrados hasta ${lastYear}. Añade el año siguiente cuando se acerque para que el calendario siga cobrando bien.`
                : "No hay festivos futuros cargados: el calendario está cobrando todos los lunes a jueves como entre semana."
            }
          />
          <CardBody className="space-y-5">
            <ActionForm
              action={createHolidayAction}
              submitLabel="Añadir festivo"
              pendingLabel="Añadiendo…"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Fecha" htmlFor="holiday_date" required>
                  <Input
                    id="holiday_date"
                    name="holiday_date"
                    type="date"
                    required
                  />
                </Field>
                <Field
                  label="Nombre"
                  htmlFor="holiday_name"
                  required
                  hint="Ej.: Día de la Raza (ya trasladado al lunes)."
                >
                  <Input id="holiday_name" name="name" required maxLength={120} />
                </Field>
              </div>
            </ActionForm>

            {upcoming.length === 0 ? (
              <p className="rounded-card bg-amber-500/10 px-4 py-3 text-[0.8125rem] leading-relaxed text-amber-800">
                No queda ningún festivo por delante en la lista.
              </p>
            ) : (
              [...byYear.entries()].map(([year, list]) => (
                <details
                  key={year}
                  open={year === today.slice(0, 4)}
                  className="rounded-card bg-ink/[0.03] px-4 py-3"
                >
                  <summary className="cursor-pointer text-[0.875rem] font-semibold text-ink">
                    {year} · {list.length} festivo{list.length === 1 ? "" : "s"}
                  </summary>
                  <ul className="mt-2 divide-y divide-ink/[0.07]">
                    {list.map((holiday) => (
                      <li
                        key={holiday.date}
                        className="flex flex-wrap items-center justify-between gap-3 py-2"
                      >
                        <p className="text-[0.8125rem] text-ink-soft">
                          <span className="font-semibold text-ink">
                            {formatDateEs(holiday.date)}
                          </span>{" "}
                          · {holiday.name}
                        </p>
                        <div className="flex items-center gap-2">
                          {holiday.is_bridge && <Pill tone="blue">Puente</Pill>}
                          <form action={deleteHolidayAction}>
                            <input
                              type="hidden"
                              name="holiday_date"
                              value={holiday.date}
                            />
                            <SubmitButton
                              tone="danger"
                              size="sm"
                              pendingLabel="…"
                              confirm={`¿Quitar el festivo del ${formatDateEs(holiday.date)}? Esa noche pasará a cobrarse como entre semana.`}
                            >
                              Quitar
                            </SubmitButton>
                          </form>
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              ))
            )}
          </CardBody>
        </Card>

        {/* --- Estancias mínimas ------------------------------------------- */}
        <Card>
          <CardHeader
            title="Estancia mínima por temporada"
            description="Si el huésped elige menos noches de las que pide la temporada, el sitio se lo dice y no lo deja enviar la solicitud."
          />
          <CardBody className="space-y-5">
            <details className="rounded-card bg-ink/[0.03] px-4 py-3">
              <summary className="cursor-pointer text-[0.875rem] font-semibold text-ink">
                Añadir una regla
              </summary>
              <div className="pt-4">
                <ActionForm
                  action={saveMinStayRuleAction}
                  submitLabel="Añadir regla"
                  pendingLabel="Añadiendo…"
                >
                  <MinStayFields accommodations={accommodations} rule={null} />
                </ActionForm>
              </div>
            </details>

            {rules.length === 0 ? (
              <p className="rounded-card bg-ink/[0.03] px-4 py-3 text-[0.8125rem] leading-relaxed text-ink-muted">
                No hay reglas de estancia mínima: se puede reservar una sola
                noche en cualquier fecha.
              </p>
            ) : (
              accommodations
                .filter((accommodation) =>
                  rulesByAccommodation.has(accommodation.id),
                )
                .map((accommodation) => (
                  <details
                    key={accommodation.id}
                    className="rounded-card bg-ink/[0.03] px-4 py-3"
                  >
                    <summary className="cursor-pointer text-[0.875rem] font-semibold text-ink">
                      {accommodation.name} ·{" "}
                      {rulesByAccommodation.get(accommodation.id)?.length} regla
                      {rulesByAccommodation.get(accommodation.id)?.length === 1
                        ? ""
                        : "s"}
                    </summary>

                    <ul className="mt-2 space-y-2">
                      {(rulesByAccommodation.get(accommodation.id) ?? []).map(
                        (rule) => (
                          <li
                            key={rule.id}
                            className="rounded-card bg-white px-4 py-3 ring-1 ring-ink/[0.05]"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-[0.8125rem] text-ink-soft">
                                <span className="font-semibold text-ink">
                                  {rule.label}
                                </span>{" "}
                                ·{" "}
                                {rule.rule_type === "holiday_bridge"
                                  ? "puentes festivos"
                                  : rule.date_from && rule.date_to
                                    ? formatRangeEs(rule.date_from, rule.date_to)
                                    : "sin fechas"}{" "}
                                · mínimo {rule.min_nights}{" "}
                                {rule.min_nights === 1 ? "noche" : "noches"}
                              </p>
                              <form action={deleteMinStayRuleAction}>
                                <input type="hidden" name="id" value={rule.id} />
                                <SubmitButton
                                  tone="danger"
                                  size="sm"
                                  pendingLabel="…"
                                  confirm={`¿Eliminar la regla “${rule.label}” de ${accommodation.name}?`}
                                >
                                  Eliminar
                                </SubmitButton>
                              </form>
                            </div>

                            <details className="mt-2">
                              <summary className="cursor-pointer text-[0.75rem] font-semibold text-brand-700">
                                Editar
                              </summary>
                              <div className="pt-3">
                                <ActionForm
                                  action={saveMinStayRuleAction}
                                  submitLabel="Guardar regla"
                                >
                                  <input
                                    type="hidden"
                                    name="id"
                                    value={rule.id}
                                  />
                                  <MinStayFields
                                    accommodations={accommodations}
                                    rule={rule}
                                  />
                                </ActionForm>
                              </div>
                            </details>
                          </li>
                        ),
                      )}
                    </ul>
                  </details>
                ))
            )}
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

/**
 * Campos de una regla de estancia mínima. Los mismos para crear y para editar,
 * así no hay dos formularios que se puedan desincronizar.
 */
function MinStayFields({
  accommodations,
  rule,
}: {
  accommodations: AccommodationOption[];
  rule: AdminMinStayRule | null;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Alojamiento" htmlFor={`acc-${rule?.id ?? "nuevo"}`} required>
        <Select
          id={`acc-${rule?.id ?? "nuevo"}`}
          name="accommodation_id"
          required
          defaultValue={rule?.accommodation_id ?? ""}
        >
          <option value="" disabled>
            Elige un alojamiento
          </option>
          {accommodations.map((accommodation) => (
            <option key={accommodation.id} value={accommodation.id}>
              {accommodation.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Nombre de la temporada"
        htmlFor={`label-${rule?.id ?? "nuevo"}`}
        required
        hint="Es el texto que lee el huésped. Ej.: “Semana Santa 2028”."
      >
        <Input
          id={`label-${rule?.id ?? "nuevo"}`}
          name="label"
          required
          maxLength={120}
          defaultValue={rule?.label ?? ""}
        />
      </Field>

      <Field
        label="Cuándo aplica"
        htmlFor={`type-${rule?.id ?? "nuevo"}`}
        hint="“Puentes festivos” se calcula solo con la lista de festivos; no hace falta ponerle fechas."
      >
        <Select
          id={`type-${rule?.id ?? "nuevo"}`}
          name="rule_type"
          defaultValue={rule?.rule_type ?? "date_range"}
        >
          <option value="date_range">Fechas concretas</option>
          <option value="holiday_bridge">Puentes festivos</option>
        </Select>
      </Field>

      <Field
        label="Noches mínimas"
        htmlFor={`nights-${rule?.id ?? "nuevo"}`}
        required
      >
        <Input
          id={`nights-${rule?.id ?? "nuevo"}`}
          name="min_nights"
          type="number"
          min={1}
          max={30}
          required
          defaultValue={rule?.min_nights ?? 2}
        />
      </Field>

      <Field
        label="Desde"
        htmlFor={`from-${rule?.id ?? "nuevo"}`}
        hint="Solo para “Fechas concretas”."
      >
        <Input
          id={`from-${rule?.id ?? "nuevo"}`}
          name="date_from"
          type="date"
          defaultValue={rule?.date_from ?? ""}
        />
      </Field>

      <Field
        label="Hasta"
        htmlFor={`to-${rule?.id ?? "nuevo"}`}
        hint="Última noche de la temporada, incluida."
      >
        <Input
          id={`to-${rule?.id ?? "nuevo"}`}
          name="date_to"
          type="date"
          defaultValue={rule?.date_to ?? ""}
        />
      </Field>

      <input type="hidden" name="sort" value={rule?.sort ?? 0} />
    </div>
  );
}
