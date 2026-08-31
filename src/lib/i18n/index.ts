/**
 * Punto de entrada del sistema de idiomas.
 *
 * Todo el sitio público pide sus textos por aquí: `const t = dict(locale)`.
 * No hay librería de i18n de por medio a propósito —son dos idiomas y unas
 * doscientas cadenas— y el precio de una dependencia (bundle, contexto de
 * React, carga asíncrona de mensajes) no compensa. El diccionario es un objeto
 * plano tipado que el empaquetador puede sacudir como cualquier otro módulo.
 */
import { en } from "./en";
import { es, type Dictionary } from "./es";
import type { Locale } from "./config";

const DICTIONARIES: Record<Locale, Dictionary> = { es, en };

/** Textos de interfaz del idioma pedido. */
export function dict(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
export * from "./config";
