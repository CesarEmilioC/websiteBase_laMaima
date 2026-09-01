"use client";

/**
 * Paso 2 del motor de reservas: los datos del huésped.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ESTE PASO SUSTITUYE AL PANEL Y NO SE ABRE ENCIMA
 * ---------------------------------------------------------------------------
 * La alternativa evidente era un modal. Se descartó por tres motivos, todos
 * medidos en el móvil de 390 px, que es donde ocurre la mayoría de las
 * reservas:
 *
 *   · Un modal sobre un calendario de dos meses obliga a atrapar el foco y a
 *     bloquear el scroll del fondo. En un formulario con teclado virtual eso
 *     pelea con el navegador: iOS desplaza la página para enseñar el campo
 *     activo y un fondo bloqueado lo impide.
 *   · El calendario ya no aporta nada en este paso —las fechas están
 *     elegidas— pero seguiría ocupando pantalla detrás del velo.
 *   · Con el panel sustituido, el botón "Cambiar fechas" es un camino de
 *     vuelta explícito, y no un aspa que la gente confunde con "cancelar
 *     todo".
 *
 * Así que el paso REEMPLAZA el contenido de la tarjeta, conservando la misma
 * caja blanca y la misma retícula de dos columnas: el resumen se queda donde
 * estaba (a la derecha en escritorio, arriba en móvil) y los campos ocupan el
 * sitio del calendario. Visualmente es un deslizamiento dentro de la misma
 * isla, no una pantalla nueva.
 *
 * VALIDACIÓN. Se valida en el navegador con las MISMAS funciones puras que
 * usa el servidor (`@/lib/booking/guest`), no con las reglas de HTML: los
 * mensajes nativos del navegador salen en el idioma del sistema operativo, y
 * en un sitio bilingüe eso significa ver un "Please fill out this field" en
 * medio de una página en español. De ahí el `noValidate`.
 */
import { useId, useRef, useState, useTransition } from "react";

import { AlertIcon, CheckIcon, ChevronLeftIcon, UsersIcon } from "@/components/icons";
import { createBookingRequest } from "@/lib/booking/actions";
import {
  HONEYPOT_FIELD,
  firstErrorField,
  validateGuest,
  type GuestErrors,
  type GuestField,
} from "@/lib/booking/guest";
import type {
  BookingFailure,
  BookingQuote,
  BookingReceipt,
} from "@/lib/booking/result";
import { formatDate } from "@/lib/dates";
import { formatCOP, formatGuests } from "@/lib/format";
import { dict } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";

type Props = {
  slug: string;
  locale: Locale;
  /** Cotización YA verificada por el servidor (fechas, precio y disponibilidad). */
  quote: BookingQuote;
  onBack: () => void;
  onSuccess: (receipt: BookingReceipt) => void;
  /** Se llama cuando el servidor dice que las fechas se ocuparon: hay que
   *  recargar el calendario y volver al paso 1. */
  onDatesTaken: (message: string) => void;
};

export function GuestForm({
  slug,
  locale,
  quote,
  onBack,
  onSuccess,
  onDatesTaken,
}: Props) {
  const t = dict(locale);
  const f = t.booking.form;

  const [errors, setErrors] = useState<GuestErrors>({});
  const [failure, setFailure] = useState<{
    kind: BookingFailure;
    detail?: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const formRef = useRef<HTMLFormElement>(null);
  const baseId = useId();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const data = new FormData(event.currentTarget);
    const input = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      notes: String(data.get("notes") ?? ""),
      policyAccepted: data.get("policy") === "on",
    };

    const check = validateGuest(input);
    if (!check.ok) {
      setErrors(check.errors);
      setFailure(null);
      focusFirstError(check.errors);
      return;
    }

    setErrors({});
    setFailure(null);

    startTransition(async () => {
      const result = await createBookingRequest({
        slug,
        checkIn: quote.checkIn,
        checkOut: quote.checkOut,
        guests: quote.guests,
        locale,
        ...input,
        company: String(data.get(HONEYPOT_FIELD) ?? ""),
      });

      if (result.ok) {
        onSuccess(result.receipt);
        return;
      }

      if (result.kind === "fields") {
        setErrors(result.errors);
        focusFirstError(result.errors);
        return;
      }

      // Que las fechas se ocupen mientras se rellena el formulario es EL caso
      // que este flujo tiene que resolver bien: se vuelve al calendario, que
      // se recarga con la disponibilidad de verdad, en vez de dejar a la
      // persona reintentando un envío que nunca va a funcionar.
      if (result.failure === "dates-taken") {
        onDatesTaken(f.failures["dates-taken"]);
        return;
      }

      setFailure({ kind: result.failure, detail: result.detail });
    });
  }

  /** Lleva el foco al primer campo defectuoso, en el orden de la pantalla. */
  function focusFirstError(current: GuestErrors) {
    const field = firstErrorField(current);
    if (!field) return;
    const element = formRef.current?.elements.namedItem(field);
    if (element instanceof HTMLElement) element.focus();
  }

  const fieldId = (field: GuestField) => `${baseId}-${field}`;
  const errorId = (field: GuestField) => `${baseId}-${field}-error`;
  const hintId = (field: GuestField) => `${baseId}-${field}-hint`;

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21.5rem] lg:gap-10">
      {/* Resumen ---------------------------------------------------------- */}
      {/* Va primero en el DOM para que en móvil se lea ANTES de los campos
          (qué estás pidiendo, y cuánto), y se manda a la derecha en escritorio
          con `lg:order-last` para no mover el resumen de sitio respecto al
          paso anterior. */}
      <aside className="lg:order-last lg:border-l lg:border-ink/[0.07] lg:pl-10">
        <p className="text-[0.8125rem] font-semibold text-ink-muted">
          {f.recapTitle}
        </p>
        <p className="mt-1 text-[1.125rem] font-semibold tracking-[-0.02em] text-ink">
          {quote.accommodationName}
        </p>

        <dl className="mt-4 overflow-hidden rounded-card bg-sand-soft text-[0.9375rem]">
          <RecapRow
            label={t.booking.checkIn}
            value={formatDate(quote.checkIn, locale)}
          />
          <RecapRow
            label={t.booking.checkOut}
            value={formatDate(quote.checkOut, locale)}
            divider
          />
          <RecapRow
            label={t.booking.nights}
            value={String(quote.nights)}
            divider
          />
          <RecapRow
            label={f.guests}
            value={formatGuests(quote.guests, locale)}
            divider
          />
        </dl>

        <ul className="mt-4 space-y-2 text-[0.875rem]">
          {quote.lines.map((line) => (
            <li key={line.key}>
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
          <span className="font-semibold text-ink">{t.booking.total}</span>
          <span className="text-[1.375rem] font-semibold tracking-[-0.03em] tabular-nums text-brand-700">
            {formatCOP(quote.totalCop)}
          </span>
        </div>

        {quote.breakfast && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-600/10 px-3 py-1 text-[0.75rem] font-semibold text-brand-700">
            {quote.breakfast}
          </p>
        )}
      </aside>

      {/* Formulario -------------------------------------------------------- */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-700">
              {f.eyebrow}
            </p>
            <h3 className="mt-1 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink">
              {f.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-full bg-sand-soft px-4 py-2 text-[0.8125rem] font-semibold text-ink-soft transition-[background-color,transform] duration-200 ease-ios hover:bg-sand active:scale-[0.97]"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
            {f.back}
          </button>
        </div>

        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">
          {f.lead}
        </p>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 space-y-5"
        >
          {/* Resumen de errores: lo anuncia el lector de pantalla en cuanto
              aparece, sin que haya que ir campo por campo a buscarlo. */}
          {(hasErrors || failure) && (
            <p
              role="alert"
              className="flex items-start gap-2.5 rounded-card bg-amber-50 px-4 py-3 text-[0.875rem] leading-relaxed text-amber-900 ring-1 ring-inset ring-amber-500/20"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {failure
                  ? `${f.failures[failure.kind]}${failure.detail ? ` ${failure.detail}` : ""}`
                  : f.errorSummary}
              </span>
            </p>
          )}

          <TextField
            id={fieldId("name")}
            name="name"
            label={f.name}
            placeholder={f.namePlaceholder}
            autoComplete="name"
            required
            requiredLabel={f.required}
            error={errors.name ? f.errors[errors.name] : null}
            errorId={errorId("name")}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id={fieldId("email")}
              name="email"
              type="email"
              inputMode="email"
              label={f.email}
              hint={f.emailHint}
              hintId={hintId("email")}
              autoComplete="email"
              required
              requiredLabel={f.required}
              error={errors.email ? f.errors[errors.email] : null}
              errorId={errorId("email")}
            />
            <TextField
              id={fieldId("phone")}
              name="phone"
              type="tel"
              inputMode="tel"
              label={f.phone}
              hint={f.phoneHint}
              hintId={hintId("phone")}
              autoComplete="tel"
              required
              requiredLabel={f.required}
              error={errors.phone ? f.errors[errors.phone] : null}
              errorId={errorId("phone")}
            />
          </div>

          {/* Huéspedes: ya elegidos en el paso anterior. Se enseñan para que
              nadie tenga que volver atrás a comprobarlo, y no se pueden
              cambiar aquí porque cambiarían el precio ya cotizado. */}
          <div className="flex items-center justify-between gap-4 rounded-card bg-sand-soft px-4 py-3">
            <p className="flex items-center gap-2 text-[0.9375rem] font-semibold text-ink">
              <UsersIcon className="h-4 w-4 text-ink-muted" />
              {f.guests}
            </p>
            <p className="text-[0.9375rem] font-semibold text-ink">
              {formatGuests(quote.guests, locale)}
            </p>
          </div>

          <div>
            <label
              htmlFor={fieldId("notes")}
              className="mb-1.5 block text-[0.875rem] font-semibold text-ink"
            >
              {f.notes}{" "}
              <span className="font-normal text-ink-muted">
                ({f.notesOptional})
              </span>
            </label>
            <textarea
              id={fieldId("notes")}
              name="notes"
              rows={3}
              maxLength={600}
              placeholder={f.notesPlaceholder}
              aria-invalid={errors.notes ? true : undefined}
              aria-describedby={errors.notes ? errorId("notes") : undefined}
              className={`w-full rounded-card border bg-white px-4 py-3 text-[0.9375rem] leading-relaxed text-ink transition-[border-color,box-shadow] duration-200 placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-600/35 ${
                errors.notes
                  ? "border-red-500/60"
                  : "border-ink/[0.12] focus:border-brand-600"
              }`}
            />
            {errors.notes && (
              <FieldError id={errorId("notes")}>
                {f.errors[errors.notes]}
              </FieldError>
            )}
          </div>

          {/* Casilla de la política. Es un requisito legal y por eso bloquea
              el envío, pero el enlace se abre en pestaña nueva: mandar a leer
              la política vaciando un formulario a medio rellenar es la mejor
              forma de perder la reserva. */}
          <div>
            <label
              htmlFor={fieldId("policy")}
              className="flex cursor-pointer items-start gap-3 text-[0.9375rem] leading-relaxed text-ink-soft"
            >
              <input
                id={fieldId("policy")}
                name="policy"
                type="checkbox"
                aria-invalid={errors.policy ? true : undefined}
                aria-describedby={errors.policy ? errorId("policy") : undefined}
                className={`mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-md border accent-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/35 ${
                  errors.policy ? "border-red-500/60" : "border-ink/25"
                }`}
              />
              <span>
                {f.policyBefore}{" "}
                <a
                  href={localePath(locale, "/legal/cancelacion")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-700 underline underline-offset-4"
                >
                  {f.policyLink}
                </a>
                {f.policyAfter}.
              </span>
            </label>
            {errors.policy && (
              <FieldError id={errorId("policy")}>
                {f.errors[errors.policy]}
              </FieldError>
            )}
          </div>

          {/* Campo trampa. Fuera de la pantalla (no `display:none`, que algunos
              rellenadores saltan a propósito), fuera del orden de tabulación y
              fuera del árbol de accesibilidad. Ver `HONEYPOT_FIELD`. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
          >
            <label htmlFor={`${baseId}-${HONEYPOT_FIELD}`}>{f.honeypot}</label>
            <input
              id={`${baseId}-${HONEYPOT_FIELD}`}
              type="text"
              name={HONEYPOT_FIELD}
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-4 text-[1rem] font-semibold tracking-[-0.01em] text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-brand-600/55 disabled:active:scale-100"
          >
            {pending ? (
              f.submitting
            ) : (
              <>
                <CheckIcon className="h-[1.05rem] w-[1.05rem]" />
                {f.submit}
              </>
            )}
          </button>

          <p className="text-center text-[0.8125rem] font-medium text-brand-700">
            {t.booking.onlineSoon}
          </p>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Piezas internas
 * ------------------------------------------------------------------------- */

function RecapRow({
  label,
  value,
  divider,
}: {
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-3 ${
        divider ? "border-t border-ink/[0.07]" : ""
      }`}
    >
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 text-[0.8125rem] font-medium text-red-700"
    >
      {children}
    </p>
  );
}

type TextFieldProps = {
  id: string;
  name: string;
  label: string;
  type?: string;
  inputMode?: "email" | "tel" | "text";
  placeholder?: string;
  hint?: string;
  hintId?: string;
  autoComplete?: string;
  required?: boolean;
  requiredLabel: string;
  error: string | null;
  errorId: string;
};

function TextField({
  id,
  name,
  label,
  type = "text",
  inputMode,
  placeholder,
  hint,
  hintId,
  autoComplete,
  required,
  requiredLabel,
  error,
  errorId,
}: TextFieldProps) {
  // `aria-describedby` apunta al error CUANDO lo hay y a la ayuda cuando no:
  // encadenar los dos hace que el lector lea la pista antes del problema.
  const describedBy = error ? errorId : hint && hintId ? hintId : undefined;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[0.875rem] font-semibold text-ink"
      >
        {label}
        {required && (
          <span className="ml-1 font-normal text-ink-muted">
            <span aria-hidden="true">*</span>
            <span className="sr-only"> ({requiredLabel})</span>
          </span>
        )}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-card border bg-white px-4 py-3 text-[0.9375rem] text-ink transition-[border-color,box-shadow] duration-200 placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-600/35 ${
          error ? "border-red-500/60" : "border-ink/[0.12] focus:border-brand-600"
        }`}
      />
      {error ? (
        <FieldError id={errorId}>{error}</FieldError>
      ) : hint && hintId ? (
        <p id={hintId} className="mt-1.5 text-[0.8125rem] text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
