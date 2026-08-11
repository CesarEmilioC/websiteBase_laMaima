"use client";

import { useActionState } from "react";

import { signInAction } from "./actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { Banner, Field, Input } from "@/components/admin/ui";
import { IDLE_STATE } from "@/lib/admin/types";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signInAction, IDLE_STATE);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      {state.status === "error" && <Banner tone="error">{state.message}</Banner>}

      <Field label="Correo electrónico" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          autoFocus
          placeholder="admin@lamaima.com"
        />
      </Field>

      <Field label="Contraseña" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </Field>

      <div className="pt-1">
        <SubmitButton pendingLabel="Entrando…" className="w-full">
          Entrar al panel
        </SubmitButton>
      </div>
    </form>
  );
}
