/**
 * Envío de los correos transaccionales con Resend.
 *
 * ESTADO: listo pero DORMIDO. Todavía no hay cuenta de Resend, ni dominio
 * verificado, ni `RESEND_API_KEY`. Mientras esa variable no exista, las dos
 * funciones de envío **no hacen nada y no fallan**: registran en consola qué
 * habrían enviado y devuelven `{ sent: false, reason: "not-configured" }`.
 *
 * Esa decisión es deliberada. Estas funciones se llamarán desde el webhook de
 * la pasarela de pagos, donde un `throw` sería desastroso: el huésped ya pagó
 * y la reserva ya está creada, así que un fallo al enviar el correo NUNCA
 * puede tumbar la transacción. Quien llame decide qué hacer con el resultado;
 * ignorarlo es una respuesta válida.
 *
 * Para activarlo, cuando el cliente tenga cuenta y dominio:
 *   1. Verificar `lamaima.com` en Resend (registros DNS).
 *   2. Poner `RESEND_API_KEY`, `EMAIL_FROM` y `EMAIL_NOTIFY_TO` en Vercel y en
 *      `.env.local` (ver `.env.local.example`).
 *   3. No hay que tocar código: el remitente y el destinatario interno se leen
 *      del entorno.
 */
import "server-only";

import { getContactInfo } from "../content";
import {
  renderBookingConfirmation,
  renderBookingNotification,
  type BookingEmailData,
  type RenderedEmail,
} from "./templates";

/* ---------------------------------------------------------------------------
 * Configuración
 * ------------------------------------------------------------------------- */

/** Valores de plantilla que se tratan como "sin configurar". */
const PLACEHOLDERS = ["REEMPLAZAR", "REPLACE_ME", "TODO"];

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  if (!value) return null;
  if (PLACEHOLDERS.some((placeholder) => value.startsWith(placeholder))) {
    return null;
  }
  return value;
}

/**
 * Remitente por defecto. Debe pertenecer a un dominio verificado en Resend:
 * enviar desde un dominio ajeno hace que el correo se marque como spam.
 */
const DEFAULT_FROM = "La Maima <reservas@lamaima.com>";

/** ¿Está Resend configurado en este entorno? */
export function isEmailConfigured(): boolean {
  return readEnv("RESEND_API_KEY") !== null;
}

/* ---------------------------------------------------------------------------
 * Resultado
 * ------------------------------------------------------------------------- */

export type EmailResult =
  /** Entregado a Resend. `id` es el identificador del envío. */
  | { sent: true; id: string | null }
  /**
   * No se envió, y no pasa nada:
   *   - `not-configured`: falta `RESEND_API_KEY` (fase actual del proyecto).
   *   - `no-recipient`:   la reserva no trae correo, o falta `EMAIL_NOTIFY_TO`.
   *   - `failed`:         Resend respondió con error o la red falló.
   */
  | {
      sent: false;
      reason: "not-configured" | "no-recipient" | "failed";
      message: string;
    };

/* ---------------------------------------------------------------------------
 * Envío
 * ------------------------------------------------------------------------- */

/**
 * Único punto que habla con Resend. El cliente se instancia aquí dentro (y no
 * al cargar el módulo) para que importar este archivo sin la clave no reviente
 * nada: en la fase actual, el módulo se importa y nunca se llega a este punto.
 */
async function deliver(
  to: string,
  email: RenderedEmail,
  label: string,
): Promise<EmailResult> {
  const apiKey = readEnv("RESEND_API_KEY");

  if (!apiKey) {
    console.info(
      `[email] ${label}: RESEND_API_KEY no está configurada, no se envía nada. ` +
        `Destinatario previsto: ${to} — asunto: "${email.subject}".`,
    );
    return {
      sent: false,
      reason: "not-configured",
      message: "RESEND_API_KEY no está configurada.",
    };
  }

  try {
    // Importación dinámica: el paquete solo se carga si de verdad se va a usar.
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: readEnv("EMAIL_FROM") ?? DEFAULT_FROM,
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    if (error) {
      console.error(`[email] ${label}: Resend devolvió error:`, error.message);
      return { sent: false, reason: "failed", message: error.message };
    }

    console.info(`[email] ${label}: enviado a ${to} (id ${data?.id ?? "?"}).`);
    return { sent: true, id: data?.id ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[email] ${label}: fallo al enviar:`, message);
    return { sent: false, reason: "failed", message };
  }
}

/**
 * Confirmación de reserva al huésped.
 *
 * Se llama después de que el pago quede confirmado. Si la reserva no trae
 * correo (las que registra el equipo a mano desde el panel a veces no lo
 * tienen), no se envía nada y se dice por qué.
 */
export async function sendBookingConfirmation(
  booking: BookingEmailData,
): Promise<EmailResult> {
  const to = booking.guestEmail?.trim();
  if (!to) {
    console.info(
      `[email] confirmación: la reserva ${booking.id} no tiene correo del huésped.`,
    );
    return {
      sent: false,
      reason: "no-recipient",
      message: "La reserva no tiene correo del huésped.",
    };
  }

  const contact = await getContactInfo();
  const email = renderBookingConfirmation({ booking, contact });
  return deliver(to, email, "confirmación");
}

/**
 * Aviso interno al equipo de La Maima.
 *
 * El destinatario sale de `EMAIL_NOTIFY_TO` (admite varios correos separados
 * por coma). Sin esa variable no hay a quién avisar y la función no hace nada.
 */
export async function sendBookingNotification(
  booking: BookingEmailData,
): Promise<EmailResult> {
  const to = readEnv("EMAIL_NOTIFY_TO");
  if (!to) {
    console.info(
      `[email] aviso interno: EMAIL_NOTIFY_TO no está configurada (reserva ${booking.id}).`,
    );
    return {
      sent: false,
      reason: "no-recipient",
      message: "EMAIL_NOTIFY_TO no está configurada.",
    };
  }

  const contact = await getContactInfo();
  const email = renderBookingNotification({ booking, contact });
  return deliver(to, email, "aviso interno");
}
