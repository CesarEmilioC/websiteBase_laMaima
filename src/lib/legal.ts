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

/** La misma fecha, escrita para la versión inglesa de los documentos. */
export const LEGAL_UPDATED_EN = "26 August 2026";

/**
 * La misma fecha en ISO, para el `lastmod` del sitemap. Las dos constantes van
 * juntas para que no puedan separarse: si se cambia una hay que cambiar la
 * otra, y así el buscador y el lector ven lo mismo.
 */
export const LEGAL_UPDATED_ISO = "2026-08-26";

/**
 * Autoridad de control en materia de protección de datos en Colombia.
 * Se cita en la política de privacidad (derecho a presentar quejas).
 */
export const SIC = {
  name: "Superintendencia de Industria y Comercio",
  url: "https://www.sic.gov.co",
} as const;
