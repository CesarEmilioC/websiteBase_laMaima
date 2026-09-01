/**
 * Cantidades escritas como las escribiría una persona, derivadas del dato real.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ EXISTE ESTE MÓDULO
 * ---------------------------------------------------------------------------
 * El sitio decía "seis" en catorce sitios distintos —titulares, botones,
 * descripciones de buscador, el pie, el JSON-LD— porque cuando se escribió
 * había seis casas. En el momento en que el cliente oculta una cabaña desde el
 * panel, esos catorce textos empiezan a mentir a la vez y nadie se entera hasta
 * que alguien los cuenta.
 *
 * Aquí viven las cuatro operaciones que hacían falta para que ese número salga
 * SIEMPRE de la base de datos:
 *
 *   · `numberWord()`   — "5" -> "cinco" / "five". Un titular de 48 px con un
 *                        numeral suelto se lee como una tabla; en prosa y en
 *                        display se escribe con letra.
 *   · `listNames()`    — "A, B y C" / "A, B and C", con la "y" -> "e" del
 *                        español delante de palabras que empiezan por i-.
 *   · `listNamesWithin()` — la misma lista recortada a lo que quepa en una
 *                        descripción de buscador, cerrando con "y más".
 *   · `fillCountTokens()` — sustituye `{{alojamientos}}` en el contenido que
 *                        edita el cliente. Ver la nota del final.
 *
 * Es un módulo PURO (solo depende del tipo `Locale`), así que se prueba entero
 * sin base de datos: `counts.test.ts`.
 */
import { DEFAULT_LOCALE, type Locale } from "./i18n/config";

/* ---------------------------------------------------------------------------
 * Números en letra
 * ------------------------------------------------------------------------- */

/**
 * Del cero al doce. Más allá no hace falta: el sitio cuenta casas y
 * experiencias, y a partir de trece un numeral se lee mejor que "diecisiete".
 *
 * El uno va en masculino genérico ("uno"/"one") y en la práctica no se pinta
 * nunca: todas las frases que usan estas palabras tienen su propia rama de
 * singular en el diccionario, justamente porque en español el género del
 * artículo depende del sustantivo ("una casa" pero "un alojamiento") y eso no
 * se puede resolver desde aquí.
 */
const NUMBER_WORDS: Record<Locale, readonly string[]> = {
  es: [
    "cero",
    "uno",
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "seis",
    "siete",
    "ocho",
    "nueve",
    "diez",
    "once",
    "doce",
  ],
  en: [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
  ],
};

/**
 * Número en letra, en minúscula. Fuera del rango cubierto —o si llega algo que
 * no es un entero positivo— devuelve el numeral, que siempre es correcto.
 */
export function numberWord(
  value: number,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (!Number.isInteger(value) || value < 0) return String(value);
  const words = NUMBER_WORDS[locale];
  return value < words.length ? words[value] : String(value);
}

/** Primera letra en mayúscula, para cuando la palabra abre una frase. */
export function capitalize(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/** Atajo de los dos anteriores: `Cinco`, `Five`. */
export function numberWordCapitalized(
  value: number,
  locale: Locale = DEFAULT_LOCALE,
): string {
  return capitalize(numberWord(value, locale));
}

/* ---------------------------------------------------------------------------
 * Listas de nombres
 * ------------------------------------------------------------------------- */

/**
 * En español la conjunción "y" se vuelve "e" delante de una palabra que empieza
 * por el sonido /i/ ("Casa Loma e Iguana"), salvo cuando ese sonido va seguido
 * de vocal y forma diptongo ("y hierba", no "e hierba").
 *
 * Parece un detalle menor, pero estas listas se publican en la descripción que
 * sale en Google y en el pie de las fichas: un "y Iguana" lo nota cualquier
 * hispanohablante, y los nombres de las casas los escribe el cliente en el
 * panel, así que no se pueden dar por conocidos.
 */
function spanishConjunction(next: string): "y" | "e" {
  const word = next.trim().toLowerCase();
  if (/^hie/.test(word)) return "y";
  return /^[ií]|^hi/.test(word) ? "e" : "y";
}

/** "A", "A y B", "A, B y C" · "A", "A and B", "A, B and C". */
export function listNames(
  names: string[],
  locale: Locale = DEFAULT_LOCALE,
): string {
  const clean = names.map((name) => name.trim()).filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];

  const last = clean[clean.length - 1];
  const head = clean.slice(0, -1).join(", ");
  const conjunction = locale === "en" ? "and" : spanishConjunction(last);
  return `${head} ${conjunction} ${last}`;
}

/**
 * La misma lista, recortada a lo que quepa en `limit` caracteres.
 *
 * Cuando no caben todos se sueltan los últimos y se cierra con "y más" / "and
 * more", que es lo que haría una persona: nunca se parte un nombre propio por
 * la mitad ni se deja la lista colgando de una coma. Si ni siquiera un nombre
 * entra, devuelve cadena vacía y quien la llame decide qué poner en su lugar.
 */
export function listNamesWithin(
  names: string[],
  locale: Locale = DEFAULT_LOCALE,
  limit = 120,
): string {
  const clean = names.map((name) => name.trim()).filter(Boolean);
  if (clean.length === 0) return "";

  const more = locale === "en" ? "more" : "más";

  for (let take = clean.length; take > 0; take -= 1) {
    const chunk = clean.slice(0, take);
    const text =
      take === clean.length
        ? listNames(chunk, locale)
        : listNames([...chunk, more], locale);
    if (text.length <= limit) return text;
  }

  return "";
}

/* ---------------------------------------------------------------------------
 * Token de conteo para el contenido editable
 * ------------------------------------------------------------------------- */

/**
 * Token que la administradora puede escribir en los textos del panel para que
 * el sitio ponga ahí el número REAL de alojamientos visibles.
 *
 * POR QUÉ UN TOKEN Y NO TEXTO DINÁMICO A LA FUERZA. La portada ("Seis casas y
 * cabañas en medio de 30 años de bosque…") es contenido del cliente: lo edita
 * en `/admin/contenido` y tiene todo el derecho a redactarlo como quiera. Pero
 * si escribe el número a mano, ese número se queda viejo en cuanto oculta o
 * añade una cabaña, y nadie va a acordarse de repasar tres párrafos.
 *
 * El token resuelve las dos cosas: el texto sigue siendo suyo y el número lo
 * pone el sitio. Es UNO SOLO y devuelve el NUMERAL ("5"), no la palabra, a
 * propósito: una sustitución en letra tendría que resolver mayúscula inicial y
 * concordancia de género según lo que la administradora haya escrito alrededor,
 * y una regla que acierta el 80 % de las veces en un titular es peor que no
 * tenerla.
 *
 * Solo se interpreta en las filas donde está documentado (`home_hero` y
 * `home_about`, ver `getHomeHero()` / `getHomeAbout()` en `content.ts`).
 */
export const STAY_COUNT_TOKEN = "{{alojamientos}}";

/**
 * Sustituye el token por el número. Se hace con `split`/`join` y no con
 * `replace`, que interpretaría `$&` y compañía dentro del valor.
 */
export function fillCountTokens(text: string, stays: number): string {
  if (!text.includes(STAY_COUNT_TOKEN)) return text;
  return text.split(STAY_COUNT_TOKEN).join(String(stays));
}

/**
 * Aplica `fillCountTokens` a todas las cadenas de un valor JSON cualquiera
 * (objeto, arreglo o cadena suelta), conservando la forma.
 *
 * Las filas de `site_content` son jsonb con listas de párrafos y objetos
 * anidados; recorrerlas entero es lo único que garantiza que el token funcione
 * en el mismo sitio donde el cliente lo escriba.
 */
export function fillCountTokensDeep<T>(value: T, stays: number): T {
  if (typeof value === "string") {
    return fillCountTokens(value, stays) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => fillCountTokensDeep(item, stays)) as T;
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = fillCountTokensDeep(item, stays);
    }
    return result as T;
  }
  return value;
}
