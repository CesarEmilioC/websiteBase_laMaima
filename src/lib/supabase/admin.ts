/**
 * Cliente de Supabase con la clave de SERVICIO (service role).
 *
 * ⚠️ Esta clave se salta Row Level Security por completo: puede leer y escribir
 * cualquier fila de cualquier tabla. NUNCA debe llegar al navegador.
 *
 * Dos salvaguardas:
 *   1. `import "server-only"`: si algún día un componente de cliente importa
 *      este archivo, el build FALLA en vez de filtrar la clave.
 *   2. La variable de entorno NO lleva el prefijo `NEXT_PUBLIC_`, así que Next
 *      no la inyecta en el bundle del navegador.
 *
 * Usos previstos (siempre en servidor y devolviendo datos ya filtrados):
 *   - `GET /api/availability/[slug]`: rangos de fechas ocupadas, sin ningún
 *     dato personal de las reservas.
 *   - Fase de pagos: webhook de Wompi y cron de sincronización iCal.
 *
 * Para el contenido público normal (alojamientos, experiencias, textos) se usa
 * el cliente anónimo de `public.ts`, que sí respeta RLS.
 */
import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Valores que el archivo `.env.example` deja como marcador de posición. Se
 * tratan como "sin clave": es mejor un 503 explicable que una llamada a
 * Supabase que falla con un 401 críptico.
 */
const PLACEHOLDERS = ["REEMPLAZAR", "REPLACE_ME", "TODO"];

function readServiceRoleKey(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) return null;
  if (PLACEHOLDERS.some((placeholder) => key.startsWith(placeholder))) {
    return null;
  }
  return key;
}

/** ¿Está configurada la clave de servicio en este entorno? */
export function hasServiceRoleKey(): boolean {
  return readServiceRoleKey() !== null && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/**
 * Crea el cliente de servicio. Lanza si falta configuración: quien llame debe
 * comprobar antes con `hasServiceRoleKey()` y responder con un error propio.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = readServiceRoleKey();

  if (!url || !key) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY (o NEXT_PUBLIC_SUPABASE_URL) en el entorno.",
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
