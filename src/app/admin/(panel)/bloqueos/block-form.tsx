"use client";

import { useActionState, useState } from "react";

import { createBlockAction } from "./actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { Banner, Field, Input, Select } from "@/components/admin/ui";
import { nightsBetween, todayInBogota } from "@/lib/admin/dates";
import { IDLE_STATE, type AccommodationOption } from "@/lib/admin/types";

const REASON_SUGGESTIONS = [
  "Mantenimiento",
  "Uso propio",
  "Cierre temporal",
  "Reservado por otro canal",
];

export function BlockForm({
  accommodations,
}: {
  accommodations: AccommodationOption[];
}) {
  const [state, formAction] = useActionState(createBlockAction, IDLE_STATE);

  const today = todayInBogota();
  const [start, setStart] = useState(today);
  const [lastNight, setLastNight] = useState(today);
  const [reason, setReason] = useState("Mantenimiento");

  const nights =
    start && lastNight && lastNight >= start
      ? nightsBetween(start, lastNight) + 1
      : 0;

  if (accommodations.length === 0) {
    return (
      <Banner tone="info">
        Crea primero un alojamiento para poder bloquearle fechas.
      </Banner>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.status !== "idle" && (
        <Banner tone={state.status === "ok" ? "ok" : "error"}>
          {state.message}
        </Banner>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Alojamiento"
          htmlFor="accommodation_id"
          required
          className="sm:col-span-2"
        >
          <Select id="accommodation_id" name="accommodation_id" required>
            {accommodations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Primera noche bloqueada" htmlFor="start" required>
          <Input
            id="start"
            name="start"
            type="date"
            required
            value={start}
            onChange={(event) => {
              const value = event.target.value;
              setStart(value);
              if (value && lastNight < value) setLastNight(value);
            }}
          />
        </Field>

        <Field
          label="Última noche bloqueada"
          htmlFor="last_night"
          required
          hint={
            nights > 0
              ? `${nights} ${nights === 1 ? "noche" : "noches"} bloqueadas. El alojamiento queda libre la mañana siguiente.`
              : "La última noche no puede ser anterior a la primera."
          }
        >
          <Input
            id="last_night"
            name="last_night"
            type="date"
            required
            min={start || undefined}
            value={lastNight}
            onChange={(event) => setLastNight(event.target.value)}
          />
        </Field>

        <Field
          label="Motivo"
          htmlFor="reason"
          hint="Solo para uso interno: no se muestra en el sitio."
          className="sm:col-span-2"
        >
          <Input
            id="reason"
            name="reason"
            maxLength={200}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Motivos frecuentes">
            {REASON_SUGGESTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setReason(item)}
                className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[0.75rem] font-medium text-ink-soft transition-colors hover:bg-black/[0.08]"
              >
                {item}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <SubmitButton pendingLabel="Bloqueando…">Bloquear fechas</SubmitButton>
    </form>
  );
}
