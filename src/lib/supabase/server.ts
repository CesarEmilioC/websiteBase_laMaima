/**
 * Cliente de Supabase para el SERVIDOR (Server Components, Server Actions,
 * Route Handlers).
 *
 * Lee y escribe las cookies de sesión a través de next/headers para que la
 * autenticación de Supabase Auth se mantenga sincronizada entre servidor y
 * navegador (SSR).
 *
 * Usa la clave pública "anon" (respeta RLS). Para operaciones administrativas
 * que deban saltarse RLS (por ejemplo, tareas de cron o webhooks de pago) se
 * debe crear un cliente aparte con SUPABASE_SERVICE_ROLE_KEY, solo en código
 * que corra exclusivamente en el servidor.
 *
 * Uso (dentro de un Server Component o Route Handler):
 *   import { createClient } from "@/lib/supabase/server";
 *   const supabase = await createClient();
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // "setAll" fue llamado desde un Server Component.
            // Se puede ignorar si hay un middleware que refresca la sesión
            // en cada request (se agregará junto con el login del admin).
          }
        },
      },
    },
  );
}
