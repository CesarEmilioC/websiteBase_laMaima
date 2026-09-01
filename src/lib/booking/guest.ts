/**
 * Validación de los datos del huésped.
 *
 * PURO Y COMPARTIDO. Las mismas funciones corren en el navegador (para pintar
 * el error debajo del campo mientras la persona escribe) y en el servidor
 * (donde son la validación de verdad: el navegador se puede saltar). Escribir
 * la regla dos veces sería garantizar que un día dejen de coincidir.
 *
 * NO DEVUELVE TEXTO, DEVUELVE CLAVES. Un `"email-invalid"` lo traduce el
 * diccionario (`t.booking.form.errors`) al idioma de la página. Si estas
 * funciones devolvieran frases, la validación del servidor tendría que saber
 * en qué idioma navega quien envía —y el diccionario dejaría de ser el único
 * sitio donde vive el texto.
 */

/** Campos del formulario que pueden fallar. */
export type GuestField = "name" | "email" | "phone" | "notes" | "policy";

/** Motivo del fallo. El diccionario lo convierte en frase. */
export type GuestErrorCode =
  | "name-required"
  | "name-too-short"
  | "name-too-long"
  | "email-required"
  | "email-invalid"
  | "email-too-long"
  | "phone-required"
  | "phone-too-short"
  | "phone-too-long"
  | "notes-too-long"
  | "policy-required";

export type GuestErrors = Partial<Record<GuestField, GuestErrorCode>>;

/** Lo que escribe la persona, tal cual. */
export type GuestInput = {
  name: string;
  email: string;
  phone: string;
  notes: string;
  policyAccepted: boolean;
};

/** Lo que se guarda, ya limpio. */
export type GuestDetails = {
  name: string;
  email: string;
  phone: string;
  notes: string | null;
};

export type GuestValidation =
  | { ok: true; value: GuestDetails }
  | { ok: false; errors: GuestErrors };

export const NAME_MAX = 120;
export const EMAIL_MAX = 200;
export const PHONE_MAX = 40;
export const NOTES_MAX = 600;

/**
 * Comprobación de correo deliberadamente laxa: "algo@algo.dominio".
 *
 * Validar direcciones de correo contra la RFC es un pozo sin fondo y siempre
 * termina rechazando a alguien con una dirección legítima. Lo que de verdad
 * verifica que un correo existe es el correo que se le manda; aquí solo se
 * atrapa el error de dedo evidente (el que se olvidó de la arroba).
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Dígitos de un teléfono, ignorando espacios, guiones, paréntesis y el "+".
 * Un móvil colombiano tiene 10 dígitos; con indicativo internacional, 12. Se
 * exigen 7 (el mínimo de un fijo nacional) para no rechazar formatos raros
 * de otros países.
 */
export const PHONE_MIN_DIGITS = 7;

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Valida y normaliza los datos del huésped de una sola pasada. */
export function validateGuest(input: GuestInput): GuestValidation {
  const errors: GuestErrors = {};

  const name = input.name.trim().replace(/\s+/g, " ");
  if (!name) errors.name = "name-required";
  else if (name.length < 2) errors.name = "name-too-short";
  else if (name.length > NAME_MAX) errors.name = "name-too-long";

  const email = input.email.trim();
  if (!email) errors.email = "email-required";
  else if (email.length > EMAIL_MAX) errors.email = "email-too-long";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "email-invalid";

  const phone = input.phone.trim().replace(/\s+/g, " ");
  const digits = phoneDigits(phone);
  if (!phone) errors.phone = "phone-required";
  else if (phone.length > PHONE_MAX) errors.phone = "phone-too-long";
  else if (digits.length < PHONE_MIN_DIGITS) errors.phone = "phone-too-short";

  const notes = input.notes.trim();
  if (notes.length > NOTES_MAX) errors.notes = "notes-too-long";

  if (!input.policyAccepted) errors.policy = "policy-required";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      name,
      // El correo se guarda en minúsculas: es como se compara y como se
      // escribe en la práctica, y evita dos filas "Ana@x.com" / "ana@x.com".
      email: email.toLowerCase(),
      phone,
      notes: notes || null,
    },
  };
}

/**
 * ORDEN DE LOS CAMPOS, y por qué importa.
 *
 * Al enviar con errores, el foco salta al PRIMER campo defectuoso. "Primero"
 * tiene que ser el primero de la pantalla, no el primero que aparezca al
 * recorrer un objeto (ese orden depende de en qué orden se escribieron las
 * claves, que es un detalle de implementación). De ahí esta lista explícita.
 */
export const GUEST_FIELD_ORDER: GuestField[] = [
  "name",
  "email",
  "phone",
  "notes",
  "policy",
];

/** Primer campo con error según el orden de la pantalla, o `null`. */
export function firstErrorField(errors: GuestErrors): GuestField | null {
  return GUEST_FIELD_ORDER.find((field) => errors[field]) ?? null;
}

/* ---------------------------------------------------------------------------
 * Anti-bot
 * ------------------------------------------------------------------------- */

/**
 * Nombre del campo trampa (honeypot).
 *
 * Va oculto y vacío para una persona; los rellenadores automáticos, que leen
 * el HTML y completan todo lo que parezca un campo, lo escriben. Se llama
 * `company` porque un nombre plausible engaña más que un `honeypot`, y los
 * navegadores no lo autocompletan con nada útil en un formulario de reserva.
 *
 * NO se le contesta con un error: una solicitud con el cebo relleno se acepta
 * en apariencia y se descarta en silencio. Decirle al bot "te pillé" solo le
 * enseña a no caer la próxima vez.
 */
export const HONEYPOT_FIELD = "company";

export function looksLikeBot(honeypotValue: unknown): boolean {
  return typeof honeypotValue === "string" && honeypotValue.trim().length > 0;
}
