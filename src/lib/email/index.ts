/**
 * Correos transaccionales de La Maima (Resend).
 *
 *   import { sendBookingConfirmation } from "@/lib/email";
 *
 * `send.ts` habla con Resend y es `server-only`; `templates.ts` es puro y se
 * puede renderizar sin red ni claves (para revisar el diseño del correo).
 */
export {
  isEmailConfigured,
  sendBookingConfirmation,
  sendBookingNotification,
  type EmailResult,
} from "./send";

export {
  bookingReference,
  renderBookingConfirmation,
  renderBookingNotification,
  type BookingEmailData,
  type RenderedEmail,
} from "./templates";
