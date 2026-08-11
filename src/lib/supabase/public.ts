/**
 * Cliente de Supabase para LECTURA PÚBLICA (sitio público, sin sesión).
 *
 * ¿Por qué existe además de `server.ts`?
 *   `server.ts` usa `cookies()` de next/headers para mantener la sesión de
 *   Supabase Auth. Leer cookies obliga a Next a renderizar la ruta de forma
 *   dinámica en cada request, lo que anula `generateStaticParams` y el ISR
 *   (`export const revalidate`). Las páginas públicas (home, alojamientos,
 *   experiencias) no dependen de ninguna sesión: son las mismas para todo el
 *   mundo y deben servirse estáticas y revalidarse cada cierto tiempo.
 *
 * Por eso aquí se crea un cliente plano, sin cookies, con la clave pública
 * "anon" (respeta RLS: solo ve filas con `visible = true`).
 *
 * Reglas de uso:
 *   - Contenido público cacheable  -> este cliente.
 *   - Algo que dependa del usuario logueado (panel admin) -> `server.ts`.
 *   - Operaciones que deban saltarse RLS (webhooks de pago, cron de iCal)
 *     -> un cliente aparte con SUPABASE_SERVICE_ROLE_KEY, nunca este.
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Etiqueta de caché que llevan TODAS las consultas del sitio público.
 *
 * Next guarda la respuesta de cada consulta en su "Data Cache", separado del
 * HTML ya renderizado. Al publicar un cambio desde el panel no basta con
 * invalidar la página (`revalidatePath`): sin esto, Next volvería a
 * renderizarla reutilizando los datos viejos y el cambio no se vería hasta
 * que expirara la hora de `revalidate`. Con la etiqueta, el panel puede
 * tirar ambas cosas de una vez (`revalidateTag`).
 */
export const PUBLIC_CONTENT_TAG = "lamaima-contenido-publico";

/** Debe coincidir con el `export const revalidate` de las páginas públicas. */
const PUBLIC_REVALIDATE_SECONDS = 3600;

export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        // supabase-js delega en `fetch`; aquí se le añaden las opciones de
        // caché de Next sin tocar nada más de la petición.
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            next: {
              tags: [PUBLIC_CONTENT_TAG],
              revalidate: PUBLIC_REVALIDATE_SECONDS,
            },
          }),
      },
    },
  );
}
