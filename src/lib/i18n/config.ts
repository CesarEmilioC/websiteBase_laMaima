/**
 * Configuración del sitio bilingüe (español / inglés).
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ EL ESPAÑOL NO LLEVA PREFIJO
 * ---------------------------------------------------------------------------
 * El sitio ya está indexado y enlazado en `https://www.lamaima.com/…` sin
 * prefijo de idioma, y sobre esas direcciones se construyó toda la auditoría de
 * SEO (canónicas, sitemap, redirecciones 301 desde el Wix anterior). Mover el
 * español a `/es/…` obligaría a redirigir el sitio entero y a rehacer ese
 * trabajo, así que el ESPAÑOL VIVE EN LA RAÍZ y el inglés cuelga de `/en`.
 *
 * La consecuencia práctica está en `localePath()`: convertir una ruta canónica
 * (siempre escrita en su forma española, `/alojamientos/casa-maima`) a la del
 * árbol que toca. Ninguna otra parte del código construye direcciones de idioma
 * a mano.
 *
 * Este módulo es PURO y sin dependencias: lo importan por igual el servidor, el
 * navegador y los tests.
 */

export const LOCALES = ["es", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/** Idioma por defecto: el del cliente y el de la raíz del sitio. */
export const DEFAULT_LOCALE: Locale = "es";

/**
 * Cookie que recuerda el idioma elegido en el conmutador de banderas.
 *
 * NO se usa para adivinar el idioma en la primera visita (nada de
 * `Accept-Language`: la decisión del cliente es que quien llega sin más ve el
 * sitio en español). Solo recuerda una elección EXPLÍCITA para que la siguiente
 * visita a la portada respete lo que la persona ya escogió; ver `middleware.ts`.
 */
export const LOCALE_COOKIE = "lamaima_locale";

/** Un año: la elección de idioma no caduca en una sesión. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Valor del atributo `lang` del documento. */
export const HTML_LANG: Record<Locale, string> = {
  es: "es-CO",
  en: "en",
};

/** Valor de `og:locale`. */
export const OG_LOCALE: Record<Locale, string> = {
  es: "es_CO",
  en: "en_US",
};

/**
 * Código de `hreflang`. Se publica `es` (a secas) y no `es-CO` a propósito: la
 * versión española sirve a cualquier hispanohablante, no solo a Colombia, y un
 * `hreflang` regional le diría al buscador que no la muestre en México o
 * España. La región sí se declara en `og:locale` y en `<html lang>`, donde
 * significa "esta variante del español" y no "solo para este país".
 */
export const HREFLANG: Record<Locale, string> = {
  es: "es",
  en: "en",
};

/** Nombre del idioma en su propia lengua, para el conmutador. */
export const LOCALE_NAME: Record<Locale, string> = {
  es: "Español",
  en: "English",
};

/** Prefijo de ruta de cada árbol. El español no tiene. */
const PREFIX: Record<Locale, string> = {
  es: "",
  en: "/en",
};

/**
 * Convierte una ruta canónica —siempre escrita en su forma ESPAÑOLA, con barra
 * inicial y sin barra final— a la ruta del árbol de ese idioma.
 *
 *   localePath("es", "/alojamientos")  -> "/alojamientos"
 *   localePath("en", "/alojamientos")  -> "/en/alojamientos"
 *   localePath("en", "/")              -> "/en"
 *   localePath("en", "/#contacto")     -> "/en#contacto"
 *
 * Las anclas de la portada (`/#contacto`) se tratan aparte porque `/en/#…`
 * dejaría una barra suelta antes de la almohadilla y el navegador la
 * normalizaría a una dirección distinta de la canónica.
 */
export function localePath(locale: Locale, path: string): string {
  const prefix = PREFIX[locale];
  if (!prefix) return path;

  if (path === "/") return prefix;
  if (path.startsWith("/#")) return `${prefix}${path.slice(1)}`;
  return `${prefix}${path}`;
}

/**
 * Operación inversa: separa el prefijo de idioma de una dirección real del
 * navegador y devuelve la ruta canónica (la española) junto con el idioma.
 *
 *   splitLocale("/en/alojamientos") -> { locale: "en", path: "/alojamientos" }
 *   splitLocale("/en")              -> { locale: "en", path: "/" }
 *   splitLocale("/alojamientos")    -> { locale: "es", path: "/alojamientos" }
 *
 * Lo usa el conmutador de idioma para saltar A LA MISMA PÁGINA del otro árbol
 * en vez de mandar siempre a la portada.
 */
export function splitLocale(pathname: string): {
  locale: Locale;
  path: string;
} {
  if (pathname === "/en" || pathname === "/en/") {
    return { locale: "en", path: "/" };
  }
  if (pathname.startsWith("/en/")) {
    return { locale: "en", path: pathname.slice(3) };
  }
  return { locale: "es", path: pathname || "/" };
}

/** El otro idioma. Con dos, es simplemente "el que no es este". */
export function otherLocale(locale: Locale): Locale {
  return locale === "es" ? "en" : "es";
}

/** Comprueba que un valor cualquiera (cookie, parámetro) sea un idioma válido. */
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
