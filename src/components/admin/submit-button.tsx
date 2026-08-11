"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

import { buttonClass } from "./ui";

type Tone = "primary" | "secondary" | "ghost" | "danger";

/**
 * Botón de envío que se deshabilita y cambia de texto mientras la Server
 * Action está en vuelo. `useFormStatus` lee el estado del <form> padre, así
 * que este componente debe ser hijo del formulario (no el formulario mismo).
 */
export function SubmitButton({
  children,
  pendingLabel = "Guardando…",
  tone = "primary",
  size = "md",
  className = "",
  /** Texto de confirmación previa. Si el usuario cancela, no se envía. */
  confirm,
  name,
  value,
}: {
  children: ReactNode;
  pendingLabel?: string;
  tone?: Tone;
  size?: "sm" | "md";
  className?: string;
  confirm?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) {
          event.preventDefault();
        }
      }}
      className={`${buttonClass(tone, size)} ${className}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
