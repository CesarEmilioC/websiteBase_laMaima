/**
 * GET /api/ical/[slug]
 *
 * Exporta el calendario de ocupación de un alojamiento en formato iCalendar
 * (RFC 5545). Es la mitad SALIENTE de la sincronización con Airbnb y
 * Booking.com: se pega esta URL en el panel de cada plataforma
 * ("Importar calendario") y ellas dejan de vender las fechas que ya están
 * tomadas en La Maima.
 *
 *   https://<dominio>/api/ical/casa-maima
 *
 * La mitad ENTRANTE (leer los .ics que publican Airbnb y Booking) va aparte:
 * necesita las URL privadas de las cuentas del cliente, que todavía no
 * existen, y un cron de Vercel que las lea cada media hora. Esta ruta no
 * depende de nada de eso, así que se entrega ya.
 *
 * Privacidad: el archivo es una URL pública y no autenticada (así funciona el
 * mecanismo: la plataforma se suscribe sin credenciales). Por eso NO viaja un
 * solo dato del huésped — ni nombre, ni correo, ni importe, ni siquiera si el
 * hueco lo produce una reserva o un bloqueo de mantenimiento. Solo fechas y
 * un texto fijo: "Reservado" / "No disponible". El UID es el id de la fila,
 * que es un UUID opaco.
 *
 * Cacheado 5 minutos en el CDN: las plataformas consultan cada media hora o
 * cada hora, y ese colchón absorbe varias suscripciones sin castigar la base
 * de datos. Es lo bastante corto para que un bloqueo hecho desde el panel se
 * propague enseguida.
 */
import { buildCalendar, UID_DOMAIN, type CalendarEvent } from "@/lib/ical";
import { addDays, todayInBogota } from "@/lib/dates";
import { loadOccupancy } from "@/lib/occupancy";

/** Se calcula en cada petición; el CDN se encarga de la caché (ver headers). */
export const dynamic = "force-dynamic";

/** Ventana exportada: doce meses desde hoy, igual que la disponibilidad. */
const HORIZON_DAYS = 365;

/** Los slugs los genera el panel: minúsculas, dígitos y guiones. */
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;

/** Textos visibles del calendario. Fijos y sin datos personales. */
const SUMMARY = {
  booking: "Reservado",
  block: "No disponible",
} as const;

function fail(status: number, message: string) {
  return new Response(`${message}\n`, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!SLUG_PATTERN.test(slug)) {
    return fail(400, "Alojamiento no válido.");
  }

  const from = todayInBogota();
  const to = addDays(from, HORIZON_DAYS);

  const occupancy = await loadOccupancy(slug, from, to);

  if (!occupancy.ok) {
    if (occupancy.failure === "not-found") {
      return fail(404, "Alojamiento no encontrado.");
    }
    if (occupancy.failure === "unconfigured") {
      return fail(503, "El calendario no está disponible en este momento.");
    }
    return fail(502, "No pudimos generar el calendario.");
  }

  // Un VEVENT por fila (sin fundir tramos contiguos): así cada evento conserva
  // su UID y, cuando una reserva cambia de fechas, la plataforma actualiza ese
  // evento en vez de crear uno nuevo y dejar el viejo bloqueando de más.
  //
  // Las fechas se exportan tal como están en la base, sin recortarlas a la
  // ventana: un bloqueo que se extienda más allá de los doce meses debe seguir
  // bloqueando en Airbnb: pasarse de prudente no cuesta nada; quedarse corto
  // es una sobreventa.
  const events: CalendarEvent[] = occupancy.entries.map((entry) => ({
    uid: `${entry.id}@${UID_DOMAIN}`,
    start: entry.from,
    end: entry.to,
    summary: SUMMARY[entry.kind],
    stamp: entry.stamp,
  }));

  const body = buildCalendar({
    name: `La Maima — ${occupancy.name}`,
    events,
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // `inline`: si alguien abre la URL en el navegador se ve el texto, en vez
      // de descargarse un archivo que nadie pidió.
      "Content-Disposition": `inline; filename="la-maima-${slug}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
