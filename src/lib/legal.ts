/**
 * Datos comunes a los tres documentos legales.
 *
 * Viven aquí y no en cada página para que la identificación del responsable y
 * la fecha de revisión no se contradigan entre documentos: si mañana llega el
 * NIT o el RNT real, se cambia en un único sitio.
 */

/**
 * Fecha de la última revisión de los textos legales, ya formateada.
 *
 * Es una constante y no `new Date()` a propósito: la fecha debe cambiar
 * cuando cambia el TEXTO, no cada vez que se despliega el sitio.
 */
export const LEGAL_UPDATED = "26 de agosto de 2026";

/**
 * Autoridad de control en materia de protección de datos en Colombia.
 * Se cita en la política de privacidad (derecho a presentar quejas).
 */
export const SIC = {
  name: "Superintendencia de Industria y Comercio",
  url: "https://www.sic.gov.co",
} as const;
