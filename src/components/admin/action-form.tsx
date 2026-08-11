"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";

import { Banner } from "./ui";
import { SubmitButton } from "./submit-button";
import { IDLE_STATE, type ActionState } from "@/lib/admin/types";

type Props = {
  /** Server Action con la firma (estadoPrevio, FormData) => ActionState. */
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  confirm?: string;
  /** Contenido extra a la izquierda de la barra de botones (p. ej. "Cancelar"). */
  secondary?: ReactNode;
  className?: string;
};

/**
 * Formulario genérico para las acciones simples del panel: muestra el banner de
 * éxito/error que devuelve la acción y bloquea el botón mientras guarda.
 *
 * Los formularios grandes (alojamientos, experiencias, reservas) no usan este
 * envoltorio porque necesitan estado propio en el cliente; aun así siguen el
 * mismo patrón de `useActionState`.
 */
export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel,
  confirm,
  secondary,
  className = "",
}: Props) {
  const [state, formAction] = useActionState(action, IDLE_STATE);

  return (
    <form action={formAction} className={className}>
      {state.status !== "idle" && (
        <div className="mb-5">
          <Banner tone={state.status === "ok" ? "ok" : "error"}>
            {state.message}
          </Banner>
        </div>
      )}

      {children}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel={pendingLabel} confirm={confirm}>
          {submitLabel}
        </SubmitButton>
        {secondary}
      </div>
    </form>
  );
}
