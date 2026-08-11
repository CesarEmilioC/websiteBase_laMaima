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
    case "paid":
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
