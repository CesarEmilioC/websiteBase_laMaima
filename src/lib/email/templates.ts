/**
 * Plantillas de los correos transaccionales de La Maima.
 *
 * Este módulo es PURO: recibe los datos de la reserva y devuelve asunto, HTML
 * y texto plano. No conoce Resend, no lee variables de entorno y no toca la
 * base de datos, así que se puede renderizar a un archivo y revisar en el
 * navegador sin enviar nada (que es justo como se verificó).
 *
 * Por qué el HTML está escrito así, y no con Tailwind ni con componentes:
 *
 *   - **Estilos en línea, obligatorio.** Gmail, Outlook y compañía descartan
 *     hojas de estilo externas y buena parte de lo que va en <style>. Cada
 *     regla viaja en su propio atributo `style`.
 *   - **Maquetación con <table>.** Outlook para Windows sigue renderizando con
 *     el motor de Word: flexbox y grid no existen para él. Las tablas anidadas
 *     son feas, pero son lo único que se ve igual en todos los clientes.
 *   - **Ancho fijo de 600 px** con celdas que se adaptan por debajo: es el
 *     ancho que cabe en el panel de vista previa de todos los clientes.
 *   - **Texto plano siempre.** Se envía como alternativa `text`: hay clientes
 *     (y filtros antispam) que lo prefieren, y un correo sin versión plana
 *     puntúa peor en entregabilidad.
 *
 * La paleta es la del sitio: verde bosque #2b6644 como color de acción,
 * #0a1a11 para el pie, grises iOS para el texto.
 */
import { formatLongDateEs, nightsBetween } from "../dates";
import { formatCOP, formatGuests } from "../format";
import { SITE } from "../site";
import type { ContactInfo } from "../content";

/* ---------------------------------------------------------------------------
 * Datos de entrada
 * ------------------------------------------------------------------------- */

/**
 * Reserva vista por los correos. Es un subconjunto de la fila `bookings`
 * (`AdminBooking`), para poder pasar la fila tal cual cuando se integre con
 * el webhook de la pasarela.
 */
export type BookingEmailData = {
  /** `id` de la fila: sirve de número de reserva. */
  id: string;
  accommodationName: string;
  /** "YYYY-MM-DD" */
  checkIn: string;
  /** "YYYY-MM-DD" (día de salida, exclusivo) */
  checkOut: string;
  guests: number;
  totalCop: number;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  /** Estado de la reserva, para el aviso interno. */
  status?: string;
  /** Canal de origen ('web', 'airbnb', …), para el aviso interno. */
  source?: string;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

type Context = {
  booking: BookingEmailData;
  contact: ContactInfo;
};

/* ---------------------------------------------------------------------------
 * Utilidades
 * ------------------------------------------------------------------------- */

/**
 * Escapa el texto que se interpola en el HTML.
 *
 * No es una precaución teórica: el nombre, el correo y el teléfono del huésped
 * los escribe una persona y viajan tal cual al aviso interno. Un `<` sin
 * escapar rompería la maqueta del correo en el mejor de los casos.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Número de reserva legible: los ocho primeros caracteres del UUID. */
export function bookingReference(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

const COLORS = {
  forest: "#2b6644",
  forestDark: "#0a1a11",
  forestSoft: "#f2f8f5",
  ink: "#1d1d1f",
  inkSoft: "#424245",
  inkMuted: "#6e6e73",
  page: "#f5f5f7",
  hairline: "#e5e5ea",
  white: "#ffffff",
  amber: "#fef3c7",
  amberInk: "#78350f",
} as const;

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const LOGO_URL = `${SITE.url}/logo-lamaima.png`;

/** Fila etiqueta/valor de las tablas de detalle. */
function detailRow(label: string, value: string, last = false): string {
  const border = last ? "" : `border-bottom:1px solid ${COLORS.hairline};`;
  return `
              <tr>
                <td style="${border}padding:12px 0;font-family:${FONT};font-size:15px;line-height:22px;color:${COLORS.inkMuted};" valign="top">${escapeHtml(label)}</td>
                <td style="${border}padding:12px 0;font-family:${FONT};font-size:15px;line-height:22px;color:${COLORS.ink};font-weight:600;text-align:right;" valign="top" align="right">${value}</td>
              </tr>`;
}

/** Botón sólido (una tabla, porque un <a> con padding se rompe en Outlook). */
function button(href: string, label: string, color = COLORS.forest): string {
  return `
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
              <tr>
                <td align="center" bgcolor="${color}" style="border-radius:999px;">
                  <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a>
                </td>
              </tr>
            </table>`;
}

/**
 * Armazón común: fondo gris, tarjeta blanca de 600 px, banda con el logo y
 * pie verde oscuro con los datos de contacto.
 *
 * El `preheader` es el texto que Gmail muestra junto al asunto en la bandeja.
 * Va oculto (alto cero y color transparente) para que no se vea al abrir el
 * correo, y los caracteres invisibles del final evitan que el cliente rellene
 * ese espacio con el principio del cuerpo.
 */
function shell({
  title,
  preheader,
  body,
  contact,
}: {
  title: string;
  preheader: string;
  body: string;
  contact: ContactInfo;
}): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.page};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">${escapeHtml(preheader)}&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.page};">
    <tr>
      <td align="center" style="padding:28px 12px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:${COLORS.white};border-radius:22px;overflow:hidden;">

          <!-- Marca ------------------------------------------------------ -->
          <tr>
            <td align="center" style="padding:32px 24px 26px 24px;background-color:${COLORS.white};">
              <img src="${LOGO_URL}" alt="${escapeHtml(SITE.legalName)}" width="150" style="display:block;width:150px;max-width:60%;height:auto;border:0;">
            </td>
          </tr>
          <tr>
            <td style="height:4px;line-height:4px;font-size:0;background-color:${COLORS.forest};">&nbsp;</td>
          </tr>

          <!-- Cuerpo ----------------------------------------------------- -->
          <tr>
            <td style="padding:34px 28px 36px 28px;">
${body}
            </td>
          </tr>

          <!-- Pie -------------------------------------------------------- -->
          <tr>
            <td style="padding:26px 28px 30px 28px;background-color:${COLORS.forestDark};">
              <p style="margin:0 0 6px 0;font-family:${FONT};font-size:15px;line-height:22px;color:#ffffff;font-weight:600;">${escapeHtml(SITE.legalName)}</p>
              <p style="margin:0 0 3px 0;font-family:${FONT};font-size:13px;line-height:20px;color:rgba(245,245,247,0.66);">${escapeHtml(contact.addressLine)}</p>
              <p style="margin:0 0 14px 0;font-family:${FONT};font-size:13px;line-height:20px;color:rgba(245,245,247,0.66);">
                WhatsApp <a href="https://wa.me/${escapeHtml(contact.whatsapp)}" style="color:#9bc7ae;text-decoration:none;">${escapeHtml(contact.phoneDisplay)}</a>
                &nbsp;·&nbsp;
                <a href="${escapeHtml(SITE.url)}" style="color:#9bc7ae;text-decoration:none;">${escapeHtml(SITE.url.replace(/^https?:\/\//, ""))}</a>
              </p>
              <p style="margin:0;font-family:${FONT};font-size:12px;line-height:19px;color:rgba(245,245,247,0.42);">
                <a href="${escapeHtml(SITE.url)}/legal/terminos" style="color:rgba(245,245,247,0.62);text-decoration:underline;">Términos</a>
                &nbsp;·&nbsp;
                <a href="${escapeHtml(SITE.url)}/legal/cancelacion" style="color:rgba(245,245,247,0.62);text-decoration:underline;">Cancelaciones</a>
                &nbsp;·&nbsp;
                <a href="${escapeHtml(SITE.url)}/legal/privacidad" style="color:rgba(245,245,247,0.62);text-decoration:underline;">Privacidad</a>
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:18px 0 0 0;font-family:${FONT};font-size:12px;line-height:18px;color:${COLORS.inkMuted};max-width:600px;">
          Recibes este correo porque hiciste una reserva en ${escapeHtml(SITE.name)}.
        </p>

      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/* ---------------------------------------------------------------------------
 * 1. Confirmación al huésped
 * ------------------------------------------------------------------------- */

/**
 * Correo que recibe el huésped cuando su reserva queda confirmada.
 *
 * Tono de marca: cálido y concreto. Lo que la persona necesita saber está
 * arriba (qué reservó, cuándo, cuánto) y lo operativo —cómo llegar, a quién
 * escribir— justo debajo, sin obligar a abrir el sitio.
 */
export function renderBookingConfirmation({
  booking,
  contact,
}: Context): RenderedEmail {
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const nightsLabel = `${nights} ${nights === 1 ? "noche" : "noches"}`;
  const reference = bookingReference(booking.id);
  const firstName = booking.guestName.trim().split(/\s+/)[0] || "hola";

  const subject = `Reserva confirmada en La Maima · ${booking.accommodationName}, ${formatLongDateEs(booking.checkIn)}`;

  const whatsappHref = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    `Hola! Tengo la reserva ${reference} en ${booking.accommodationName} y quiero preguntar algo.`,
  )}`;

  const body = `
            <p style="margin:0 0 6px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${COLORS.forest};font-weight:600;">Reserva ${escapeHtml(reference)}</p>
            <h1 style="margin:0 0 14px 0;font-family:${FONT};font-size:27px;line-height:34px;letter-spacing:-0.6px;color:${COLORS.ink};font-weight:600;">Tu reserva está confirmada</h1>

            <p style="margin:0 0 14px 0;font-family:${FONT};font-size:16px;line-height:26px;color:${COLORS.inkSoft};">
              ${escapeHtml(firstName)}, te esperamos en <strong style="color:${COLORS.ink};">${escapeHtml(booking.accommodationName)}</strong>. Ya bloqueamos tus fechas: el bosque, los senderos y el silencio de Dapa quedan reservados para ti.
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.forestSoft};border-radius:16px;margin:0 0 24px 0;">
              <tr>
                <td style="padding:18px 20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${detailRow("Alojamiento", escapeHtml(booking.accommodationName))}
${detailRow("Entrada", escapeHtml(formatLongDateEs(booking.checkIn)))}
${detailRow("Salida", escapeHtml(formatLongDateEs(booking.checkOut)))}
${detailRow("Noches", escapeHtml(nightsLabel))}
${detailRow("Huéspedes", escapeHtml(formatGuests(booking.guests)))}
${detailRow("Total", `${escapeHtml(formatCOP(booking.totalCop))} COP`, true)}
                  </table>
                </td>
              </tr>
            </table>

            <h2 style="margin:0 0 8px 0;font-family:${FONT};font-size:17px;line-height:24px;color:${COLORS.ink};font-weight:600;">Cómo llegar</h2>
            <p style="margin:0 0 8px 0;font-family:${FONT};font-size:15px;line-height:24px;color:${COLORS.inkSoft};">
              ${escapeHtml(contact.addressLine)}. La subida a Dapa es de montaña: si llegas de noche, avísanos con tiempo y te guiamos.
            </p>
            <p style="margin:0 0 26px 0;font-family:${FONT};font-size:15px;line-height:24px;">
              <a href="${escapeHtml(contact.maps.url)}" style="color:${COLORS.forest};font-weight:600;text-decoration:underline;">Abrir la ubicación en Google Maps</a>
            </p>

${button(whatsappHref, "Escribirnos por WhatsApp")}

            <p style="margin:22px 0 0 0;font-family:${FONT};font-size:14px;line-height:22px;color:${COLORS.inkMuted};text-align:center;">
              ¿Necesitas cambiar o cancelar? Escríbenos al ${escapeHtml(contact.phoneDisplay)} con tu número de reserva.<br>
              Consulta la <a href="${escapeHtml(SITE.url)}/legal/cancelacion" style="color:${COLORS.forest};text-decoration:underline;">política de cancelación</a>.
            </p>`;

  const text = [
    `Reserva confirmada en ${SITE.legalName}`,
    "",
    `${firstName}, te esperamos en ${booking.accommodationName}. Tus fechas ya están bloqueadas.`,
    "",
    `Número de reserva: ${reference}`,
    `Alojamiento: ${booking.accommodationName}`,
    `Entrada: ${formatLongDateEs(booking.checkIn)}`,
    `Salida: ${formatLongDateEs(booking.checkOut)}`,
    `Noches: ${nightsLabel}`,
    `Huéspedes: ${formatGuests(booking.guests)}`,
    `Total: ${formatCOP(booking.totalCop)} COP`,
    "",
    "Cómo llegar",
    contact.addressLine,
    contact.maps.url,
    "",
    `¿Dudas, cambios o cancelaciones? Escríbenos por WhatsApp al ${contact.phoneDisplay} con tu número de reserva.`,
    `Política de cancelación: ${SITE.url}/legal/cancelacion`,
    "",
    `${SITE.legalName} · ${contact.addressLine}`,
    SITE.url,
  ].join("\n");

  return {
    subject,
    html: shell({
      title: subject,
      preheader: `${booking.accommodationName} · ${formatLongDateEs(booking.checkIn)} · ${nightsLabel}`,
      body,
      contact,
    }),
    text,
  };
}

/* ---------------------------------------------------------------------------
 * 2. Aviso interno al hotel
 * ------------------------------------------------------------------------- */

/**
 * Correo que recibe el equipo de La Maima cuando entra una reserva.
 *
 * Aquí manda la operación, no el estilo: el asunto trae ya lo esencial (para
 * leerlo desde la notificación del teléfono, sin abrir nada) y el cuerpo trae
 * los datos de contacto del huésped y el enlace directo a la reserva en el
 * panel.
 */
export function renderBookingNotification({
  booking,
  contact,
}: Context): RenderedEmail {
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const nightsLabel = `${nights} ${nights === 1 ? "noche" : "noches"}`;
  const reference = bookingReference(booking.id);

  const subject = `Nueva reserva · ${booking.accommodationName} · ${formatLongDateEs(booking.checkIn)} → ${formatLongDateEs(booking.checkOut)}`;

  const panelUrl = `${SITE.url}/admin/reservas/${booking.id}`;
  const guestPhone = booking.guestPhone?.trim() || null;
  const guestEmail = booking.guestEmail?.trim() || null;

  const contactRows = [
    detailRow("Huésped", escapeHtml(booking.guestName)),
    guestEmail
      ? detailRow(
          "Correo",
          `<a href="mailto:${escapeHtml(guestEmail)}" style="color:${COLORS.forest};text-decoration:none;">${escapeHtml(guestEmail)}</a>`,
        )
      : detailRow("Correo", "—"),
    detailRow(
      "Teléfono",
      guestPhone
        ? `<a href="https://wa.me/${escapeHtml(guestPhone.replace(/\D/g, ""))}" style="color:${COLORS.forest};text-decoration:none;">${escapeHtml(guestPhone)}</a>`
        : "—",
      true,
    ),
  ].join("");

  const body = `
            <p style="margin:0 0 6px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${COLORS.forest};font-weight:600;">Aviso interno · Reserva ${escapeHtml(reference)}</p>
            <h1 style="margin:0 0 18px 0;font-family:${FONT};font-size:25px;line-height:32px;letter-spacing:-0.5px;color:${COLORS.ink};font-weight:600;">Nueva reserva en ${escapeHtml(booking.accommodationName)}</h1>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.forestSoft};border-radius:16px;margin:0 0 16px 0;">
              <tr>
                <td style="padding:18px 20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${detailRow("Alojamiento", escapeHtml(booking.accommodationName))}
${detailRow("Entrada", escapeHtml(formatLongDateEs(booking.checkIn)))}
${detailRow("Salida", escapeHtml(formatLongDateEs(booking.checkOut)))}
${detailRow("Noches", escapeHtml(nightsLabel))}
${detailRow("Huéspedes", escapeHtml(formatGuests(booking.guests)))}
${detailRow("Total", `${escapeHtml(formatCOP(booking.totalCop))} COP`)}
${detailRow("Estado", escapeHtml(booking.status ?? "pending"))}
${detailRow("Origen", escapeHtml(booking.source ?? "web"), true)}
                  </table>
                </td>
              </tr>
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${COLORS.hairline};border-radius:16px;margin:0 0 26px 0;">
              <tr>
                <td style="padding:18px 20px;">
                  <p style="margin:0 0 6px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${COLORS.inkMuted};font-weight:600;">Contacto del huésped</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${contactRows}
                  </table>
                </td>
              </tr>
            </table>

${button(panelUrl, "Abrir en el panel")}

            <p style="margin:22px 0 0 0;font-family:${FONT};font-size:13px;line-height:21px;color:${COLORS.inkMuted};text-align:center;">
              Confirma la reserva en el panel para que las fechas queden bloqueadas también en Airbnb y Booking.
            </p>`;

  const text = [
    `Nueva reserva en ${booking.accommodationName}`,
    "",
    `Referencia: ${reference}`,
    `Entrada: ${formatLongDateEs(booking.checkIn)}`,
    `Salida: ${formatLongDateEs(booking.checkOut)}`,
    `Noches: ${nightsLabel}`,
    `Huéspedes: ${formatGuests(booking.guests)}`,
    `Total: ${formatCOP(booking.totalCop)} COP`,
    `Estado: ${booking.status ?? "pending"}`,
    `Origen: ${booking.source ?? "web"}`,
    "",
    "Contacto del huésped",
    `Nombre: ${booking.guestName}`,
    `Correo: ${guestEmail ?? "—"}`,
    `Teléfono: ${guestPhone ?? "—"}`,
    "",
    `Abrir en el panel: ${panelUrl}`,
    "",
    `${SITE.legalName} · ${contact.addressLine}`,
  ].join("\n");

  return {
    subject,
    html: shell({
      title: subject,
      preheader: `${booking.guestName} · ${formatGuests(booking.guests)} · ${formatCOP(booking.totalCop)} COP`,
      body,
      contact,
    }),
    text,
  };
}
