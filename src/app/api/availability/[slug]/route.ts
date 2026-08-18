/**
 * GET /api/availability/[slug]
 *
 * Devuelve los tramos de fechas OCUPADAS de un alojamiento para los próximos
 * doce meses, y nada más:
 *
 *   { "slug": "casa-maima",
 *     "from": "2026-08-18", "to": "2027-08-18",
 *     "occupied": [{ "from": "2026-09-04", "to": "2026-09-07" }] }
 *
 * Por qué existe este endpoint en vez de leer los datos en la página:
 *
 *   1. PRIVACIDAD. `bookings` guarda nombre, correo y teléfono del huésped, y
 *      RLS se la niega entera al rol `anon` (ver supabase/schema.sql). Aquí se
 *      lee con la clave de servicio, pero solo las columnas de fecha, y se
 *      publica el resultado ya anonimizado y fundido: un hueco en el calendario
 *      no dice quién lo ocupa ni por qué.
 *   2. FRESCURA. Las páginas de alojamiento son estáticas (SSG + ISR de una
 *      hora). Una disponibilidad de hace una hora provocaría solicitudes sobre
 *      fechas ya vendidas, así que el widget la pide aparte al montarse y esta
 *      ruta responde siempre sin caché.
 *
 * El widget público NO escribe nada: mientras no esté la pasarela de pagos, la
 * solicitud sale por WhatsApp y es el equipo quien registra la reserva desde el
 * panel. Así la base de datos queda limpia y sustituir el último paso por el
 * checkout de Wompi es un cambio quirúrgico.
 */
import { NextResponse } from "next/server";

import {
  clampRange,
  mergeRanges,
  type AvailabilityResponse,
} from "@/lib/availability";
import { addDays, todayInBogota } from "@/lib/dates";
import { loadOccupancy } from "@/lib/occupancy";

/** La disponibilidad se calcula en cada petición: nunca se cachea. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Ventana publicada: doce meses desde hoy. */
const HORIZON_DAYS = 365;

/** Los slugs los genera el panel: minúsculas, dígitos y guiones. */
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;

const NO_STORE = { "Cache-Control": "no-store" } as const;

function fail(status: number, message: string) {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE });
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

  // La consulta vive en `@/lib/occupancy` y la comparte con el exportador iCal:
  // el navegador y Airbnb tienen que ver exactamente las mismas fechas tomadas.
  const occupancy = await loadOccupancy(slug, from, to);

  if (!occupancy.ok) {
    if (occupancy.failure === "not-found") {
      return fail(404, "Alojamiento no encontrado.");
    }
    if (occupancy.failure === "unconfigured") {
      // Sin clave de servicio no se puede leer el calendario. Se avisa en claro
      // (el widget muestra su mensaje de error y ofrece reintentar) en lugar de
      // devolver un calendario vacío, que invitaría a reservar a ciegas.
      return fail(503, "La disponibilidad no está disponible en este momento.");
    }
    return fail(502, "No pudimos consultar la disponibilidad.");
  }

  // Los tramos se recortan a la ventana publicada y se funden: al navegador
  // solo llegan rangos anónimos, sin rastro de qué fila los produjo.
  const occupied = mergeRanges(
    occupancy.entries.flatMap((entry) => {
      const clamped = clampRange(entry, from, to);
      return clamped ? [clamped] : [];
    }),
  );

  const body: AvailabilityResponse = { slug, from, to, occupied };

  return NextResponse.json(body, { headers: NO_STORE });
}
