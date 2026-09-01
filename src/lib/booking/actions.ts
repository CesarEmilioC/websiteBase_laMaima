"use server";

/**
 * Server Actions del motor de reservas público.
 *
 * =============================================================================
 * PUNTO DE ENGANCHE DE WOMPI  —  léase antes de tocar nada de aquí
 * =============================================================================
 * Hoy el flujo es: elegir fechas -> datos del huésped -> `createBookingRequest`
 * crea la reserva `pending` con un hold de 48 horas -> el equipo la confirma a
 * mano desde el panel.
 *
 * Cuando entre la pasarela, el cambio es UNO y va exactamente entre las dos
 * acciones que este archivo expone:
 *
 *   1. `quoteBookingRequest()` — valida fechas, re-verifica disponibilidad y
 *      calcula el precio EN EL SERVIDOR. No escribe nada. Ya está lista para
 *      ser el paso previo al cobro: es la que produce el importe con el que se
 *      abrirá la transacción de Wompi.
 *
 *   2. [AQUÍ VA EL COBRO]  ->  crear la transacción en Wompi con el total que
 *      devolvió (1), redirigir al checkout, y esperar el webhook.
 *
 *   3. `createBookingRequest()` — crea la fila. Hoy la crea `pending` con
 *      `expires_at` a 48 h y con `source: 'web'`; con pasarela pasará a
 *      crearse `pending` **al iniciar el pago** (con el hold acortado a lo que
 *      dure la sesión de checkout, no 48 h) y a subir a `paid` desde el
 *      webhook, que además guardará `payment_ref`.
 *
 * Lo que NO habrá que tocar cuando llegue ese día: la validación del huésped,
 * el recálculo del precio, el barrido de holds, la generación del código, el
 * mapeo del error de solape y los correos. Por eso están todos fuera de la
 * acción, en módulos propios.
 *
 * =============================================================================
 * INVARIANTE: EL TOTAL NO SE ACEPTA DEL CLIENTE
 * =============================================================================
 * El widget calcula un precio para enseñarlo mientras se mueven las fechas,
 * pero ese número no viaja al servidor y no entra jamás en la base de datos.
 * Aquí se recalcula desde cero con `@/lib/pricing` y las tarifas que lee el
 * propio servidor. Confiar en el total del navegador sería publicar un campo
 * de precio editable con las herramientas de desarrollo.
 */

import { getAccommodationBySlug, getRateConfig } from "@/lib/content";
import { addDays, isIsoDate, nightsBetween, todayInBogota } from "@/lib/dates";
import { sendBookingNotification, sendBookingRequestReceived } from "@/lib/email";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { breakfastLabel, quote } from "@/lib/pricing";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

import { insertBookingWithCode, rangeIsTaken } from "./db";
import { holdExpiresAt } from "./holds";
import { looksLikeBot, validateGuest } from "./guest";
import type {
  BookingFailure,
  BookingQuote,
  BookingQuoteInput,
  BookingRequestInput,
  CreateBookingResult,
  QuoteBookingResult,
} from "./result";
import { releaseExpiredHolds } from "./sweep";
import { allowBookingRequest } from "./throttle";

/** Los slugs los genera el panel: minúsculas, dígitos y guiones. */
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;

/** Mismo horizonte que publica el calendario: doce meses. */
const HORIZON_DAYS = 365;

/* ---------------------------------------------------------------------------
 * Paso común: validar la estadía y ponerle precio
 * ------------------------------------------------------------------------- */

type Prepared =
  | {
      ok: true;
      accommodationId: string;
      accommodationName: string;
      nights: number;
      totalCop: number;
      quote: BookingQuote;
    }
  | { ok: false; failure: BookingFailure; detail?: string };

/**
 * Comprueba que la estadía tenga sentido y calcula lo que cuesta.
 *
 * NO toca la base de datos de reservas: solo lee catálogo (alojamiento,
 * tarifas, festivos). La disponibilidad se comprueba después, porque es lo
 * único que puede cambiar entre una llamada y la siguiente.
 *
 * Sobre la caché: las tarifas se leen por `@/lib/content`, que las guarda una
 * hora en la Data Cache de Next. Es catálogo —precios, temporadas, festivos—
 * y cambia poco; además es EXACTAMENTE la misma tabla con la que se renderizó
 * la ficha, así que el total del servidor y el que vio el huésped coinciden.
 * La disponibilidad, que sí es volátil, no pasa por ahí en ningún momento.
 */
async function prepareStay(
  slug: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  locale: Locale,
): Promise<Prepared> {
  if (!SLUG_PATTERN.test(slug)) return { ok: false, failure: "not-found" };

  if (!isIsoDate(checkIn) || !isIsoDate(checkOut)) {
    return { ok: false, failure: "invalid-dates" };
  }

  const today = todayInBogota();
  const horizon = addDays(today, HORIZON_DAYS);

  // Las tres cosas que tienen que cumplirse siempre: al menos una noche, nada
  // en el pasado y nada más allá del calendario publicado.
  if (nightsBetween(checkIn, checkOut) < 1) {
    return { ok: false, failure: "invalid-dates" };
  }
  if (checkIn < today || checkOut > horizon) {
    return { ok: false, failure: "invalid-dates" };
  }

  if (!Number.isInteger(guests) || guests < 1) {
    return { ok: false, failure: "invalid-dates" };
  }

  const accommodation = await getAccommodationBySlug(slug, locale);
  if (!accommodation) return { ok: false, failure: "not-found" };

  if (guests > accommodation.capacity) {
    return { ok: false, failure: "over-capacity" };
  }

  const rates = await getRateConfig(accommodation, locale);
  const estimate = quote(rates, checkIn, checkOut, guests, locale);

  // La estancia mínima trae su propia frase ya traducida (la compone
  // `minStayFor()` con el rótulo de la temporada, que vive en la base).
  if (estimate.minStay) {
    return {
      ok: false,
      failure: "min-stay",
      detail: estimate.minStay.message,
    };
  }

  return {
    ok: true,
    accommodationId: accommodation.id,
    accommodationName: accommodation.name,
    nights: estimate.nights,
    totalCop: estimate.totalCop,
    quote: {
      accommodationName: accommodation.name,
      checkIn,
      checkOut,
      nights: estimate.nights,
      guests,
      totalCop: estimate.totalCop,
      lines: estimate.lines.map((line, index) => ({
        key: `${index}-${line.unitCop}-${line.dayType}`,
        label: line.label,
        detail: line.detail,
        subtotalCop: line.subtotalCop,
      })),
      breakfast: breakfastLabel(rates, locale),
    },
  };
}

/* ---------------------------------------------------------------------------
 * 1. Cotizar (sin escribir nada)
 * ------------------------------------------------------------------------- */

/**
 * Verifica la estadía contra el servidor y devuelve el precio.
 *
 * La llama el widget al pasar del calendario al formulario de datos: así, si
 * alguien se quedó con esas fechas mientras se elegían, el huésped se entera
 * ANTES de escribir su nombre y su teléfono, no después.
 *
 * También es el punto donde se enganchará el cobro de Wompi (ver la cabecera).
 */
export async function quoteBookingRequest(
  input: BookingQuoteInput,
): Promise<QuoteBookingResult> {
  const locale: Locale = isLocale(input.locale) ? input.locale : "es";

  const prepared = await prepareStay(
    String(input.slug ?? ""),
    String(input.checkIn ?? ""),
    String(input.checkOut ?? ""),
    Number(input.guests),
    locale,
  );

  if (!prepared.ok) {
    return { ok: false, failure: prepared.failure, detail: prepared.detail };
  }

  if (!hasServiceRoleKey()) {
    return { ok: false, failure: "unconfigured" };
  }

  const supabase = createAdminClient();
  const taken = await rangeIsTaken(
    supabase,
    prepared.accommodationId,
    prepared.quote.checkIn,
    prepared.quote.checkOut,
  );

  if (taken) return { ok: false, failure: "dates-taken" };

  return { ok: true, quote: prepared.quote };
}

/* ---------------------------------------------------------------------------
 * 2. Crear la solicitud
 * ------------------------------------------------------------------------- */

/**
 * Crea la reserva `pending` con su código y su hold de 48 horas.
 *
 * El orden de los pasos NO es arbitrario:
 *
 *   1. Cebo anti-bot. Antes que nada: no se gasta ni una consulta.
 *   2. Validación del formulario. Antes del freno de peticiones, para no
 *      gastarle la cuota a quien solo escribió mal su correo.
 *   3. Freno de peticiones.
 *   4. Fechas, alojamiento y PRECIO calculado en el servidor.
 *   5. **Barrido de holds vencidos del alojamiento.** Imprescindible antes de
 *      insertar: la restricción anti-solape no puede leer `now()` y sin esto
 *      rechazaría fechas que en realidad están libres.
 *   6. Re-verificación de disponibilidad.
 *   7. INSERT. La restricción de Postgres es el árbitro final: si dos personas
 *      pidieron lo mismo a la vez, la segunda recibe `dates-taken`.
 *   8. Correos. Después de tener la fila, y sin poder tumbarla si fallan.
 */
export async function createBookingRequest(
  input: BookingRequestInput,
): Promise<CreateBookingResult> {
  const locale: Locale = isLocale(input.locale) ? input.locale : "es";

  /* 1. Cebo. No se le dice al bot que cayó: se le devuelve el mismo mensaje
        genérico que a quien insiste demasiado, y no se escribe nada. */
  if (looksLikeBot(input.company)) {
    return { ok: false, kind: "booking", failure: "rate-limited" };
  }

  /* 2. Datos del huésped. */
  const guest = validateGuest({
    name: String(input.name ?? ""),
    email: String(input.email ?? ""),
    phone: String(input.phone ?? ""),
    notes: String(input.notes ?? ""),
    policyAccepted: Boolean(input.policyAccepted),
  });

  if (!guest.ok) {
    return { ok: false, kind: "fields", errors: guest.errors };
  }

  /* 3. Freno. */
  const { allowed } = await allowBookingRequest();
  if (!allowed) {
    return { ok: false, kind: "booking", failure: "rate-limited" };
  }

  /* 4. Fechas y precio, calculados aquí y no aceptados del cliente. */
  const prepared = await prepareStay(
    String(input.slug ?? ""),
    String(input.checkIn ?? ""),
    String(input.checkOut ?? ""),
    Number(input.guests),
    locale,
  );

  if (!prepared.ok) {
    return {
      ok: false,
      kind: "booking",
      failure: prepared.failure,
      detail: prepared.detail,
    };
  }

  if (!hasServiceRoleKey()) {
    console.error(
      "[reservas] falta SUPABASE_SERVICE_ROLE_KEY: no se puede crear la solicitud.",
    );
    return { ok: false, kind: "booking", failure: "unconfigured" };
  }

  const supabase = createAdminClient();
  const { checkIn, checkOut, guests } = prepared.quote;

  /* 5. Holds vencidos fuera del camino. */
  await releaseExpiredHolds(supabase, prepared.accommodationId);

  /* 6. ¿Siguen libres las fechas? */
  if (await rangeIsTaken(supabase, prepared.accommodationId, checkIn, checkOut)) {
    return { ok: false, kind: "booking", failure: "dates-taken" };
  }

  /* 7. INSERT con código único. */
  const expiresAt = holdExpiresAt();

  const outcome = await insertBookingWithCode(supabase, {
    accommodation_id: prepared.accommodationId,
    guest_name: guest.value.name,
    guest_email: guest.value.email,
    guest_phone: guest.value.phone,
    check_in: checkIn,
    check_out: checkOut,
    guests,
    total_cop: prepared.totalCop,
    status: "pending",
    source: "web",
    notes: guest.value.notes,
    locale,
    expires_at: expiresAt.toISOString(),
  });

  if (!outcome.ok) {
    return { ok: false, kind: "booking", failure: outcome.failure };
  }

  /* 8. Correos. Envueltos porque un fallo de Resend no puede deshacer una
        reserva que ya existe: el huésped tiene su código en pantalla y el
        equipo la ve en el panel aunque el correo no salga. Con la clave de
        Resend sin configurar —la fase actual— las dos funciones registran en
        consola lo que habrían enviado y devuelven sin error. */
  const emailData = {
    id: outcome.id,
    bookingCode: outcome.code,
    accommodationName: prepared.accommodationName,
    checkIn,
    checkOut,
    guests,
    totalCop: prepared.totalCop,
    guestName: guest.value.name,
    guestEmail: guest.value.email,
    guestPhone: guest.value.phone,
    guestNotes: guest.value.notes,
    status: "pending",
    source: "web",
    locale,
    expiresAt: expiresAt.toISOString(),
  };

  try {
    await Promise.all([
      sendBookingRequestReceived(emailData),
      sendBookingNotification(emailData),
    ]);
  } catch (error) {
    console.error("[reservas] fallo al enviar los correos de la solicitud:", error);
  }

  return {
    ok: true,
    receipt: {
      code: outcome.code,
      accommodationName: prepared.accommodationName,
      checkIn,
      checkOut,
      nights: prepared.nights,
      guests,
      totalCop: prepared.totalCop,
      expiresAt: expiresAt.toISOString(),
      guestName: guest.value.name,
      guestEmail: guest.value.email,
    },
  };
}
