import { formatRange } from "@/lib/dates";
import { formatCOP, formatGuests } from "@/lib/format";
import { dict } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { comparePlans, type RatePlan } from "@/lib/pricing";

/**
 * Franja "Planes especiales" de la ficha del alojamiento.
 *
 * Anuncia los paquetes que el cliente crea en el panel (San Valentín,
 * cumpleaños…) cuando están activos y sus fechas todavía no han pasado. No
 * calcula nada: el precio lo aplica el motor de tarifas en el widget de
 * reservas, y aquí solo se dice qué hay y cuándo.
 *
 * Deliberadamente sobria y sin colores propios: hereda los tokens del sistema
 * de diseño (`brand-*`, `ink*`, radios y sombras), así que sigue la paleta del
 * sitio sin tener que tocarla.
 */
export function SpecialPlans({
  plans,
  locale,
}: {
  plans: RatePlan[];
  locale: Locale;
}) {
  if (plans.length === 0) return null;

  const t = dict(locale);
  // Mismo orden de precedencia que usa el motor: el que cobra va primero.
  const sorted = [...plans].sort(comparePlans);

  return (
    <div className="mt-6 rounded-card bg-brand-600/[0.07] px-4 py-4 ring-1 ring-brand-600/15">
      <p className="text-[0.8125rem] font-semibold text-ink">
        {t.detail.specialPlans}
      </p>

      <ul className="mt-2.5 space-y-3">
        {sorted.map((plan) => (
          <li key={`${plan.name}-${plan.date_from}`}>
            <p className="text-[0.9375rem] font-semibold leading-snug text-ink">
              {plan.name}
            </p>
            <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-muted">
              {formatRange(plan.date_from, plan.date_to, locale)}
              {plan.price_per_night_cop !== null &&
                ` · ${formatCOP(plan.price_per_night_cop)} ${t.detail.planPerNight}`}
              {plan.guests_included !== null &&
                ` · ${formatGuests(plan.guests_included, locale)}`}
            </p>
            {plan.description && (
              <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-muted/85">
                {plan.description}
              </p>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[0.75rem] leading-relaxed text-ink-muted">
        {t.detail.specialPlansNote}
      </p>
    </div>
  );
}
