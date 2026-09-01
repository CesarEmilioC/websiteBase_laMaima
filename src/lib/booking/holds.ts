/**
 * Reglas del HOLD de 48 horas.
 *
 * ---------------------------------------------------------------------------
 * EL PROBLEMA
 * ---------------------------------------------------------------------------
 * Una solicitud web nace `pending`: nadie ha pagado todavía, pero las fechas
 * tienen que quedar apartadas mientras el equipo confirma, o dos personas
 * acabarán durmiendo en la misma cama. Apartarlas para siempre tampoco sirve:
 * quien rellena el formulario y desaparece dejaría la cabaña bloqueada un año.
 *
 * De ahí el hold: `expires_at = ahora + 48 h`. Un `pending` con `expires_at`
 * pasado **NO ocupa calendario**.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ HAY QUE CANCELARLOS A MANO ANTES DE CADA CREACIÓN
 * ---------------------------------------------------------------------------
 * La restricción `bookings_no_overlap` de Postgres es una restricción EXCLUDE,
 * y su predicado (`where status in (…)`) tiene que ser **inmutable**: no puede
 * llamar a `now()`. Para ella un hold vencido sigue siendo un `pending` que
 * ocupa sitio, y rechazaría la reserva nueva.
 *
 * La consecuencia práctica es una regla que NO se puede olvidar:
 *
 *   **Toda creación de reserva —la pública y la manual del panel— cancela
 *   primero los holds vencidos de ese alojamiento.**
 *
 * Con eso, la restricción de la base de datos vuelve a decir la verdad y sigue
 * siendo la última línea de defensa contra dos solicitudes simultáneas.
 *
 * `null` en `expires_at` significa "no vence": es lo que llevan las reservas
 * confirmadas, las pagadas, las manuales y las de canales externos.
 *
 * Módulo PURO (sin Supabase): el barrido que escribe en la base vive en
 * `sweep.ts`, que sí es `server-only`.
 */

/** Horas que se apartan las fechas mientras el equipo confirma. */
export const HOLD_HOURS = 48;

/** Milisegundos de una hora. */
const HOUR_MS = 60 * 60 * 1000;

/** Marca interna que se anota al cancelar un hold vencido. */
export const EXPIRED_HOLD_NOTE = "Hold vencido: la solicitud caducó sin confirmar.";

/** Vencimiento de un hold que nace ahora. */
export function holdExpiresAt(now: Date = new Date()): Date {
  return new Date(now.getTime() + HOLD_HOURS * HOUR_MS);
}

/**
 * ¿Este hold ya venció?
 *
 * Solo los `pending` vencen: un `confirmed` o un `paid` con `expires_at`
 * heredado de su vida anterior sigue ocupando calendario, y por eso el estado
 * entra en la comprobación y no solo la fecha.
 */
export function isHoldExpired(
  status: string,
  expiresAt: string | Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (status !== "pending") return false;
  if (expiresAt === null || expiresAt === undefined) return false;
  const limit = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(limit.getTime())) return false;
  return limit.getTime() <= now.getTime();
}

/** Forma mínima de una fila de `bookings` para decidir si ocupa calendario. */
export type OccupancyCandidate = {
  status: string;
  expires_at?: string | null;
};

/**
 * ¿La fila ocupa fechas en el calendario?
 *
 * Es LA regla del motor, y está en un solo sitio a propósito: la usan el
 * endpoint de disponibilidad del widget, el exportador iCal que leen Airbnb y
 * Booking, y la comprobación de choques del panel. Si los tres no dijeran
 * exactamente lo mismo, la diferencia se llamaría sobreventa.
 */
export function occupiesCalendar(
  row: OccupancyCandidate,
  now: Date = new Date(),
): boolean {
  if (row.status === "cancelled") return false;
  return !isHoldExpired(row.status, row.expires_at ?? null, now);
}

/**
 * Cuánto le queda al hold, en minutos. Negativo si ya venció, `null` si la
 * reserva no vence.
 */
export function holdMinutesLeft(
  expiresAt: string | Date | null | undefined,
  now: Date = new Date(),
): number | null {
  if (expiresAt === null || expiresAt === undefined) return null;
  const limit = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(limit.getTime())) return null;
  return Math.round((limit.getTime() - now.getTime()) / 60000);
}

/**
 * Cuenta atrás del hold en español, para el panel: "quedan 12 h 20 min",
 * "quedan 45 min", "vencido hace 3 h".
 *
 * Se redondea a minutos y no se muestran segundos: la página del panel no se
 * refresca sola y un contador al segundo estaría mintiendo desde el primer
 * instante. La granularidad de minutos, en cambio, sigue siendo cierta el rato
 * que dura una mirada.
 */
export function formatHoldCountdownEs(
  expiresAt: string | Date | null | undefined,
  now: Date = new Date(),
): string | null {
  const minutes = holdMinutesLeft(expiresAt, now);
  if (minutes === null) return null;

  if (minutes <= 0) {
    const gone = Math.abs(minutes);
    return gone < 60
      ? `Vencido hace ${gone} min`
      : `Vencido hace ${Math.floor(gone / 60)} h`;
  }

  if (minutes < 60) return `Vence en ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `Vence en ${hours} h` : `Vence en ${hours} h ${rest} min`;
}

/**
 * ¿El hold está a punto de vencer? El panel destaca estos: son las solicitudes
 * que hay que atender hoy.
 */
export const EXPIRING_SOON_HOURS = 12;

export function isExpiringSoon(
  status: string,
  expiresAt: string | Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (status !== "pending") return false;
  const minutes = holdMinutesLeft(expiresAt, now);
  if (minutes === null) return false;
  return minutes > 0 && minutes <= EXPIRING_SOON_HOURS * 60;
}
