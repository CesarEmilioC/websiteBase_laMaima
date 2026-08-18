/**
 * Utilidades de fecha del panel.
 *
 * El contenido vive ahora en `@/lib/dates`, porque el motor de reservas
 * público necesita exactamente la misma aritmética (fechas ISO tratadas como
 * texto para no arrastrar husos horarios). Este archivo se conserva como
 * reexportación para no tocar los imports del panel, ya verificados.
 */
export * from "../dates";
