/**
 * Cómo la página `/reservar` decide qué alojamiento tiene delante.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ESTO ES UN MÓDULO Y NO CUATRO LÍNEAS DENTRO DE LA PÁGINA
 * ---------------------------------------------------------------------------
 * La dirección `/reservar?cabana=<slug>` la escribe cualquiera: la comparte un
 * huésped por WhatsApp, la guarda alguien en favoritos, la rastrea un buscador
 * meses después. Entre ese momento y este, el cliente puede haber ocultado esa
 * cabaña desde el panel — que es EXACTAMENTE lo que acaba de pasar con Casa
 * Uba.
 *
 * La regla, entonces, no es "buscar el slug" sino: un alojamiento oculto NO
 * existe para esta página. No se preselecciona, no aparece en el selector, y
 * pedirlo por dirección no da error ni página en blanco: cae al selector con
 * un aviso. Se distingue "no pidió nada" (el visitante entró por el menú) de
 * "pidió algo que ya no está", porque en el segundo caso hay que explicar por
 * qué no ve lo que esperaba.
 *
 * La lista que llega aquí es SIEMPRE la de alojamientos visibles
 * (`getAccommodations()` filtra por `visible = true`), así que la regla se
 * cumple sola: lo que no está en la lista, no se puede elegir.
 *
 * Es un módulo puro —no toca la base ni Next— y por eso se prueba entero:
 * `select.test.ts`.
 */

/**
 * Nombre del parámetro de la dirección.
 *
 * Va en español y sin tilde, como los slugs y el resto de rutas del sitio
 * (`/alojamientos`, `/reservar`). "cabana" y no "alojamiento" porque es lo que
 * el equipo dice por teléfono y lo que cabe en un enlace corto de WhatsApp.
 */
export const STAY_QUERY_PARAM = "cabana";

/** Los slugs los genera el panel: minúsculas, dígitos y guiones. */
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;

/**
 * Normaliza lo que venga en `searchParams`.
 *
 * Next entrega `string | string[] | undefined`: el arreglo aparece cuando la
 * dirección repite el parámetro (`?cabana=a&cabana=b`), cosa que solo hace
 * quien está trasteando. Se toma el primero y se valida contra el patrón de
 * slug, de modo que nada raro llegue a compararse con la lista.
 *
 * Devuelve `null` tanto si no había parámetro como si lo que había no puede
 * ser un slug: los dos casos terminan en el selector, y la diferencia entre
 * "no pidió nada" y "pidió un disparate" no le importa a nadie.
 */
export function readStayParam(
  value: string | string[] | undefined,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;

  const slug = raw.trim().toLowerCase();
  if (!SLUG_PATTERN.test(slug)) return null;
  return slug;
}

/**
 * Ruta CANÓNICA (en español, sin prefijo de idioma) de la página de reservas,
 * con o sin alojamiento preseleccionado. Quien la use la pasa después por
 * `localePath()`, como cualquier otra dirección del sitio.
 *
 * Existe para que ningún componente vuelva a escribir "?cabana=" a mano: hay
 * ocho botones de "Reservar" repartidos por el sitio y todos tienen que
 * construir la misma dirección.
 */
export function bookingPath(slug?: string | null): string {
  if (!slug) return "/reservar";
  return `/reservar?${STAY_QUERY_PARAM}=${encodeURIComponent(slug)}`;
}

export type StaySelection<T> = {
  /** El alojamiento preseleccionado, o `null` si toca enseñar el selector. */
  stay: T | null;
  /**
   * Se pidió un alojamiento concreto y no está entre los visibles: hay que
   * explicarlo antes del selector. Nunca es `true` cuando `stay` no es nulo.
   */
  unavailable: boolean;
};

/**
 * Resuelve la selección contra la lista de alojamientos VISIBLES.
 *
 * `stays` debe venir ya filtrada (es lo que devuelve `getAccommodations()`).
 * Este módulo no vuelve a comprobar la visibilidad a propósito: duplicar esa
 * regla es la manera de que un día las dos copias dejen de decir lo mismo.
 */
export function selectStay<T extends { slug: string }>(
  stays: T[],
  requested: string | null,
): StaySelection<T> {
  if (!requested) return { stay: null, unavailable: false };

  const stay = stays.find((item) => item.slug === requested) ?? null;
  return { stay, unavailable: stay === null };
}
