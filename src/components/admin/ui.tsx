/**
 * Piezas de interfaz compartidas del panel.
 *
 * Mismo lenguaje visual que el sitio público (tarjetas muy redondeadas,
 * hairlines de 1px, pastillas, verde bosque como color de acción) pero con
 * densidad de herramienta de trabajo: menos aire, más información por pantalla.
 *
 * Son componentes de servidor por defecto: no llevan estado. Los que sí lo
 * necesitan viven en archivos propios marcados con "use client".
 */
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ---------------------------------------------------------------------------
 * Superficies
 * ------------------------------------------------------------------------- */

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-panel bg-white shadow-card ring-1 ring-black/[0.05] ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-black/[0.07] px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <h2 className="text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`px-5 py-5 sm:px-6 ${className}`}>{children}</div>;
}

/** Encabezado de página del panel. */
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-ink sm:text-[2rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Botones
 * ------------------------------------------------------------------------- */

type ButtonTone = "primary" | "secondary" | "ghost" | "danger";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full text-[0.875rem] font-semibold transition-[background-color,color,box-shadow,transform] duration-200 ease-ios disabled:cursor-not-allowed disabled:opacity-55";

const BUTTON_TONES: Record<ButtonTone, string> = {
  primary:
    "bg-forest-600 text-white shadow-pill hover:bg-forest-700 active:scale-[0.98]",
  secondary:
    "bg-black/[0.05] text-ink hover:bg-black/[0.08] active:scale-[0.98]",
  ghost:
    "bg-transparent text-forest-700 hover:bg-forest-600/10 active:scale-[0.98]",
  danger: "bg-red-600/10 text-red-700 hover:bg-red-600/15 active:scale-[0.98]",
};

const BUTTON_SIZES = {
  sm: "px-3.5 py-1.5 text-[0.8125rem]",
  md: "px-5 py-2.5",
} as const;

export function buttonClass(
  tone: ButtonTone = "primary",
  size: keyof typeof BUTTON_SIZES = "md",
): string {
  return `${BUTTON_BASE} ${BUTTON_TONES[tone]} ${BUTTON_SIZES[size]}`;
}

export function LinkButton({
  href,
  tone = "primary",
  size = "md",
  children,
  className = "",
}: {
  href: string;
  tone?: ButtonTone;
  size?: keyof typeof BUTTON_SIZES;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`${buttonClass(tone, size)} ${className}`}>
      {children}
    </Link>
  );
}

/* ---------------------------------------------------------------------------
 * Campos de formulario
 * ------------------------------------------------------------------------- */

export const INPUT_CLASS =
  "w-full rounded-2xl border-0 bg-black/[0.035] px-4 py-3 text-[0.9375rem] text-ink shadow-none outline-none ring-1 ring-inset ring-black/[0.06] transition-[box-shadow,background-color] duration-200 placeholder:text-ink-muted/70 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-forest-500";

export function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[0.8125rem] font-semibold text-ink"
      >
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
      {children}
      {hint && (
        <p className="mt-1.5 text-[0.75rem] leading-relaxed text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export function Input(props: ComponentProps<"input">) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`${INPUT_CLASS} ${className}`} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`${INPUT_CLASS} min-h-28 leading-relaxed ${className}`}
    />
  );
}

export function Select(props: ComponentProps<"select">) {
  const { className = "", children, ...rest } = props;
  return (
    <select {...rest} className={`${INPUT_CLASS} pr-10 ${className}`}>
      {children}
    </select>
  );
}

/* ---------------------------------------------------------------------------
 * Indicadores
 * ------------------------------------------------------------------------- */

type PillTone = "neutral" | "green" | "amber" | "red" | "blue";

const PILL_TONES: Record<PillTone, string> = {
  neutral: "bg-black/[0.06] text-ink-soft",
  green: "bg-forest-600/12 text-forest-700",
  amber: "bg-amber-500/15 text-amber-700",
  red: "bg-red-600/10 text-red-700",
  blue: "bg-sky-600/12 text-sky-800",
};

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: PillTone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.75rem] font-semibold ${PILL_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card bg-black/[0.02] px-6 py-12 text-center">
      <p className="text-[1rem] font-semibold text-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-[0.875rem] leading-relaxed text-ink-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/** Banner de éxito o error. Acepta saltos de línea en el mensaje. */
export function Banner({
  tone,
  children,
}: {
  tone: "ok" | "error" | "info";
  children: ReactNode;
}) {
  const tones = {
    ok: "bg-forest-600/10 text-forest-800 ring-forest-600/20",
    error: "bg-red-600/8 text-red-800 ring-red-600/20",
    info: "bg-sky-600/8 text-sky-900 ring-sky-600/20",
  } as const;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`whitespace-pre-line rounded-2xl px-4 py-3 text-[0.875rem] font-medium leading-relaxed ring-1 ${tones[tone]}`}
    >
      {children}
    </div>
  );
}

/** Dato suelto del resumen (número grande + etiqueta). */
export function StatTile({
  value,
  label,
  hint,
  href,
}: {
  value: number | string;
  label: string;
  hint?: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-[2rem] font-semibold leading-none tracking-[-0.035em] text-forest-700">
        {value}
      </p>
      <p className="mt-2 text-[0.875rem] font-semibold text-ink">{label}</p>
      {hint && <p className="mt-1 text-[0.75rem] text-ink-muted">{hint}</p>}
    </>
  );

  const className =
    "block rounded-card bg-white px-5 py-5 shadow-card ring-1 ring-black/[0.05] transition-[box-shadow,transform] duration-200 ease-ios";

  if (href) {
    return (
      <Link href={href} className={`${className} hover:-translate-y-0.5 hover:shadow-lift`}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
