/**
 * Lectura y validación de `FormData` en las Server Actions del panel.
 *
 * Filosofía: un `ValidationError` con mensaje en español por cada campo mal
 * diligenciado. Las acciones envuelven su cuerpo en `runAction()`, que
 * convierte esa excepción en el `ActionState` que consume la interfaz, así
 * ninguna validación termina en una pantalla de error de Next.
 */
import { errorState, type ActionState } from "./types";
import { isIsoDate } from "./dates";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Texto obligatorio. */
export function requiredText(
  form: FormData,
  field: string,
  label: string,
  maxLength = 300,
): string {
  const value = String(form.get(field) ?? "").trim();
  if (!value) throw new ValidationError(`El campo "${label}" es obligatorio.`);
  if (value.length > maxLength) {
    throw new ValidationError(
      `El campo "${label}" no puede superar ${maxLength} caracteres.`,
    );
  }
  return value;
}

/** Texto opcional: cadena vacía se guarda como NULL. */
export function optionalText(
  form: FormData,
  field: string,
  maxLength = 5000,
): string | null {
  const value = String(form.get(field) ?? "").trim();
  if (!value) return null;
  return value.slice(0, maxLength);
}

/** Entero obligatorio dentro de un rango. */
export function requiredInt(
  form: FormData,
  field: string,
  label: string,
  { min = 0, max = 2_000_000_000 }: { min?: number; max?: number } = {},
): number {
  const raw = String(form.get(field) ?? "").trim();
  if (!raw) throw new ValidationError(`El campo "${label}" es obligatorio.`);
  const value = Number(raw.replace(/[.\s$]/g, ""));
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new ValidationError(`El campo "${label}" debe ser un número entero.`);
  }
  if (value < min || value > max) {
    throw new ValidationError(
      `El campo "${label}" debe estar entre ${min} y ${max}.`,
    );
  }
  return value;
}

/** Entero opcional (vacío -> null). */
export function optionalInt(
  form: FormData,
  field: string,
  label: string,
  { min = 0, max = 2_000_000_000 }: { min?: number; max?: number } = {},
): number | null {
  const raw = String(form.get(field) ?? "").trim();
  if (!raw) return null;
  return requiredInt(form, field, label, { min, max });
}

/** Casilla de verificación / interruptor. */
export function checkbox(form: FormData, field: string): boolean {
  const value = form.get(field);
  return value === "on" || value === "true" || value === "1";
}

/** Fecha ISO obligatoria (input type="date"). */
export function requiredDate(
  form: FormData,
  field: string,
  label: string,
): string {
  const value = String(form.get(field) ?? "").trim();
  if (!value) throw new ValidationError(`El campo "${label}" es obligatorio.`);
  if (!isIsoDate(value)) {
    throw new ValidationError(`El campo "${label}" no es una fecha válida.`);
  }
  return value;
}

/** Valor obligatorio dentro de un conjunto cerrado (selects). */
export function requiredEnum<T extends string>(
  form: FormData,
  field: string,
  label: string,
  allowed: readonly T[],
): T {
  const value = String(form.get(field) ?? "").trim();
  if (!allowed.includes(value as T)) {
    throw new ValidationError(`El campo "${label}" tiene un valor no válido.`);
  }
  return value as T;
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function requiredUuid(
  form: FormData,
  field: string,
  label: string,
): string {
  const value = String(form.get(field) ?? "").trim();
  if (!UUID.test(value)) {
    throw new ValidationError(`Debes seleccionar un valor en "${label}".`);
  }
  return value;
}

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

/** Correo opcional con una comprobación de forma deliberadamente laxa. */
export function optionalEmail(form: FormData, field: string): string | null {
  const value = optionalText(form, field, 200);
  if (!value) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    throw new ValidationError("El correo del huésped no tiene un formato válido.");
  }
  return value;
}

/**
 * Lista de textos enviada como JSON desde un editor de "chips".
 * Se acepta también el formato plano (una línea por elemento) por si el
 * navegador no ejecuta JavaScript.
 */
export function stringList(form: FormData, field: string): string[] {
  const raw = String(form.get(field) ?? "").trim();
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 40);
    } catch {
      throw new ValidationError("No se pudo leer la lista de amenidades.");
    }
  }
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 40);
}

/** URL de imagen: http(s) o ruta absoluta del propio sitio (/images/...). */
export function isAllowedImageUrl(value: string): boolean {
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export type GalleryImageInput = { url: string; alt: string };

/** Galería serializada como JSON desde el editor de imágenes. */
export function galleryList(form: FormData, field: string): GalleryImageInput[] {
  const raw = String(form.get(field) ?? "").trim();
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ValidationError("No se pudo leer la galería de imágenes.");
  }
  if (!Array.isArray(parsed)) return [];

  return parsed.flatMap((item): GalleryImageInput[] => {
    if (typeof item !== "object" || item === null) return [];
    const { url, alt } = item as Record<string, unknown>;
    if (typeof url !== "string") return [];
    const cleanUrl = url.trim();
    if (!cleanUrl) return [];
    if (!isAllowedImageUrl(cleanUrl)) {
      throw new ValidationError(
        `La dirección de imagen "${cleanUrl.slice(0, 60)}" no es válida. Debe empezar por https:// o por /.`,
      );
    }
    return [
      {
        url: cleanUrl,
        alt: typeof alt === "string" ? alt.trim().slice(0, 300) : "",
      },
    ];
  });
}

/**
 * Envuelve el cuerpo de una Server Action.
 * Devuelve el estado de error en vez de propagar la excepción, salvo cuando se
 * trata de las señales internas de Next (`redirect()` / `notFound()`), que
 * deben seguir su curso.
 */
export async function runAction(
  body: () => Promise<ActionState>,
): Promise<ActionState> {
  try {
    return await body();
  } catch (error) {
    if (isNextControlFlow(error)) throw error;
    if (error instanceof ValidationError) return errorState(error.message);
    console.error("[admin] error inesperado en Server Action:", error);
    return errorState(
      "Ocurrió un error inesperado al guardar. Intenta de nuevo; si persiste, avísale al desarrollador.",
    );
  }
}

/** `redirect()` y `notFound()` señalizan con excepciones con `digest`. */
function isNextControlFlow(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    ((error as { digest: string }).digest.startsWith("NEXT_REDIRECT") ||
      (error as { digest: string }).digest === "NEXT_NOT_FOUND")
  );
}
