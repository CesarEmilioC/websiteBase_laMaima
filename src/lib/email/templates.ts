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
 * La paleta es la del sitio: azul primario #345fc6 como color de acción, azul
 * marino #101d34 para el pie, blanco cálido de fondo y grises azulados para el
 * texto (ver `COLORS` más abajo).
 *
 * ---------------------------------------------------------------------------
 * QUÉ CORREO VA EN QUÉ IDIOMA
 * ---------------------------------------------------------------------------
 * Los DOS correos al huésped se escriben en el idioma en que él hizo la
 * solicitud (columna `bookings.locale`). Es el único que sabemos que entiende,
 * y el correo llega horas o días después: no hay contexto que ayude a
 * descifrarlo, como sí lo hay en una página web con un conmutador de banderas.
 *
 * El aviso INTERNO se queda en español y no se traduce nunca: lo lee el equipo
 * de La Maima, que trabaja en español. Eso sí, indica en qué idioma escribe el
 * huésped, para que sepan en cuál responderle.
 */
import { formatLongDate } from "../dates";
import { formatCOP, formatGuests } from "../format";
import { DEFAULT_LOCALE, localePath, type Locale } from "../i18n/config";
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
  /** `id` de la fila. Se usa para el enlace al panel. */
  id: string;
  /** Código legible ("LM-7F3K"). Es LA referencia de cara al huésped. */
  bookingCode?: string | null;
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
  /** Notas que escribió el huésped en el formulario. */
  guestNotes?: string | null;
  /** Estado de la reserva, para el aviso interno. */
  status?: string;
  /** Canal de origen ('web', 'airbnb', …), para el aviso interno. */
  source?: string;
  /** Idioma del huésped: define el idioma de SUS correos. */
  locale?: Locale;
  /** ISO 8601: cuándo caduca el hold de 48 h. Solo en la solicitud recibida. */
  expiresAt?: string | null;
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
 * No es una precaución teórica: el nombre, el correo, el teléfono y las notas
 * del huésped los escribe una persona y viajan tal cual al aviso interno. Un
 * `<` sin escapar rompería la maqueta del correo en el mejor de los casos.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Número de reserva de respaldo: los ocho primeros caracteres del UUID.
 *
 * Solo se usa en las filas antiguas y en las que registra el equipo a mano sin
 * código. Las solicitudes del sitio traen `booking_code`, que es legible y
 * dictable por teléfono; ver `@/lib/booking/code`.
 */
export function bookingReference(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

/** La referencia que se le enseña al huésped: el código si lo hay. */
export function displayReference(booking: BookingEmailData): string {
  return booking.bookingCode?.trim() || bookingReference(booking.id);
}

/** Elige la versión del texto según el idioma. */
function pick(locale: Locale, es: string, en: string): string {
  return locale === "en" ? en : es;
}

/** Hora de Colombia legible: "3 sep 2026 a las 14:35". */
function formatDeadline(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const bogota = new Date(date.getTime() - 5 * 60 * 60 * 1000);
  const day = `${bogota.getUTCFullYear()}-${String(bogota.getUTCMonth() + 1).padStart(2, "0")}-${String(bogota.getUTCDate()).padStart(2, "0")}`;
  const hh = String(bogota.getUTCHours()).padStart(2, "0");
  const mm = String(bogota.getUTCMinutes()).padStart(2, "0");
  const long = formatLongDate(day, locale);
  return pick(
    locale,
    `${long} a las ${hh}:${mm} (hora de Colombia)`,
    `${long} at ${hh}:${mm} (Colombia time)`,
  );
}

/**
 * Paleta del correo, en literales hexadecimales.
 *
 * Va duplicada respecto a `globals.css` a propósito: un correo se renderiza
 * en Gmail, Outlook y compañía, donde no existen ni las custom properties de
 * CSS ni la hoja de estilos del sitio. Los valores son los mismos tokens de
 * la identidad (azul primario #345fc6, marino, blanco cálido y arena), así que
 * si la paleta del sitio cambia, esta tabla hay que actualizarla a mano.
 *
 * Los nombres siguen siendo `brand*` y no `forest*`: el verde desapareció con
 * el rediseño de identidad de 2026.
 */
const COLORS = {
  brand: "#345fc6",
  brandDark: "#101d34",
  brandSoft: "#eef2fc",
  ink: "#1b2432",
  inkSoft: "#414c5e",
  inkMuted: "#5f6a7d",
  page: "#faf7f0",
  hairline: "#e8e0d1",
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
function button(href: string, label: string, color = COLORS.brand): string {
  return `
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
              <tr>
                <td align="center" bgcolor="${color}" style="border-radius:999px;">
                  <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a>
                </td>
              </tr>
            </table>`;
}

/** Aviso destacado sobre fondo ámbar (el hold de 48 horas). */
function callout(text: string): string {
  return `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.amber};border-radius:16px;margin:0 0 24px 0;">
              <tr>
                <td style="padding:16px 20px;font-family:${FONT};font-size:14px;line-height:22px;color:${COLORS.amberInk};">${text}</td>
              </tr>
            </table>`;
}

/**
 * Armazón común: fondo crema, tarjeta blanca de 600 px, banda con el logo y
 * pie azul marino con los datos de contacto.
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
  locale,
}: {
  title: string;
  preheader: string;
  body: string;
  contact: ContactInfo;
  locale: Locale;
}): string {
  const legal = (path: string) => `${SITE.url}${localePath(locale, path)}`;

  return `<!doctype html>
<html lang="${locale === "en" ? "en" : "es"}">
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
            <td style="height:4px;line-height:4px;font-size:0;background-color:${COLORS.brand};">&nbsp;</td>
          </tr>

          <!-- Cuerpo ----------------------------------------------------- -->
          <tr>
            <td style="padding:34px 28px 36px 28px;">
${body}
            </td>
          </tr>

          <!-- Pie -------------------------------------------------------- -->
          <tr>
            <td style="padding:26px 28px 30px 28px;background-color:${COLORS.brandDark};">
              <p style="margin:0 0 6px 0;font-family:${FONT};font-size:15px;line-height:22px;color:#ffffff;font-weight:600;">${escapeHtml(SITE.legalName)}</p>
              <p style="margin:0 0 3px 0;font-family:${FONT};font-size:13px;line-height:20px;color:rgba(245,245,247,0.66);">${escapeHtml(contact.addressLine)}</p>
              <p style="margin:0 0 14px 0;font-family:${FONT};font-size:13px;line-height:20px;color:rgba(245,245,247,0.66);">
                WhatsApp <a href="https://wa.me/${escapeHtml(contact.whatsapp)}" style="color:#9bc7ae;text-decoration:none;">${escapeHtml(contact.phoneDisplay)}</a>
                &nbsp;·&nbsp;
                <a href="${escapeHtml(SITE.url)}" style="color:#9bc7ae;text-decoration:none;">${escapeHtml(SITE.url.replace(/^https?:\/\//, ""))}</a>
              </p>
              <p style="margin:0;font-family:${FONT};font-size:12px;line-height:19px;color:rgba(245,245,247,0.42);">
                <a href="${escapeHtml(legal("/legal/terminos"))}" style="color:rgba(245,245,247,0.62);text-decoration:underline;">${pick(locale, "Términos", "Terms")}</a>
                &nbsp;·&nbsp;
                <a href="${escapeHtml(legal("/legal/cancelacion"))}" style="color:rgba(245,245,247,0.62);text-decoration:underline;">${pick(locale, "Cancelaciones", "Cancellations")}</a>
                &nbsp;·&nbsp;
                <a href="${escapeHtml(legal("/legal/privacidad"))}" style="color:rgba(245,245,247,0.62);text-decoration:underline;">${pick(locale, "Privacidad", "Privacy")}</a>
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:18px 0 0 0;font-family:${FONT};font-size:12px;line-height:18px;color:${COLORS.inkMuted};max-width:600px;">
          ${escapeHtml(
            pick(
              locale,
              `Recibes este correo porque hiciste una solicitud de reserva en ${SITE.name}.`,
              `You are receiving this email because you requested a booking at ${SITE.name}.`,
            ),
          )}
        </p>

      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/** Bloque de detalle común a los correos del huésped. */
function stayTable(booking: BookingEmailData, locale: Locale): string {
  const nights = nightsLabel(booking, locale);
  return `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.brandSoft};border-radius:16px;margin:0 0 24px 0;">
              <tr>
                <td style="padding:18px 20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${detailRow(pick(locale, "Alojamiento", "Accommodation"), escapeHtml(booking.accommodationName))}
${detailRow(pick(locale, "Entrada", "Check-in"), escapeHtml(formatLongDate(booking.checkIn, locale)))}
${detailRow(pick(locale, "Salida", "Check-out"), escapeHtml(formatLongDate(booking.checkOut, locale)))}
${detailRow(pick(locale, "Noches", "Nights"), escapeHtml(nights))}
${detailRow(pick(locale, "Huéspedes", "Guests"), escapeHtml(formatGuests(booking.guests, locale)))}
${detailRow(pick(locale, "Total estimado", "Estimated total"), `${escapeHtml(formatCOP(booking.totalCop))} COP`, true)}
                  </table>
                </td>
              </tr>
            </table>`;
}

function nightsLabel(booking: BookingEmailData, locale: Locale): string {
  const nights = nightsOf(booking);
  return locale === "en"
    ? `${nights} ${nights === 1 ? "night" : "nights"}`
    : `${nights} ${nights === 1 ? "noche" : "noches"}`;
}

function nightsOf(booking: BookingEmailData): number {
  const [sy, sm, sd] = booking.checkIn.split("-").map(Number);
  const [ey, em, ed] = booking.checkOut.split("-").map(Number);
  return Math.round(
    (Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86400000,
  );
}

/* ---------------------------------------------------------------------------
 * 1. Solicitud recibida (al huésped, al crear la reserva desde el sitio)
 * ------------------------------------------------------------------------- */

/**
 * Correo que recibe el huésped en cuanto envía el formulario.
 *
 * NO dice "confirmada": la reserva todavía no lo está. Dice lo único que en
 * ese momento es verdad y es lo que la persona necesita saber — que la
 * solicitud llegó, cuál es su código, y que las fechas quedan apartadas 48
 * horas mientras el equipo responde. Prometer una confirmación que aún no
 * existe es la forma más rápida de que alguien se presente en la puerta sin
 * reserva.
 */
export function renderBookingRequestReceived({
  booking,
  contact,
}: Context): RenderedEmail {
  const locale = booking.locale ?? DEFAULT_LOCALE;
  const reference = displayReference(booking);
  const firstName = booking.guestName.trim().split(/\s+/)[0] || "";

  const subject = pick(
    locale,
    `Solicitud recibida ${reference} · ${booking.accommodationName}, ${formatLongDate(booking.checkIn, "es")}`,
    `Request received ${reference} · ${booking.accommodationName}, ${formatLongDate(booking.checkIn, "en")}`,
  );

  const whatsappHref = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    pick(
      locale,
      `Hola! Hice la solicitud ${reference} en ${booking.accommodationName}.`,
      `Hi! I submitted booking request ${reference} for ${booking.accommodationName}.`,
    ),
  )}`;

  const deadline = booking.expiresAt
    ? formatDeadline(booking.expiresAt, locale)
    : null;

  const holdText = deadline
    ? pick(
        locale,
        `<strong>Tus fechas quedan reservadas hasta el ${escapeHtml(deadline)}</strong> mientras el equipo confirma la disponibilidad y te indica la forma de pago.`,
        `<strong>Your dates are held until ${escapeHtml(deadline)}</strong> while our team confirms availability and sends you the payment details.`,
      )
    : pick(
        locale,
        "<strong>Tus fechas quedan reservadas 48 horas</strong> mientras el equipo confirma la disponibilidad y te indica la forma de pago.",
        "<strong>Your dates are held for 48 hours</strong> while our team confirms availability and sends you the payment details.",
      );

  const notes = booking.guestNotes?.trim();

  const body = `
            <p style="margin:0 0 6px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${COLORS.brand};font-weight:600;letter-spacing:0.04em;">${escapeHtml(pick(locale, "Código de tu solicitud", "Your request code"))}</p>
            <p style="margin:0 0 16px 0;font-family:${FONT};font-size:30px;line-height:36px;letter-spacing:2px;color:${COLORS.ink};font-weight:700;">${escapeHtml(reference)}</p>

            <h1 style="margin:0 0 14px 0;font-family:${FONT};font-size:26px;line-height:33px;letter-spacing:-0.6px;color:${COLORS.ink};font-weight:600;">${escapeHtml(pick(locale, "Recibimos tu solicitud", "We received your request"))}</h1>

            <p style="margin:0 0 18px 0;font-family:${FONT};font-size:16px;line-height:26px;color:${COLORS.inkSoft};">
              ${escapeHtml(
                pick(
                  locale,
                  `${firstName ? `${firstName}, gracias` : "Gracias"} por elegir `,
                  `${firstName ? `${firstName}, thank you` : "Thank you"} for choosing `,
                ),
              )}<strong style="color:${COLORS.ink};">${escapeHtml(booking.accommodationName)}</strong>. ${escapeHtml(
                pick(
                  locale,
                  "Te escribimos por WhatsApp o por correo para confirmarte y coordinar el pago.",
                  "We will get back to you on WhatsApp or by email to confirm and arrange payment.",
                ),
              )}
            </p>

${callout(holdText)}

${stayTable(booking, locale)}
${
  notes
    ? `            <p style="margin:0 0 22px 0;font-family:${FONT};font-size:14px;line-height:22px;color:${COLORS.inkMuted};">
              <strong style="color:${COLORS.ink};">${escapeHtml(pick(locale, "Tu nota:", "Your note:"))}</strong> ${escapeHtml(notes)}
            </p>`
    : ""
}
${button(whatsappHref, pick(locale, "Escribirnos por WhatsApp", "Message us on WhatsApp"))}

            <p style="margin:22px 0 0 0;font-family:${FONT};font-size:14px;line-height:22px;color:${COLORS.inkMuted};text-align:center;">
              ${escapeHtml(pick(locale, "Muy pronto podrás pagar en línea desde el sitio.", "Online payment is coming to the website very soon."))}<br>
              ${escapeHtml(pick(locale, "Consulta la", "Read our"))} <a href="${escapeHtml(`${SITE.url}${localePath(locale, "/legal/cancelacion")}`)}" style="color:${COLORS.brand};text-decoration:underline;">${escapeHtml(pick(locale, "política de cancelación", "cancellation policy"))}</a>.
            </p>`;

  const text = [
    pick(locale, "Recibimos tu solicitud", "We received your request"),
    "",
    pick(locale, `Código: ${reference}`, `Code: ${reference}`),
    "",
    deadline
      ? pick(
          locale,
          `Tus fechas quedan reservadas hasta el ${deadline} mientras el equipo confirma.`,
          `Your dates are held until ${deadline} while our team confirms.`,
        )
      : pick(
          locale,
          "Tus fechas quedan reservadas 48 horas mientras el equipo confirma.",
          "Your dates are held for 48 hours while our team confirms.",
        ),
    "",
    `${pick(locale, "Alojamiento", "Accommodation")}: ${booking.accommodationName}`,
    `${pick(locale, "Entrada", "Check-in")}: ${formatLongDate(booking.checkIn, locale)}`,
    `${pick(locale, "Salida", "Check-out")}: ${formatLongDate(booking.checkOut, locale)}`,
    `${pick(locale, "Noches", "Nights")}: ${nightsLabel(booking, locale)}`,
    `${pick(locale, "Huéspedes", "Guests")}: ${formatGuests(booking.guests, locale)}`,
    `${pick(locale, "Total estimado", "Estimated total")}: ${formatCOP(booking.totalCop)} COP`,
    ...(notes ? ["", `${pick(locale, "Tu nota", "Your note")}: ${notes}`] : []),
    "",
    pick(
      locale,
      `¿Dudas? Escríbenos por WhatsApp al ${contact.phoneDisplay} con tu código.`,
      `Questions? Message us on WhatsApp at ${contact.phoneDisplay} with your code.`,
    ),
    `${pick(locale, "Política de cancelación", "Cancellation policy")}: ${SITE.url}${localePath(locale, "/legal/cancelacion")}`,
    "",
    `${SITE.legalName} · ${contact.addressLine}`,
    SITE.url,
  ].join("\n");

  return {
    subject,
    html: shell({
      title: subject,
      preheader: `${reference} · ${booking.accommodationName} · ${formatLongDate(booking.checkIn, locale)}`,
      body,
      contact,
      locale,
    }),
    text,
  };
}

/* ---------------------------------------------------------------------------
 * 2. Confirmación definitiva al huésped
 * ------------------------------------------------------------------------- */

/**
 * Correo que recibe el huésped cuando el equipo CONFIRMA la reserva desde el
 * panel (o, en su día, cuando el webhook de la pasarela marque el pago).
 *
 * Tono de marca: cálido y concreto. Lo que la persona necesita saber está
 * arriba (qué reservó, cuándo, cuánto) y lo operativo —cómo llegar, a quién
 * escribir— justo debajo, sin obligar a abrir el sitio.
 */
export function renderBookingConfirmation({
  booking,
  contact,
}: Context): RenderedEmail {
  const locale = booking.locale ?? DEFAULT_LOCALE;
  const reference = displayReference(booking);
  const firstName = booking.guestName.trim().split(/\s+/)[0] || "";

  const subject = pick(
    locale,
    `Reserva confirmada en La Maima · ${booking.accommodationName}, ${formatLongDate(booking.checkIn, "es")}`,
    `Booking confirmed at La Maima · ${booking.accommodationName}, ${formatLongDate(booking.checkIn, "en")}`,
  );

  const whatsappHref = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    pick(
      locale,
      `Hola! Tengo la reserva ${reference} en ${booking.accommodationName} y quiero preguntar algo.`,
      `Hi! I have booking ${reference} for ${booking.accommodationName} and I have a question.`,
    ),
  )}`;

  const body = `
            <p style="margin:0 0 6px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${COLORS.brand};font-weight:600;">${escapeHtml(pick(locale, "Reserva", "Booking"))} ${escapeHtml(reference)}</p>
            <h1 style="margin:0 0 14px 0;font-family:${FONT};font-size:27px;line-height:34px;letter-spacing:-0.6px;color:${COLORS.ink};font-weight:600;">${escapeHtml(pick(locale, "Tu reserva está confirmada", "Your booking is confirmed"))}</h1>

            <p style="margin:0 0 14px 0;font-family:${FONT};font-size:16px;line-height:26px;color:${COLORS.inkSoft};">
              ${escapeHtml(pick(locale, `${firstName ? `${firstName}, te` : "Te"} esperamos en `, `${firstName ? `${firstName}, we` : "We"} look forward to seeing you at `))}<strong style="color:${COLORS.ink};">${escapeHtml(booking.accommodationName)}</strong>. ${escapeHtml(
                pick(
                  locale,
                  "Ya bloqueamos tus fechas: el bosque, los senderos y el silencio de Dapa quedan reservados para ti.",
                  "Your dates are now blocked: the forest, the trails and the quiet of Dapa are yours.",
                ),
              )}
            </p>

${stayTable(booking, locale)}

            <h2 style="margin:0 0 8px 0;font-family:${FONT};font-size:17px;line-height:24px;color:${COLORS.ink};font-weight:600;">${escapeHtml(pick(locale, "Cómo llegar", "Getting here"))}</h2>
            <p style="margin:0 0 8px 0;font-family:${FONT};font-size:15px;line-height:24px;color:${COLORS.inkSoft};">
              ${escapeHtml(contact.addressLine)}. ${escapeHtml(
                pick(
                  locale,
                  "La subida a Dapa es de montaña: si llegas de noche, avísanos con tiempo y te guiamos.",
                  "The climb to Dapa is a mountain road: if you are arriving after dark, let us know in advance and we will guide you.",
                ),
              )}
            </p>
            <p style="margin:0 0 26px 0;font-family:${FONT};font-size:15px;line-height:24px;">
              <a href="${escapeHtml(contact.maps.url)}" style="color:${COLORS.brand};font-weight:600;text-decoration:underline;">${escapeHtml(pick(locale, "Abrir la ubicación en Google Maps", "Open the location in Google Maps"))}</a>
            </p>

${button(whatsappHref, pick(locale, "Escribirnos por WhatsApp", "Message us on WhatsApp"))}

            <p style="margin:22px 0 0 0;font-family:${FONT};font-size:14px;line-height:22px;color:${COLORS.inkMuted};text-align:center;">
              ${escapeHtml(
                pick(
                  locale,
                  `¿Necesitas cambiar o cancelar? Escríbenos al ${contact.phoneDisplay} con tu número de reserva.`,
                  `Need to change or cancel? Message us at ${contact.phoneDisplay} with your booking code.`,
                ),
              )}<br>
              ${escapeHtml(pick(locale, "Consulta la", "Read our"))} <a href="${escapeHtml(`${SITE.url}${localePath(locale, "/legal/cancelacion")}`)}" style="color:${COLORS.brand};text-decoration:underline;">${escapeHtml(pick(locale, "política de cancelación", "cancellation policy"))}</a>.
            </p>`;

  const text = [
    pick(
      locale,
      `Reserva confirmada en ${SITE.legalName}`,
      `Booking confirmed at ${SITE.legalName}`,
    ),
    "",
    pick(
      locale,
      `${firstName ? `${firstName}, te` : "Te"} esperamos en ${booking.accommodationName}. Tus fechas ya están bloqueadas.`,
      `${firstName ? `${firstName}, we` : "We"} look forward to seeing you at ${booking.accommodationName}. Your dates are now blocked.`,
    ),
    "",
    `${pick(locale, "Número de reserva", "Booking code")}: ${reference}`,
    `${pick(locale, "Alojamiento", "Accommodation")}: ${booking.accommodationName}`,
    `${pick(locale, "Entrada", "Check-in")}: ${formatLongDate(booking.checkIn, locale)}`,
    `${pick(locale, "Salida", "Check-out")}: ${formatLongDate(booking.checkOut, locale)}`,
    `${pick(locale, "Noches", "Nights")}: ${nightsLabel(booking, locale)}`,
    `${pick(locale, "Huéspedes", "Guests")}: ${formatGuests(booking.guests, locale)}`,
    `${pick(locale, "Total", "Total")}: ${formatCOP(booking.totalCop)} COP`,
    "",
    pick(locale, "Cómo llegar", "Getting here"),
    contact.addressLine,
    contact.maps.url,
    "",
    pick(
      locale,
      `¿Dudas, cambios o cancelaciones? Escríbenos por WhatsApp al ${contact.phoneDisplay} con tu número de reserva.`,
      `Questions, changes or cancellations? Message us on WhatsApp at ${contact.phoneDisplay} with your booking code.`,
    ),
    `${pick(locale, "Política de cancelación", "Cancellation policy")}: ${SITE.url}${localePath(locale, "/legal/cancelacion")}`,
    "",
    `${SITE.legalName} · ${contact.addressLine}`,
    SITE.url,
  ].join("\n");

  return {
    subject,
    html: shell({
      title: subject,
      preheader: `${booking.accommodationName} · ${formatLongDate(booking.checkIn, locale)} · ${nightsLabel(booking, locale)}`,
      body,
      contact,
      locale,
    }),
    text,
  };
}

/* ---------------------------------------------------------------------------
 * 3. Aviso interno al hotel — SIEMPRE en español
 * ------------------------------------------------------------------------- */

/**
 * Correo que recibe el equipo de La Maima cuando entra una solicitud.
 *
 * Aquí manda la operación, no el estilo: el asunto trae ya lo esencial (para
 * leerlo desde la notificación del teléfono, sin abrir nada) y el cuerpo trae
 * los datos de contacto del huésped, su nota y el enlace directo a la reserva
 * en el panel.
 *
 * Se queda en español pase lo que pase, e indica en qué idioma escribe el
 * huésped para que sepan en cuál contestarle.
 */
export function renderBookingNotification({
  booking,
  contact,
}: Context): RenderedEmail {
  const reference = displayReference(booking);
  const nights = nightsOf(booking);
  const nightsText = `${nights} ${nights === 1 ? "noche" : "noches"}`;

  const subject = `Nueva solicitud ${reference} · ${booking.accommodationName} · ${formatLongDate(booking.checkIn, "es")} → ${formatLongDate(booking.checkOut, "es")}`;

  const panelUrl = `${SITE.url}/admin/reservas/${booking.id}`;
  const guestPhone = booking.guestPhone?.trim() || null;
  const guestEmail = booking.guestEmail?.trim() || null;
  const notes = booking.guestNotes?.trim();

  const contactRows = [
    detailRow("Huésped", escapeHtml(booking.guestName)),
    guestEmail
      ? detailRow(
          "Correo",
          `<a href="mailto:${escapeHtml(guestEmail)}" style="color:${COLORS.brand};text-decoration:none;">${escapeHtml(guestEmail)}</a>`,
        )
      : detailRow("Correo", "—"),
    detailRow(
      "Teléfono",
      guestPhone
        ? `<a href="https://wa.me/${escapeHtml(guestPhone.replace(/\D/g, ""))}" style="color:${COLORS.brand};text-decoration:none;">${escapeHtml(guestPhone)}</a>`
        : "—",
    ),
    detailRow(
      "Idioma del huésped",
      booking.locale === "en" ? "Inglés — responder en inglés" : "Español",
      !notes,
    ),
    ...(notes ? [detailRow("Nota", escapeHtml(notes), true)] : []),
  ].join("");

  const deadline = booking.expiresAt
    ? formatDeadline(booking.expiresAt, "es")
    : null;

  const body = `
            <p style="margin:0 0 6px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${COLORS.brand};font-weight:600;">Aviso interno · ${escapeHtml(reference)}</p>
            <h1 style="margin:0 0 18px 0;font-family:${FONT};font-size:25px;line-height:32px;letter-spacing:-0.5px;color:${COLORS.ink};font-weight:600;">Nueva solicitud en ${escapeHtml(booking.accommodationName)}</h1>
${
  deadline
    ? callout(
        `Las fechas quedan apartadas hasta el <strong>${escapeHtml(deadline)}</strong>. Si nadie confirma antes, el hold caduca y las fechas se liberan solas.`,
      )
    : ""
}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.brandSoft};border-radius:16px;margin:0 0 16px 0;">
              <tr>
                <td style="padding:18px 20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${detailRow("Alojamiento", escapeHtml(booking.accommodationName))}
${detailRow("Entrada", escapeHtml(formatLongDate(booking.checkIn, "es")))}
${detailRow("Salida", escapeHtml(formatLongDate(booking.checkOut, "es")))}
${detailRow("Noches", escapeHtml(nightsText))}
${detailRow("Huéspedes", escapeHtml(formatGuests(booking.guests, "es")))}
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

${button(panelUrl, "Confirmar en el panel")}

            <p style="margin:22px 0 0 0;font-family:${FONT};font-size:13px;line-height:21px;color:${COLORS.inkMuted};text-align:center;">
              Al confirmarla, las fechas dejan de tener vencimiento y se bloquean también en Airbnb y Booking.
            </p>`;

  const text = [
    `Nueva solicitud en ${booking.accommodationName}`,
    "",
    `Código: ${reference}`,
    `Entrada: ${formatLongDate(booking.checkIn, "es")}`,
    `Salida: ${formatLongDate(booking.checkOut, "es")}`,
    `Noches: ${nightsText}`,
    `Huéspedes: ${formatGuests(booking.guests, "es")}`,
    `Total: ${formatCOP(booking.totalCop)} COP`,
    `Estado: ${booking.status ?? "pending"}`,
    `Origen: ${booking.source ?? "web"}`,
    ...(deadline ? [`El hold vence el ${deadline}.`] : []),
    "",
    "Contacto del huésped",
    `Nombre: ${booking.guestName}`,
    `Correo: ${guestEmail ?? "—"}`,
    `Teléfono: ${guestPhone ?? "—"}`,
    `Idioma: ${booking.locale === "en" ? "Inglés — responder en inglés" : "Español"}`,
    ...(notes ? [`Nota: ${notes}`] : []),
    "",
    `Abrir en el panel: ${panelUrl}`,
    "",
    `${SITE.legalName} · ${contact.addressLine}`,
  ].join("\n");

  return {
    subject,
    html: shell({
      title: subject,
      preheader: `${booking.guestName} · ${formatGuests(booking.guests, "es")} · ${formatCOP(booking.totalCop)} COP`,
      body,
      contact,
      // El aviso interno se lee en español siempre, aunque el huésped haya
      // navegado en inglés.
      locale: "es",
    }),
    text,
  };
}
