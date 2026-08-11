import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ADMIN_LOGIN_PATH } from "@/lib/supabase/middleware";

/**
 * Puerta de entrada de todo el panel.
 *
 * El middleware ya redirige a quien no tenga sesión, pero cada página y cada
 * Server Action vuelve a comprobarlo aquí: el middleware es una conveniencia
 * de navegación, no una frontera de seguridad (una Server Action puede
 * invocarse por POST directo). Además devuelve el cliente de Supabase ya
 * ligado a las cookies de la sesión, de modo que todas las consultas del panel
 * viajan con el JWT del usuario y las hace cumplir RLS.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(ADMIN_LOGIN_PATH);
  }

  return { supabase, user };
}
