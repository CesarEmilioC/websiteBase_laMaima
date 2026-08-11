import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * El middleware solo actúa sobre el panel de administración: el sitio público
 * es estático (ISR) y no debe pagar el costo de leer cookies ni de consultar
 * el servidor de Auth en cada visita.
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
