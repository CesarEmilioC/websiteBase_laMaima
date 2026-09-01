/**
 * Código legible de reserva: "LM-7F3K".
 *
 * Por qué existe teniendo cada fila un UUID: el código lo va a **dictar una
 * persona por WhatsApp o por teléfono**, y un UUID no se dicta. Cuatro
 * caracteres de un alfabeto sin ambigüedades se leen de un vistazo, se copian
 * sin error y caben en el asunto de un correo.
 *
 * EL ALFABETO ES LA DECISIÓN IMPORTANTE. Se excluyen a propósito:
 *
 *   · `0` y `O`, `1` e `I` y `L` — indistinguibles dictados en voz alta y casi
 *     indistinguibles en muchas tipografías.
 *   · Las vocales A, E, U (se conservan solo las que no forman palabras al
 *     combinarse con el resto)… no: se conservan TODAS las consonantes y las
 *     vocales que quedan, y en su lugar se filtra el resultado con
 *     `hasForbiddenWord()`. Un código de cuatro letras puede componer una
 *     palabrota por casualidad y no es algo que se quiera imprimir en un correo.
 *
 * Quedan 31 símbolos y 4 posiciones: 923.521 combinaciones. Con unos pocos
 * miles de reservas al año la probabilidad de choque es despreciable, pero NO
 * es cero — por eso la unicidad la garantiza el índice único de la base de
 * datos y quien inserta reintenta con otro código (ver `createBookingRequest`).
 *
 * Módulo PURO: sin Node, sin Supabase. Se usa en el servidor y en los tests.
 */

/** Prefijo fijo: identifica de un vistazo que el código es de La Maima. */
export const BOOKING_CODE_PREFIX = "LM-";

/** Cuántos caracteres van después del prefijo. */
export const BOOKING_CODE_LENGTH = 4;

/**
 * Alfabeto sin caracteres confundibles: no están el 0 ni la O, ni el 1 ni la I
 * ni la L. Ordenado para que leerlo sea fácil de auditar.
 */
export const BOOKING_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * Combinaciones de cuatro letras que no queremos ver en un correo.
 *
 * Se comprueba por CONTENIDO, no por igualdad: "PUTA" y "XPUT" caen las dos.
 * La lista es corta a propósito —solo lo que de verdad puede aparecer con este
 * alfabeto, que no tiene ni I ni O ni L— y añadir una entrada es trivial.
 */
const FORBIDDEN = ["PUT", "CUL", "SEX", "FUC", "KKK", "ANO", "TET"];

export function hasForbiddenWord(body: string): boolean {
  return FORBIDDEN.some((word) => body.includes(word));
}

/**
 * Genera un código nuevo.
 *
 * `random` se inyecta (por defecto `Math.random`) para que los tests puedan
 * fijar la secuencia y comprobar el mapeo carácter a carácter. No hace falta un
 * generador criptográfico: el código NO es un secreto —viaja en el correo y se
 * dicta por WhatsApp— y no da acceso a nada; solo identifica la solicitud
 * cuando el huésped y el equipo hablan.
 */
export function generateBookingCode(random: () => number = Math.random): string {
  // Se reintenta si sale una combinación de la lista negra. El bucle está
  // acotado para que un `random` degenerado (uno que devuelva siempre 0) no
  // pueda colgar el proceso: a la quinta se acepta lo que salga.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let body = "";
    for (let index = 0; index < BOOKING_CODE_LENGTH; index += 1) {
      const position = Math.floor(random() * BOOKING_CODE_ALPHABET.length);
      // Un `random()` que devuelva exactamente 1 (o algo fuera de [0,1)) daría
      // un índice fuera del alfabeto y un `undefined` en el código.
      const safe = Math.min(Math.max(position, 0), BOOKING_CODE_ALPHABET.length - 1);
      body += BOOKING_CODE_ALPHABET[safe];
    }
    if (!hasForbiddenWord(body)) return `${BOOKING_CODE_PREFIX}${body}`;
  }
  return `${BOOKING_CODE_PREFIX}${BOOKING_CODE_ALPHABET.slice(0, BOOKING_CODE_LENGTH)}`;
}

const CODE_PATTERN = new RegExp(
  `^${BOOKING_CODE_PREFIX}[${BOOKING_CODE_ALPHABET}]{${BOOKING_CODE_LENGTH}}$`,
);

/** ¿El texto tiene la forma de un código de reserva? */
export function isBookingCode(value: unknown): value is string {
  return typeof value === "string" && CODE_PATTERN.test(value);
}

/**
 * Normaliza lo que escribe una persona: mayúsculas, sin espacios y con el
 * prefijo puesto si se lo comió. "lm 7f3k" y "7f3k" -> "LM-7F3K".
 *
 * Hoy lo usa solo el panel al buscar; se deja aquí porque es la contraparte
 * natural de la generación y así las dos reglas viven juntas.
 */
export function normalizeBookingCode(value: string): string {
  const clean = value.trim().toUpperCase().replace(/[\s-]/g, "");
  const body = clean.startsWith("LM") ? clean.slice(2) : clean;
  return `${BOOKING_CODE_PREFIX}${body}`;
}
