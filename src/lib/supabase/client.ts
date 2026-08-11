/**
 * Cliente de Supabase para el NAVEGADOR (Client Components).
 *
 * Se usa dentro de componentes marcados con "use client" cuando se necesita
 * leer/escribir datos desde el navegador (por ejemplo, un formulario que
 * consulta disponibilidad en tiempo real).
 *
 * Usa la clave pública "anon", por lo que respeta siempre las políticas de
 * Row Level Security (RLS) definidas en Supabase. NUNCA importar aquí la
 * SUPABASE_SERVICE_ROLE_KEY.
 *
 * Uso:
 *   "use client";
 *   import { createClient } from "@/lib/supabase/client";
 *   const supabase = createClient();
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
