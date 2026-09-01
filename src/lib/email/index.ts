/**
 * Correos transaccionales de La Maima (Resend).
 *
 *   import { sendBookingRequestReceived } from "@/lib/email";
 *
 * `send.ts` habla con Resend y es `server-only`; `templates.ts` es puro y se
 * puede renderizar sin red ni claves (para revisar el diseño del correo).
 *
 * Los tres correos del motor de reservas:
 *
 *   · `sendBookingRequestReceived` — al huésped, al enviar el formulario.
 *     Trae el código y el aviso del hold de 48 h. En SU idioma.
 *   · `sendBookingConfirmation`    — al huésped, cuando el equipo confirma.
 *     En SU idioma.
 *   · `sendBookingNotification`    — al equipo. Siempre en español.
 */
export {
  isEmailConfigured,
  sendBookingConfirmation,
  sendBookingNotification,
  sendBookingRequestReceived,
  type EmailResult,
} from "./send";

export {
  bookingReference,
  displayReference,
  renderBookingConfirmation,
  renderBookingNotification,
  renderBookingRequestReceived,
  type BookingEmailData,
  type RenderedEmail,
} from "./templates";
