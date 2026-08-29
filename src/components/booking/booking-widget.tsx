"use client";

/**
 * Motor de reservas público — fase sin pasarela de pagos.
 *
 * Hace TODO menos cobrar: consulta la disponibilidad real, deja elegir el
 * rango de fechas y el número de huéspedes, cotiza la estadía con las tarifas
 * oficiales y termina en una solicitud por WhatsApp con todos los datos ya
 * escritos.
 *
 * Tres decisiones que conviene no perder de vista:
 *
 *   - NO escribe nada en la base de datos. La reserva la registra el equipo
 *     desde el panel al confirmar, así que no quedan filas huérfanas de gente
 *     que solo estaba mirando. Cuando entre Wompi, el único cambio es que este
 *     último paso cree la reserva y abra el checkout.
 *   - La disponibilidad se pide al montar (no en el HTML estático de la
 *     página): las páginas de alojamiento se sirven prerenderizadas y un
 *     calendario de hace una hora invitaría a pedir fechas ya vendidas.
 *   - Las TARIFAS, en cambio, sí viajan con la página: son catálogo público y
 *     cambian poco. Así el total se recalcula al instante cada vez que el
 *     huésped mueve una fecha o suma una persona, sin ida y vuelta al
 *     servidor. Toda la aritmética vive en `@/lib/pricing`.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import { AvailabilityCalendar } from "@/components/booking/availability-calendar";
import {
  AlertIcon,
  CalendarIcon,
  MinusIcon,
  PlusIcon,
  UsersIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { RateNotes } from "@/components/rate-notes";
import {
  lastCheckOutFor,
  rangeIsFree,
  type AvailabilityResponse,
  type CalendarContext,
} from "@/lib/availability";
import {
  addMonths,
  compareMonths,
  formatDateEs,
  monthOf,
  nightsBetween,
  addDays,
  type YearMonth,
} from "@/lib/dates";
import { formatCOP, formatGuests } from "@/lib/format";
import {
  breakfastLabel,
  lowestRate,
  quote,
  rateNotes,
  type Quote,
  type RateConfig,
} from "@/lib/pricing";
import { bookingRequestMessage, whatsappUrl } from "@/lib/whatsapp";

type Props = {
  slug: string;
  name: string;
  capacity: number;
  /** Tabla de precios, temporadas y festivos: llega con la página estática. */
  rates: RateConfig;
  priceNote: string | null;
  /** Número de WhatsApp (solo dígitos) que edita el panel. */
  whatsapp: string;
  phoneDisplay: string;
  phoneHref: string;
};

type Status = "loading" | "ready" | "error";

export function BookingWidget({
  slug,
  name,
  capacity,
  rates,
  priceNote,
  whatsapp,
  phoneDisplay,
  phoneHref,
}: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null,
  );
  const [cursor, setCursor] = useState<YearMonth | null>(null);

  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [guests, setGuests] = useState(() => Math.min(2, capacity));
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch(`/api/availability/${slug}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as AvailabilityResponse;
      if (!Array.isArray(data.occupied) || !data.from || !data.to) {
        throw new Error("Respuesta inesperada");
      }

      setAvailability(data);
      // El "hoy" que manda el servidor está en hora de Colombia: es el que
      // vale, no el reloj (ni el huso) del dispositivo de quien navega.
      setCursor(monthOf(data.from));
      // Un calendario nuevo puede dejar sin sentido lo ya elegido.
      setCheckIn(null);
      setCheckOut(null);
      setNotice(null);
      setStatus("ready");
    } catch (error) {
      console.error("[reservas] disponibilidad:", error);
      setStatus("error");
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  /* --- Selección de fechas ------------------------------------------------ */

  function handleSelect(iso: string) {
    if (!availability) return;

    // Sin entrada, con el rango ya cerrado, o tocando una fecha anterior:
    // se empieza de nuevo desde esa fecha.
    if (!checkIn || checkOut || iso <= checkIn) {
      setCheckIn(iso);
      setCheckOut(null);
      setNotice(null);
      return;
    }

    // Rango que cruza noches ocupadas: no se acepta como salida. Se explica el
    // porqué (con la salida más tardía posible) y la fecha tocada pasa a ser la
    // nueva entrada, para que nadie se quede atascado repitiendo el mismo toque.
    if (!rangeIsFree(checkIn, iso, availability.occupied)) {
      const limit = lastCheckOutFor(checkIn, availability.occupied, availability.to);
      setNotice(
        `Entre el ${formatDateEs(checkIn)} y el ${formatDateEs(iso)} hay noches ` +
          `ya reservadas: con entrada el ${formatDateEs(checkIn)}, la salida más ` +
          `tardía era el ${formatDateEs(limit)}. Empezamos de nuevo con entrada ` +
          `el ${formatDateEs(iso)}.`,
      );
      setCheckIn(iso);
      setCheckOut(null);
      return;
    }

    setCheckOut(iso);
    setNotice(null);
  }

  function clearDates() {
    setCheckIn(null);
    setCheckOut(null);
    setNotice(null);
  }

  function changeGuests(delta: number) {
    setGuests((current) => {
      const next = current + delta;
      if (next > capacity) {
        setNotice(`${name} admite máximo ${formatGuests(capacity)}.`);
        return current;
      }
      if (next < 1) return current;
      setNotice(null);
      return next;
    });
  }

  /* --- Cálculo ------------------------------------------------------------ */

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;

  // La cotización se rehace cada vez que cambian fechas o huéspedes. Es
  // aritmética pura sobre unas decenas de noches: no hace falta más que el
  // memo para no recalcularla en re-renders ajenos (el hover del calendario).
  const estimate: Quote | null = useMemo(
    () =>
      checkIn && checkOut && nights > 0
        ? quote(rates, checkIn, checkOut, guests)
        : null,
    [rates, checkIn, checkOut, guests, nights],
  );

  const from = lowestRate(rates.tiers, rates.basePriceCop);
  const breakfast = breakfastLabel(rates);
  /* `rates` no cambia en toda la vida del componente (llega del servidor), así
     que las notas se calculan una vez y no en cada pulsación del calendario. */
  const notes = useMemo(() => rateNotes(rates), [rates]);

  // Una estadía por debajo de la estancia mínima no se puede pedir: mejor
  // decirlo aquí que dejar que el equipo tenga que rechazarla por WhatsApp.
  const blockedByMinStay = Boolean(estimate?.minStay);
  const canRequest = Boolean(estimate) && !blockedByMinStay;

  const whatsappHref =
    estimate && canRequest
      ? whatsappUrl(
          bookingRequestMessage({
            accommodation: name,
            checkIn: checkIn as string,
            checkOut: checkOut as string,
            nights,
            guests,
            totalCop: estimate.totalCop,
            detail: [
              ...estimate.lines.map((line) => line.label),
              estimate.breakfast?.label,
            ]
              .filter(Boolean)
              .join(" · "),
          }),
          whatsapp,
        )
      : undefined;

  /* --- Estados de carga --------------------------------------------------- */

  if (status === "error") {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 px-2 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sand-soft text-ink-muted">
            <AlertIcon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[1.0625rem] font-semibold text-ink">
              No pudimos cargar la disponibilidad, intenta de nuevo
            </p>
            <p className="mt-1.5 text-[0.9375rem] text-ink-muted">
              Si el problema sigue, escríbenos por WhatsApp al {phoneDisplay} y
              confirmamos las fechas contigo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full bg-brand-600 px-6 py-3 text-[0.9375rem] font-semibold text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-700 active:scale-[0.98]"
          >
            Reintentar
          </button>
        </div>
      </Shell>
    );
  }

  if (status === "loading" || !availability || !cursor) {
    return (
      <Shell>
        {/* El esqueleto copia la RETÍCULA y las medidas del estado final —dos
            columnas desde `lg`, seis filas de calendario, la misma pila de
            filas del resumen— y no una silueta cualquiera. La disponibilidad
            llega uno o dos segundos después del primer pintado: si el bloque
            creciera al llegar, empujaría hacia abajo media página con el
            visitante ya leyendo (y se contaría como CLS). Así no se mueve
            nada. */}
        <div
          className="grid animate-pulse gap-8 lg:grid-cols-[minmax(0,1fr)_21.5rem] lg:gap-10"
          aria-live="polite"
        >
          <p className="sr-only">Cargando disponibilidad…</p>

          {/* Calendario */}
          <div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 shrink-0 rounded-full bg-sand-soft" />
              <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 sm:gap-x-6">
                <div className="mx-auto h-5 w-28 rounded-full bg-sand" />
                <div className="mx-auto hidden h-5 w-28 rounded-full bg-sand sm:block" />
              </div>
              <div className="h-10 w-10 shrink-0 rounded-full bg-sand-soft" />
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 sm:gap-x-6">
              <MonthSkeleton />
              <div className="hidden sm:block">
                <MonthSkeleton />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full bg-sand" />
                  <span className="h-4 w-20 rounded-full bg-sand" />
                </div>
              ))}
            </div>

            <div className="mt-5 h-5 w-56 rounded-full bg-sand" />
          </div>

          {/* Resumen */}
          <div className="lg:border-l lg:border-ink/[0.07] lg:pl-10">
            <div className="h-4 w-24 rounded-full bg-sand" />
            <div className="mt-2 h-6 w-40 rounded-full bg-sand" />
            <div className="mt-4 h-[9.25rem] rounded-card bg-sand-soft" />
            <div className="mt-4 h-[5.25rem] rounded-card bg-sand-soft" />
            <div className="mt-5 border-t border-ink/[0.07] pt-4">
              <div className="h-5 w-full rounded-full bg-sand" />
              <div className="mt-4 h-8 w-full rounded-full bg-sand" />
              <div className="mt-3 h-6 w-2/3 rounded-full bg-sand" />
            </div>
            <div className="mt-5 h-[3.5rem] w-full rounded-full bg-sand" />
            <div className="mx-auto mt-3 h-4 w-4/5 rounded-full bg-sand" />
            <div className="mx-auto mt-2 h-4 w-3/5 rounded-full bg-sand" />
            <div className="mx-auto mt-3 h-4 w-2/3 rounded-full bg-sand" />
          </div>
        </div>
      </Shell>
    );
  }

  const context: CalendarContext = {
    today: availability.from,
    limit: availability.to,
    occupied: availability.occupied,
    checkIn,
    checkOut,
  };

  const firstMonth = monthOf(availability.from);
  // Se deja de avanzar cuando el segundo panel llegaría al final del horizonte
  // publicado (doce meses), para no mostrar un mes entero deshabilitado.
  const lastMonth = addMonths(monthOf(addDays(availability.to, -1)), -1);

  const hint = !checkIn
    ? "Toca una fecha para la entrada."
    : !checkOut
      ? "Ahora toca la fecha de salida."
      : "Fechas listas. Revisa el resumen y envía la solicitud.";

  return (
    <Shell>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21.5rem] lg:gap-10">
        {/* Calendario ------------------------------------------------------ */}
        <div>
          <AvailabilityCalendar
            cursor={cursor}
            context={context}
            onSelect={handleSelect}
            onPrev={() => setCursor(addMonths(cursor, -1))}
            onNext={() => setCursor(addMonths(cursor, 1))}
            canGoPrev={compareMonths(cursor, firstMonth) > 0}
            canGoNext={compareMonths(cursor, lastMonth) < 0}
          />

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.875rem] text-ink-muted">{hint}</p>
            {checkIn && (
              <button
                type="button"
                onClick={clearDates}
                className="rounded-full bg-sand-soft px-4 py-2 text-[0.8125rem] font-semibold text-ink-soft transition-[background-color,transform] duration-200 ease-ios hover:bg-sand active:scale-[0.97]"
              >
                Borrar fechas
              </button>
            )}
          </div>

          {notice && (
            <p
              role="status"
              className="mt-4 flex items-start gap-2.5 rounded-card bg-amber-50 px-4 py-3 text-[0.875rem] leading-relaxed text-amber-900 ring-1 ring-inset ring-amber-500/20"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {notice}
            </p>
          )}
        </div>

        {/* Resumen --------------------------------------------------------- */}
        <div className="lg:border-l lg:border-ink/[0.07] lg:pl-10">
          <p className="text-[0.8125rem] font-semibold text-ink-muted">
            Tu solicitud
          </p>
          <p className="mt-1 text-[1.125rem] font-semibold tracking-[-0.02em] text-ink">
            {name}
          </p>

          <dl className="mt-4 overflow-hidden rounded-card bg-sand-soft text-[0.9375rem]">
            <SummaryRow
              label="Entrada"
              value={checkIn ? formatDateEs(checkIn) : "Sin elegir"}
              muted={!checkIn}
              icon={<CalendarIcon className="h-4 w-4" />}
            />
            <SummaryRow
              label="Salida"
              value={checkOut ? formatDateEs(checkOut) : "Sin elegir"}
              muted={!checkOut}
              icon={<CalendarIcon className="h-4 w-4" />}
              divider
            />
            <SummaryRow
              label="Noches"
              value={nights > 0 ? String(nights) : "—"}
              muted={nights === 0}
              divider
            />
          </dl>

          {/* Huéspedes: pasos de ±1 en vez de un <select>, mucho más cómodo
              con el pulgar y sin abrir la rueda nativa de iOS. */}
          <div className="mt-4 flex items-center justify-between gap-3 rounded-card bg-sand-soft px-4 py-3">
            <div>
              <p className="flex items-center gap-2 text-[0.9375rem] font-semibold text-ink">
                <UsersIcon className="h-4 w-4 text-ink-muted" />
                Huéspedes
              </p>
              {/* La tarifa depende de cuántos sean, así que el contador no es
                  un detalle administrativo: mover este número cambia el total. */}
              <p className="mt-0.5 text-[0.8125rem] text-ink-muted">
                Máximo {formatGuests(capacity)} · la tarifa cambia con la
                ocupación
              </p>
            </div>
            <div className="flex items-center gap-1">
              <StepperButton
                onClick={() => changeGuests(-1)}
                disabled={guests <= 1}
                label="Quitar un huésped"
              >
                <MinusIcon className="h-4 w-4" />
              </StepperButton>
              <span
                aria-live="polite"
                className="w-8 text-center text-[1.0625rem] font-semibold tabular-nums text-ink"
              >
                {guests}
              </span>
              <StepperButton
                onClick={() => changeGuests(1)}
                disabled={guests >= capacity}
                label="Añadir un huésped"
              >
                <PlusIcon className="h-4 w-4" />
              </StepperButton>
            </div>
          </div>

          {/* Precio ---------------------------------------------------------- */}
          {/* El precio depende de la ocupación Y del tipo de cada noche, así que
              el desglose no es decorativo: es la única forma de que el huésped
              entienda por qué dos noches del mismo alojamiento valen distinto. */}
          <div className="mt-5 border-t border-ink/[0.07] pt-4 text-[0.9375rem]">
            {estimate ? (
              <>
                {estimate.planNames.length > 0 && (
                  <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-600/10 px-3 py-1 text-[0.75rem] font-semibold text-brand-700">
                    {estimate.planNames.join(" · ")}
                  </p>
                )}

                <ul className="space-y-2.5">
                  {estimate.lines.map((line) => (
                    <li key={`${line.unitCop}-${line.dayType}-${line.discountPct}-${line.planName ?? ""}`}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-ink-muted">{line.label}</span>
                        <span className="shrink-0 tabular-nums text-ink-soft">
                          {formatCOP(line.subtotalCop)}
                        </span>
                      </div>
                      {line.detail && (
                        <p className="mt-0.5 text-[0.8125rem] leading-snug text-ink-muted/80">
                          {line.detail}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-ink/[0.07] pt-3">
                  <span className="font-semibold text-ink">Total estimado</span>
                  <span className="text-[1.375rem] font-semibold tracking-[-0.03em] tabular-nums text-brand-700">
                    {formatCOP(estimate.totalCop)}
                  </span>
                </div>

                {estimate.nights > 1 && (
                  <p className="mt-1 text-right text-[0.8125rem] text-ink-muted">
                    {formatCOP(estimate.averageNightCop)} por noche en promedio
                  </p>
                )}
              </>
            ) : (
              /* Sin fechas se muestra la tarifa más baja, no una multiplicación
                 por cero: un "× 0 noches = $0" parece un error de la página. */
              <>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-ink-muted">
                    Desde
                    {from.guests
                      ? ` · ${formatGuests(from.guests)}`
                      : ""}
                  </span>
                  <span className="tabular-nums text-ink-soft">
                    {formatCOP(from.amountCop)}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-ink/[0.07] pt-3">
                  <span className="font-semibold text-ink">Total estimado</span>
                  <span className="text-[1.375rem] font-semibold tracking-[-0.03em] tabular-nums text-brand-700">
                    —
                  </span>
                </div>
              </>
            )}

            {/* Desayuno: incluido o con su valor por persona, nunca en silencio. */}
            {breakfast && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-600/10 px-3 py-1 text-[0.75rem] font-semibold text-brand-700">
                {breakfast}
              </p>
            )}

            {estimate?.breakfast?.optionalTotalCop ? (
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-muted">
                El desayuno de {formatGuests(guests)} durante {estimate.nights}{" "}
                {estimate.nights === 1 ? "noche" : "noches"} sumaría{" "}
                {formatCOP(estimate.breakfast.optionalTotalCop)}. No está
                incluido en el total.
              </p>
            ) : null}

            {priceNote && !estimate && (
              <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-ink-muted">
                {priceNote}
              </p>
            )}

            {/* Condiciones de la tarifa en puntos, el mismo criterio que en el
                panel de la ficha (antes aquí iba el párrafo corrido de
                `rate_note`). Se quitan las dos que este bloque ya cuenta por su
                cuenta: el desayuno, que va arriba como pastilla, y la estancia
                mínima, que el widget valida contra las fechas elegidas y avisa
                en su propio aviso ámbar. */}
            <RateNotes
              notes={notes.filter(
                (note) => note.kind !== "breakfast" && note.kind !== "min-stay",
              )}
              className="mt-4 border-t border-ink/[0.07] pt-4"
            />
          </div>

          {/* Estancia mínima: bloquea la solicitud y explica por qué. -------- */}
          {estimate?.minStay && (
            <p
              role="status"
              className="mt-4 flex items-start gap-2.5 rounded-card bg-amber-50 px-4 py-3 text-[0.875rem] leading-relaxed text-amber-900 ring-1 ring-inset ring-amber-500/20"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {estimate.minStay.message} Elegiste {estimate.nights}{" "}
                {estimate.nights === 1 ? "noche" : "noches"}: añade{" "}
                {estimate.minStay.requiredNights - estimate.nights} más para
                poder reservar.
              </span>
            </p>
          )}

          {/* Llamada a la acción --------------------------------------------- */}
          {canRequest && whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-4 text-center text-[0.9375rem] font-semibold tracking-[-0.01em] text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-700 active:scale-[0.98]"
            >
              <WhatsAppIcon className="h-5 w-5 shrink-0" />
              Solicitar reserva por WhatsApp
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-sand px-4 py-4 text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink-muted"
            >
              <WhatsAppIcon className="h-5 w-5 shrink-0" />
              Solicitar reserva por WhatsApp
            </button>
          )}

          <p className="mt-3 text-center text-[0.8125rem] leading-relaxed text-ink-muted">
            {canRequest
              ? "Te confirmamos disponibilidad y forma de pago por WhatsApp."
              : blockedByMinStay
                ? "Ajusta las fechas para cumplir la estancia mínima."
                : "Elige las fechas para enviar tu solicitud."}
          </p>
          <p className="mt-2 text-center text-[0.8125rem] font-medium text-brand-700">
            Muy pronto podrás pagar en línea aquí mismo.
          </p>
          <p className="mt-3 text-center text-[0.8125rem] text-ink-muted">
            ¿Prefieres hablar?{" "}
            <a
              href={phoneHref}
              className="font-semibold text-brand-700 underline-offset-4 transition-colors duration-200 hover:underline"
            >
              {phoneDisplay}
            </a>
          </p>
        </div>
      </div>
    </Shell>
  );
}

/* ---------------------------------------------------------------------------
 * Piezas internas
 * ------------------------------------------------------------------------- */

/**
 * Rejilla de un mes en el esqueleto: mismas seis filas de celdas cuadradas
 * que `AvailabilityCalendar`, para que el alto coincida al píxel.
 */
function MonthSkeleton() {
  return (
    <div>
      <div className="mt-3 grid grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <span
            key={index}
            className="py-2 text-center text-[0.6875rem] leading-[1.25]"
          >
            &nbsp;
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 42 }).map((_, index) => (
          <span
            key={index}
            className="flex aspect-square w-full items-center justify-center"
          >
            <span className="h-[62%] w-[62%] rounded-full bg-sand-soft" />
          </span>
        ))}
      </div>
    </div>
  );
}

/** Tarjeta blanca del widget: la misma caja en todos los estados. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-panel bg-white p-5 shadow-panel ring-1 ring-ink/[0.05] sm:p-7">
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  muted,
  icon,
  divider,
}: {
  label: string;
  value: string;
  muted: boolean;
  icon?: React.ReactNode;
  divider?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-3 ${
        divider ? "border-t border-ink/[0.07]" : ""
      }`}
    >
      <dt className="flex items-center gap-2 text-ink-muted">
        {icon}
        {label}
      </dt>
      {/* El estado "Sin elegir" va en `text-ink-muted` a plena opacidad: al
          70 % sobre el arena de la fila daba 2,7:1 de contraste y la auditoría
          de accesibilidad lo marcaba. A plena opacidad son 4,6:1 y sigue
          leyéndose como el valor apagado que es. */}
      <dd
        className={`font-semibold ${muted ? "text-ink-muted" : "text-ink"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function StepperButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-card transition-[background-color,color,transform] duration-200 ease-ios hover:bg-brand-50 active:scale-[0.94] disabled:cursor-not-allowed disabled:bg-white/60 disabled:text-ink-muted/35 disabled:shadow-none disabled:active:scale-100"
    >
      {children}
    </button>
  );
}
