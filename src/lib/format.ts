/**
 * Utilidades de formato de cifras y cantidades.
 */
import { DEFAULT_LOCALE, type Locale } from "./i18n/config";

/**
 * Formatea un monto en pesos colombianos con separador de miles de punto:
 * 350000 -> "$350.000".
 *
 * Se implementa a mano (en vez de Intl.NumberFormat) para que el resultado sea
 * idéntico en el servidor y en el navegador sin depender de qué datos de ICU
 * traiga cada runtime, y así evitar errores de hidratación.
 *
 * NO cambia con el idioma: la moneda es la misma en las dos versiones del
 * sitio y un "$1,400,000" a la inglesa invitaría a leerlo como dólares. Lo que
 * sí cambia es que en inglés la unidad se escribe siempre "COP" al lado del
 * número (ver `common.copPerNight` en el diccionario), porque un visitante
 * extranjero no da por hecho que el peso es la moneda de la casa.
 */
export function formatCOP(amount: number): string {
  const rounded = Math.round(Math.abs(amount));
  const withDots = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${amount < 0 ? "-" : ""}$${withDots}`;
}

/** "1 persona" / "4 personas" · "1 guest" / "4 guests" */
export function formatGuests(
  capacity: number,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (locale === "en") {
    return `${capacity} ${capacity === 1 ? "guest" : "guests"}`;
  }
  return `${capacity} ${capacity === 1 ? "persona" : "personas"}`;
}

/** "1 noche" / "3 noches" · "1 night" / "3 nights" */
export function formatNights(
  nights: number,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (locale === "en") {
    return `${nights} ${nights === 1 ? "night" : "nights"}`;
  }
  return `${nights} ${nights === 1 ? "noche" : "noches"}`;
}
