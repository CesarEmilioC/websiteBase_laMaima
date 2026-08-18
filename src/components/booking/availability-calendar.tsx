"use client";

/**
 * Calendario de disponibilidad de dos meses.
 *
 * Se escribió a mano en lugar de traer una librería: el sitio solo necesita
 * rejilla de mes, rango y estados: unas pocas decenas de líneas, cero
 * kilobytes de dependencia y control total sobre el idioma (español de
 * Colombia, semana empezando en lunes) y sobre los tamaños táctiles.
 *
 * Componente de PRESENTACIÓN: no sabe nada de precios, de la API ni de
 * WhatsApp. Recibe el estado y avisa de los toques. La lógica de qué se puede
 * seleccionar vive en `@/lib/availability` (pura y reutilizable).
 */
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { dayState, type CalendarContext } from "@/lib/availability";
import {
  addMonths,
  formatLongDateEs,
  monthGrid,
  monthTitleEs,
  WEEKDAYS_SHORT_ES,
  type YearMonth,
} from "@/lib/dates";

type Props = {
  /** Primer mes visible; el segundo es el siguiente (solo en ≥ sm). */
  cursor: YearMonth;
  context: CalendarContext;
  onSelect: (iso: string) => void;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
};

export function AvailabilityCalendar({
  cursor,
  context,
  onSelect,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
}: Props) {
  const second = addMonths(cursor, 1);

  return (
    <div>
      {/* Navegación ------------------------------------------------------- */}
      <div className="flex items-center gap-2">
        <NavButton
          direction="prev"
          onClick={onPrev}
          disabled={!canGoPrev}
          label="Mes anterior"
        />

        <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 sm:gap-x-6">
          <p className="text-center text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">
            {monthTitleEs(cursor)}
          </p>
          <p className="hidden text-center text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink sm:block">
            {monthTitleEs(second)}
          </p>
        </div>

        <NavButton
          direction="next"
          onClick={onNext}
          disabled={!canGoNext}
          label="Mes siguiente"
        />
      </div>

      {/* Rejillas ---------------------------------------------------------- */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 sm:gap-x-6">
        <Month target={cursor} context={context} onSelect={onSelect} />
        <div className="hidden sm:block">
          <Month target={second} context={context} onSelect={onSelect} />
        </div>
      </div>

      {/* Leyenda ----------------------------------------------------------- */}
      <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] text-ink-muted">
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 rounded-full bg-white ring-1 ring-inset ring-black/15"
          />
          Disponible
        </li>
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 rounded-full bg-cream-200"
          />
          No disponible
        </li>
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 rounded-full bg-forest-600"
          />
          Tus fechas
        </li>
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Piezas internas
 * ------------------------------------------------------------------------- */

function NavButton({
  direction,
  onClick,
  disabled,
  label,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  const Icon = direction === "prev" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-ink transition-[background-color,color,transform] duration-200 ease-ios hover:bg-cream-200 active:scale-[0.94] disabled:cursor-not-allowed disabled:bg-transparent disabled:text-ink-muted/35 disabled:active:scale-100"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Month({
  target,
  context,
  onSelect,
}: {
  target: YearMonth;
  context: CalendarContext;
  onSelect: (iso: string) => void;
}) {
  const cells = monthGrid(target);

  return (
    <div>
      <div
        aria-hidden="true"
        className="mt-3 grid grid-cols-7 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.02em] text-ink-muted"
      >
        {WEEKDAYS_SHORT_ES.map((day) => (
          <span key={day} className="py-2">
            {day}
          </span>
        ))}
      </div>

      {/* Sin `gap`: las celdas contiguas forman la banda continua del rango. */}
      <div className="grid grid-cols-7">
        {cells.map((iso, index) =>
          iso === null ? (
            <span key={`empty-${index}`} aria-hidden="true" />
          ) : (
            <Day
              key={iso}
              iso={iso}
              context={context}
              onSelect={onSelect}
              hasRange={Boolean(context.checkIn && context.checkOut)}
            />
          ),
        )}
      </div>
    </div>
  );
}

function Day({
  iso,
  context,
  onSelect,
  hasRange,
}: {
  iso: string;
  context: CalendarContext;
  onSelect: (iso: string) => void;
  hasRange: boolean;
}) {
  const state = dayState(iso, context);
  const day = Number(iso.slice(8));
  const isEdge = state.role === "start" || state.role === "end";

  // La banda del rango va en la celda (no en el botón) para que no se corte
  // entre día y día; los extremos la redondean hacia fuera.
  let band = "";
  if (state.role === "between") band = "bg-forest-50";
  else if (hasRange && state.role === "start") band = "bg-forest-50 rounded-l-full";
  else if (hasRange && state.role === "end") band = "bg-forest-50 rounded-r-full";

  let tone: string;
  if (isEdge) {
    tone = "bg-forest-600 text-white shadow-pill";
  } else if (state.selectable) {
    tone = `text-ink hover:bg-forest-100 active:scale-[0.94] ${
      state.role === "between" ? "text-forest-700" : ""
    }`;
  } else {
    tone = `cursor-not-allowed text-ink-muted/45 ${
      state.occupied && !state.past ? "line-through decoration-ink-muted/50" : ""
    }`;
  }

  const isToday = iso === context.today;

  return (
    <span className={band}>
      <button
        type="button"
        disabled={!state.selectable}
        onClick={() => onSelect(iso)}
        aria-label={`${formatLongDateEs(iso)}${
          state.selectable ? "" : " — no disponible"
        }`}
        aria-pressed={isEdge}
        className={`relative flex aspect-square w-full items-center justify-center rounded-full text-[0.9375rem] font-medium tabular-nums transition-[background-color,color,transform] duration-200 ease-ios ${tone}`}
      >
        {day}
        {isToday && !isEdge && (
          <span
            aria-hidden="true"
            className="absolute bottom-1.5 h-1 w-1 rounded-full bg-forest-500"
          />
        )}
      </button>
    </span>
  );
}
