/**
 * Utilidades de formato para contenido en español (Colombia).
 */

/**
 * Formatea un monto en pesos colombianos con separador de miles de punto:
 * 350000 -> "$350.000".
 *
 * Se implementa a mano (en vez de Intl.NumberFormat) para que el resultado sea
 * idéntico en el servidor y en el navegador sin depender de qué datos de ICU
 * traiga cada runtime, y así evitar errores de hidratación.
 */
export function formatCOP(amount: number): string {
  const rounded = Math.round(Math.abs(amount));
  const withDots = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${amount < 0 ? "-" : ""}$${withDots}`;
}

/** "1 persona" / "4 personas" */
export function formatGuests(capacity: number): string {
  return `${capacity} ${capacity === 1 ? "persona" : "personas"}`;
}
