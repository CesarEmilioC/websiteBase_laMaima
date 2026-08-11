/**
 * Refresco de sesión y protección de rutas para el middleware de Next.
 *
 * El middleware corre antes de cada request a `/admin/*`. Aquí:
 *   1. Se crea un cliente de Supabase que lee las cookies del request y
 *      escribe las cookies renovadas en la response (así el token de acceso
 *      se refresca solo y la sesión no se cae a los 60 minutos).
 *   2. Se resuelve el usuario con `getUser()` — que valida el JWT contra el
 *      servidor de Auth, a diferencia de `getSession()`, que se limita a leer
 *      la cookie y por lo tanto no sirve para tomar decisiones de seguridad.
 *   3. Sin sesión -> redirección a /admin/login. Con sesión en /admin/login ->
 *      redirección al panel.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_HOME_PATH = "/admin";

/**
 * Solo se acepta como destino post-login una ruta interna del panel.
 * Evita el "open redirect" (?next=https://sitio-malicioso).
 */
export function safeAdminRedirect(value: string | null | undefined): string {
  if (typeof value !== "string") return ADMIN_HOME_PATH;
  // "//host" y "/\host" son rutas protocol-relative: salen del sitio.
  if (!value.startsWith("/admin") || value.startsWith("//")) {
    return ADMIN_HOME_PATH;
  }
  if (value === ADMIN_LOGIN_PATH || value.startsWith(`${ADMIN_LOGIN_PATH}?`)) {
    return ADMIN_HOME_PATH;
  }
  return value;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isLoginRoute = pathname === ADMIN_LOGIN_PATH;

  if (!user && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = ADMIN_LOGIN_PATH;
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (user && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = ADMIN_HOME_PATH;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
