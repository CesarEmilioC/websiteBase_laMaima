"use client";

/**
 * Paso 3: la solicitud quedó registrada.
 *
 * Lo primero y más grande de esta pantalla es el CÓDIGO. No es decoración: es
 * lo único de aquí que la persona va a necesitar dentro de dos días, cuando
 * escriba para preguntar por su reserva. Va en tipografía grande, con espaciado
 * entre letras y seleccionable, para que se lea en voz alta y se copie sin
 * error desde un móvil.
 *
 * Debajo, en este orden: qué pasa ahora (el hold de 48 horas, con su fecha
 * exacta), cómo la contactamos, el resumen de lo pedido y el botón de WhatsApp
 * —cuyo mensaje ya trae el código escrito, que es justo lo que la gente no
 * copia bien—. El aviso de "muy pronto podrás pagar en línea" va al final:
 * explica por qué el flujo termina aquí sin cobrar.
 *
 * NO es una página aparte. Un `/reserva/LM-7F3K` sería enlazable y
 * marcable... y también una dirección adivinable que expone el nombre y las
 * fechas de un huésped a quien pruebe códigos. Mientras no haya cuenta de
 * usuario, la confirmación vive donde se hizo la solicitud, y la copia
 * permanente es el correo.
 */
import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { formatDate, formatTimestamp } from "@/lib/dates";
import { formatCOP, formatGuests } from "@/lib/format";
import { dict } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import type { BookingReceipt } from "@/lib/booking/result";
import { whatsappUrl } from "@/lib/whatsapp";

export function BookingSuccess({
  receipt,
  locale,
  whatsapp,
  onRestart,
}: {
  receipt: BookingReceipt;
  locale: Locale;
  whatsapp: string;
  onRestart: () => void;
}) {
  const t = dict(locale);
  const s = t.booking.success;
  const deadline = formatTimestamp(receipt.expiresAt, locale);

  const href = whatsappUrl(
    s.whatsappMessage(receipt.code, receipt.accommodationName),
    whatsapp,
  );

  return (
    /* `role="status"` y no `alert`: la navegación ya trajo el foco hasta aquí y
       un `alert` interrumpiría la lectura. `status` lo anuncia en cuanto el
       lector termine lo que esté diciendo. */
    <div role="status" className="mx-auto max-w-xl py-2 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white">
        <CheckIcon className="h-7 w-7" />
      </span>

      <p className="mt-5 text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-700">
        {s.eyebrow}
      </p>
      <h3 className="mt-2 text-[1.625rem] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[1.875rem]">
        {s.title}
      </h3>

      {/* El código. */}
      <div className="mt-6 rounded-panel bg-sand-soft px-5 py-5">
        <p className="text-[0.8125rem] font-semibold text-ink-muted">
          {s.codeLabel}
        </p>
        <p className="mt-1.5 select-all text-[2rem] font-bold leading-none tracking-[0.12em] text-ink sm:text-[2.25rem]">
          {receipt.code}
        </p>
      </div>

      <p className="mt-5 text-[0.9375rem] leading-relaxed text-ink-soft">
        {s.hold(deadline)}
      </p>
      <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-soft">
        {s.contact} {s.emailSent(receipt.guestEmail)}
      </p>

      {/* Resumen. */}
      <dl className="mt-6 overflow-hidden rounded-card bg-sand-soft text-left text-[0.9375rem]">
        <Row label={s.accommodation} value={receipt.accommodationName} />
        <Row
          label={t.booking.checkIn}
          value={formatDate(receipt.checkIn, locale)}
          divider
        />
        <Row
          label={t.booking.checkOut}
          value={formatDate(receipt.checkOut, locale)}
          divider
        />
        <Row label={t.booking.nights} value={String(receipt.nights)} divider />
        <Row
          label={t.booking.form.guests}
          value={formatGuests(receipt.guests, locale)}
          divider
        />
        <Row
          label={t.booking.total}
          value={formatCOP(receipt.totalCop)}
          divider
          strong
        />
      </dl>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-4 text-[1rem] font-semibold tracking-[-0.01em] text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-700 active:scale-[0.98]"
      >
        <WhatsAppIcon className="h-5 w-5 shrink-0" />
        {s.whatsapp}
      </a>

      <p className="mt-4 text-[0.8125rem] font-medium text-brand-700">
        {s.onlineSoon}
      </p>

      <button
        type="button"
        onClick={onRestart}
        className="mt-4 rounded-full px-4 py-2 text-[0.875rem] font-semibold text-ink-muted underline-offset-4 transition-colors duration-200 hover:text-brand-700 hover:underline"
      >
        {s.again}
      </button>
    </div>
  );
}

function Row({
  label,
  value,
  divider,
  strong,
}: {
  label: string;
  value: string;
  divider?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-3 ${
        divider ? "border-t border-ink/[0.07]" : ""
      }`}
    >
      <dt className="text-ink-muted">{label}</dt>
      <dd
        className={`text-right font-semibold ${
          strong ? "text-[1.0625rem] text-brand-700" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
