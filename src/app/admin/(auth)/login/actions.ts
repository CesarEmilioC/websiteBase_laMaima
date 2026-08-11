"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { safeAdminRedirect } from "@/lib/supabase/middleware";
import { errorState, type ActionState } from "@/lib/admin/types";
import { runAction } from "@/lib/admin/validation";

/**
 * Inicio de sesión con correo y contraseña.
 *
 * `signInWithPassword` en el cliente de servidor escribe las cookies de sesión
 * a través de `cookies()`, así que al terminar la acción el navegador ya viaja
 * autenticado y el middleware deja pasar al panel.
 */
export async function signInAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const next = safeAdminRedirect(String(formData.get("next") ?? ""));

    if (!email || !password) {
      return errorState("Escribe tu correo y tu contraseña.");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // No se distingue entre "no existe" y "contraseña incorrecta": decirlo
      // permitiría averiguar qué correos tienen cuenta.
      if (error.message.toLowerCase().includes("email not confirmed")) {
        return errorState(
          "La cuenta existe pero no está confirmada. Avísale al desarrollador.",
        );
      }
      return errorState("Correo o contraseña incorrectos. Revisa e intenta de nuevo.");
    }

    redirect(next);
  });
}
