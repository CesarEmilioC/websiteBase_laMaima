import type { BookingStatus } from "./types";

/**
 * Color de la pastilla según el estado de la reserva.
 * Vive aparte de `types.ts` porque es una decisión de presentación, no del
 * modelo de datos.
 */
export function statusTone(
  status: BookingStatus,
): "green" | "amber" | "red" | "blue" | "neutral" {
  switch (status) {
    // Confirmada y pagada comparten el azul de marca: las dos significan
    // "esto va en firme" y se distinguen por la etiqueta, no por el color.
    case "paid":
    case "confirmed":
      return "green";
    case "pending":
      return "amber";
    case "cancelled":
      return "red";
    case "external":
      return "blue";
    default:
      return "neutral";
  }
}
