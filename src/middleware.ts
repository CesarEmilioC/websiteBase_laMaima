import { NextResponse, type NextRequest } from "next/server";

import { LOCALE_COOKIE } from "@/lib/i18n/config";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * El middleware hace exactamente dos cosas, y ninguna toca el resto del sitio
 * público, que es estático (ISR) y no debe pagar el costo de leer cookies ni de
 * consultar el servidor de Auth en cada visita.
 *
 *   1. **Panel de administración**: refresca la sesión de Supabase.
 *
 *   2. **Portada**: si el visitante YA eligió inglés en el conmutador de
 *      banderas, la raíz lo lleva a `/en`.
 *
 * SOBRE EL PUNTO 2. No hay detección por `Accept-Language`: quien llega sin más
 * ve el sitio en español, que es la decisión del cliente y la que mantiene la
 * portada canónica intacta para los buscadores (que no mandan cookies, así que
 * nunca ven este salto). Solo se respeta una elección EXPLÍCITA, y solo en `/`:
 * dentro de cada árbol todos los enlaces ya apuntan a su propio idioma, de modo
 * que no hace falta interceptar ninguna otra ruta. Es la diferencia entre un
 * middleware que corre en una página y uno que corre en todas.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    if (request.cookies.get(LOCALE_COOKIE)?.value === "en") {
      const url = request.nextUrl.clone();
      url.pathname = "/en";
      /* 307 y no 308: la preferencia puede cambiar en cuanto la persona toque
         la otra bandera, así que el salto no debe quedar cacheado como
         permanente en el navegador. */
      return NextResponse.redirect(url, 307);
    }
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/", "/admin", "/admin/:path*"],
};
