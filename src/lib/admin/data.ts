/**
 * Consultas de lectura del panel de administración.
 *
 * Todas usan el cliente de servidor ligado a las cookies de la sesión, así que
 * viajan con el JWT del administrador y RLS las autoriza. A diferencia del
 * sitio público, aquí sí se ven las filas con `visible = false`.
 */
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isExpiringSoon, occupiesCalendar } from "@/lib/booking/holds";
import { createClient } from "@/lib/supabase/server";
import { parseDateRange, todayInBogota } from "./dates";
import {
  BOOKING_SOURCES,
  BOOKING_STATUSES,
  OCCUPYING_STATUSES,
  type AccommodationOption,
  type AdminAccommodation,
  type AdminBlockedDate,
  type AdminBooking,
  type AdminExperience,
  type BookingSource,
  type BookingStatus,
  type GalleryImage,
} from "./types";

/* ---------------------------------------------------------------------------
 * Normalizadores (jsonb llega como `unknown`)
 * ------------------------------------------------------------------------- */

function toGallery(value: unknown): GalleryImage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const { url, alt } = item as Record<string, unknown>;
    if (typeof url !== "string" || !url) return [];
    return [{ url, alt: typeof alt === "string" ? alt : "" }];
  });
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toStatus(value: unknown): BookingStatus {
  return BOOKING_STATUSES.includes(value as BookingStatus)
    ? (value as BookingStatus)
    : "pending";
}

function toSource(value: unknown): BookingSource {
  return BOOKING_SOURCES.includes(value as BookingSource)
    ? (value as BookingSource)
    : "manual";
}

/** El join de PostgREST puede llegar como objeto o como arreglo de uno. */
function joinedName(value: unknown): string | null {
  if (Array.isArray(value)) return joinedName(value[0]);
  if (typeof value !== "object" || value === null) return null;
  const { name } = value as Record<string, unknown>;
  return typeof name === "string" ? name : null;
}

/* ---------------------------------------------------------------------------
 * Columnas
 * ------------------------------------------------------------------------- */

const ACCOMMODATION_COLUMNS =
  "id, slug, name, short_description, short_description_en, description, description_en, capacity, price_per_night_cop, price_note, price_note_en, amenities, amenities_en, gallery, visible, sort_order, created_at, updated_at, extra_person_price_cop, extra_person_price_weekday_cop, breakfast_included, breakfast_price_cop, weekday_discount_pct, rate_note, rate_note_en";

const EXPERIENCE_COLUMNS =
  "id, slug, name, name_en, short_description, short_description_en, description, description_en, duration, duration_en, capacity, price_cop, price_note, price_note_en, gallery, visible, sort_order, created_at, updated_at";

const BOOKING_COLUMNS =
  "id, accommodation_id, guest_name, guest_email, guest_phone, check_in, check_out, guests, total_cop, status, source, payment_ref, booking_code, expires_at, notes, locale, created_at, updated_at, accommodations(name)";

/**
 * Cliente autenticado del panel. Va envuelto en `cache()` para que un mismo
 * render no cree un cliente nuevo por consulta.
 */
const adminClient = cache(async (): Promise<SupabaseClient> => createClient());

/* ---------------------------------------------------------------------------
 * Alojamientos
 * ------------------------------------------------------------------------- */

type RawRow = Record<string, unknown>;

function mapAccommodation(row: RawRow): AdminAccommodation {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    short_description: (row.short_description as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    capacity: Number(row.capacity),
    price_per_night_cop: Number(row.price_per_night_cop),
    price_note: (row.price_note as string | null) ?? null,
    amenities: toStringList(row.amenities),
    gallery: toGallery(row.gallery),
    visible: Boolean(row.visible),
    sort_order: Number(row.sort_order),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    extra_person_price_cop:
      row.extra_person_price_cop === null
        ? null
        : Number(row.extra_person_price_cop),
    extra_person_price_weekday_cop:
      row.extra_person_price_weekday_cop === null
        ? null
        : Number(row.extra_person_price_weekday_cop),
    breakfast_included: Boolean(row.breakfast_included),
    breakfast_price_cop:
      row.breakfast_price_cop === null ? null : Number(row.breakfast_price_cop),
    weekday_discount_pct:
      row.weekday_discount_pct === null
        ? null
        : Number(row.weekday_discount_pct),
    rate_note: (row.rate_note as string | null) ?? null,
    short_description_en: (row.short_description_en as string | null) ?? null,
    description_en: (row.description_en as string | null) ?? null,
    amenities_en: toStringList(row.amenities_en),
    price_note_en: (row.price_note_en as string | null) ?? null,
    rate_note_en: (row.rate_note_en as string | null) ?? null,
  };
}

export async function listAccommodations(): Promise<AdminAccommodation[]> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("accommodations")
    .select(ACCOMMODATION_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar los alojamientos: ${error.message}`);
  return (data ?? []).map((row) => mapAccommodation(row as RawRow));
}

export async function getAccommodation(
  id: string,
): Promise<AdminAccommodation | null> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("accommodations")
    .select(ACCOMMODATION_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar el alojamiento: ${error.message}`);
  return data ? mapAccommodation(data as RawRow) : null;
}

export async function listAccommodationOptions(): Promise<
  AccommodationOption[]
> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("accommodations")
    .select("id, name, price_per_night_cop, capacity")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar los alojamientos: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    price_per_night_cop: Number(row.price_per_night_cop),
    capacity: Number(row.capacity),
  }));
}

/* ---------------------------------------------------------------------------
 * Experiencias
 * ------------------------------------------------------------------------- */

function mapExperience(row: RawRow): AdminExperience {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    short_description: (row.short_description as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    duration: (row.duration as string | null) ?? null,
    capacity: row.capacity === null ? null : Number(row.capacity),
    price_cop: row.price_cop === null ? null : Number(row.price_cop),
    price_note: (row.price_note as string | null) ?? null,
    gallery: toGallery(row.gallery),
    visible: Boolean(row.visible),
    sort_order: Number(row.sort_order),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    name_en: (row.name_en as string | null) ?? null,
    short_description_en: (row.short_description_en as string | null) ?? null,
    description_en: (row.description_en as string | null) ?? null,
    duration_en: (row.duration_en as string | null) ?? null,
    price_note_en: (row.price_note_en as string | null) ?? null,
  };
}

export async function listExperiences(): Promise<AdminExperience[]> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("experiences")
    .select(EXPERIENCE_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar las experiencias: ${error.message}`);
  return (data ?? []).map((row) => mapExperience(row as RawRow));
}

export async function getExperience(id: string): Promise<AdminExperience | null> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("experiences")
    .select(EXPERIENCE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar la experiencia: ${error.message}`);
  return data ? mapExperience(data as RawRow) : null;
}

/* ---------------------------------------------------------------------------
 * Reservas
 * ------------------------------------------------------------------------- */

function mapBooking(row: RawRow): AdminBooking {
  return {
    id: String(row.id),
    accommodation_id: String(row.accommodation_id),
    guest_name: String(row.guest_name),
    guest_email: (row.guest_email as string | null) ?? null,
    guest_phone: (row.guest_phone as string | null) ?? null,
    check_in: String(row.check_in),
    check_out: String(row.check_out),
    guests: Number(row.guests),
    total_cop: Number(row.total_cop),
    status: toStatus(row.status),
    source: toSource(row.source),
    payment_ref: (row.payment_ref as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    accommodation_name: joinedName(row.accommodations),
    booking_code: (row.booking_code as string | null) ?? null,
    expires_at: (row.expires_at as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    locale: (row.locale as string | null) ?? null,
  };
}

export type BookingFilters = {
  status?: BookingStatus | "all";
  source?: BookingSource | "all";
  from?: string;
  to?: string;
  accommodationId?: string;
};

export async function listBookings(
  filters: BookingFilters = {},
): Promise<AdminBooking[]> {
  const supabase = await adminClient();
  let query = supabase.from("bookings").select(BOOKING_COLUMNS);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.source && filters.source !== "all") {
    query = query.eq("source", filters.source);
  }
  if (filters.accommodationId) {
    query = query.eq("accommodation_id", filters.accommodationId);
  }
  // El rango filtra por solape: se listan las reservas que TOCAN el periodo,
  // no solo las que empiezan dentro de él.
  if (filters.from) query = query.gte("check_out", filters.from);
  if (filters.to) query = query.lte("check_in", filters.to);

  const { data, error } = await query
    .order("check_in", { ascending: false })
    .limit(300);

  if (error) throw new Error(`No se pudieron cargar las reservas: ${error.message}`);
  return (data ?? []).map((row) => mapBooking(row as RawRow));
}

export async function getBooking(id: string): Promise<AdminBooking | null> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar la reserva: ${error.message}`);
  return data ? mapBooking(data as RawRow) : null;
}

/** Reservas que ocupan calendario a partir de hoy, en orden de llegada. */
export async function listUpcomingBookings(limit = 8): Promise<AdminBooking[]> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_COLUMNS)
    .in("status", OCCUPYING_STATUSES)
    .gte("check_out", todayInBogota())
    .order("check_in", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`No se pudieron cargar las reservas: ${error.message}`);
  // Se descartan los holds vencidos: siguen en 'pending' hasta el próximo
  // barrido, pero sus fechas ya están libres y anunciarlos como "próxima
  // llegada" sería mentir en la primera pantalla del panel.
  const now = new Date();
  return (data ?? [])
    .map((row) => mapBooking(row as RawRow))
    .filter((booking) => occupiesCalendar(booking, now));
}

/**
 * Reservas pendientes de confirmar, de la más urgente a la menos.
 *
 * Es la cola de trabajo real del panel. Ordena por vencimiento ascendente y
 * deja al final las que no vencen (las que registra el equipo a mano): esas
 * también hay que confirmarlas, pero no tienen reloj. Los holds ya caducados
 * se descartan — sus fechas están libres y anunciarlos como trabajo pendiente
 * sería mandar a alguien a confirmar una reserva que ya no existe.
 *
 * Cuenta lo mismo que `bookingsPending` de `getDashboardStats()`, a propósito:
 * dos números distintos para lo mismo en la misma pantalla se leen como un
 * error del panel.
 */
export async function listPendingRequests(limit = 20): Promise<AdminBooking[]> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_COLUMNS)
    .eq("status", "pending")
    .order("expires_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw new Error(`No se pudieron cargar las solicitudes: ${error.message}`);

  const now = new Date();
  return (data ?? [])
    .map((row) => mapBooking(row as RawRow))
    .filter((booking) => occupiesCalendar(booking, now));
}

export async function listRecentBookings(limit = 6): Promise<AdminBooking[]> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`No se pudieron cargar las reservas: ${error.message}`);
  return (data ?? []).map((row) => mapBooking(row as RawRow));
}

/* ---------------------------------------------------------------------------
 * Bloqueos de fechas
 * ------------------------------------------------------------------------- */

function mapBlockedDate(row: RawRow): AdminBlockedDate | null {
  const parsed = parseDateRange(row.date_range);
  if (!parsed) return null;
  return {
    id: String(row.id),
    accommodation_id: String(row.accommodation_id),
    date_range: String(row.date_range),
    start: parsed.start,
    end: parsed.end,
    reason: (row.reason as string | null) ?? null,
    created_at: String(row.created_at),
    accommodation_name: joinedName(row.accommodations),
  };
}

export async function listBlockedDates(options?: {
  accommodationId?: string;
  onlyUpcoming?: boolean;
  limit?: number;
}): Promise<AdminBlockedDate[]> {
  const supabase = await adminClient();
  let query = supabase
    .from("blocked_dates")
    .select(
      "id, accommodation_id, date_range, reason, created_at, accommodations(name)",
    );

  if (options?.accommodationId) {
    query = query.eq("accommodation_id", options.accommodationId);
  }

  const { data, error } = await query.limit(options?.limit ?? 400);
  if (error) throw new Error(`No se pudieron cargar los bloqueos: ${error.message}`);

  // `daterange` no se puede ordenar desde PostgREST de forma cómoda, así que se
  // ordena en memoria por la fecha de inicio ya parseada.
  const rows = (data ?? [])
    .map((row) => mapBlockedDate(row as RawRow))
    .filter((row): row is AdminBlockedDate => row !== null)
    .sort((a, b) => a.start.localeCompare(b.start));

  if (options?.onlyUpcoming) {
    const today = todayInBogota();
    return rows.filter((row) => row.end > today);
  }
  return rows;
}

/* ---------------------------------------------------------------------------
 * Contenido del sitio
 * ------------------------------------------------------------------------- */

export type SiteContentMap = Record<string, Record<string, unknown>>;

/**
 * Contenido editable del sitio, en los dos idiomas.
 *
 * `es` es la fila completa (`site_content.value`) y `en` el espejo PARCIAL
 * (`value_en`), que solo lleva las claves de texto traducidas. El formulario
 * pinta cada campo inglés con lo que haya en `en` —vacío si no hay— y nunca
 * rellena el hueco con el español: si el panel mostrara el texto español dentro
 * del campo inglés, guardar sin tocar nada lo daría por traducido.
 */
export async function getSiteContentMap(): Promise<{
  es: SiteContentMap;
  en: SiteContentMap;
}> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("key, value, value_en");

  if (error) throw new Error(`No se pudo cargar el contenido: ${error.message}`);

  const es: SiteContentMap = {};
  const en: SiteContentMap = {};

  const asRecord = (value: unknown): Record<string, unknown> =>
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  for (const raw of data ?? []) {
    const row = raw as RawRow;
    const key = String(row.key);
    es[key] = asRecord(row.value);
    en[key] = asRecord(row.value_en);
  }

  return { es, en };
}

/* ---------------------------------------------------------------------------
 * Resumen del panel
 * ------------------------------------------------------------------------- */

export type DashboardStats = {
  accommodationsTotal: number;
  accommodationsVisible: number;
  experiencesTotal: number;
  experiencesVisible: number;
  /** Solicitudes en 'pending' con el hold todavía vivo. */
  bookingsPending: number;
  /** De esas, las que vencen en menos de 12 horas: hay que atenderlas hoy. */
  bookingsExpiringSoon: number;
  bookingsUpcoming: number;
  blocksUpcoming: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await adminClient();
  const today = todayInBogota();

  const [accommodations, experiences, pending, upcoming, blocks] =
    await Promise.all([
      supabase.from("accommodations").select("visible"),
      supabase.from("experiences").select("visible"),
      /* Los pendientes se cuentan trayendo las filas y no con `count`: la
         cuenta tiene que excluir los holds vencidos, y esa condición
         (`expires_at < now()` combinada con el estado) no se expresa como un
         filtro de PostgREST sin duplicar la regla. Son unas pocas filas. */
      supabase
        .from("bookings")
        .select("status, expires_at")
        .eq("status", "pending"),
      supabase
        .from("bookings")
        .select("status, expires_at")
        .in("status", OCCUPYING_STATUSES)
        .gte("check_out", today),
      listBlockedDates({ onlyUpcoming: true }),
    ]);

  const accRows = (accommodations.data ?? []) as { visible: boolean }[];
  const expRows = (experiences.data ?? []) as { visible: boolean }[];

  const now = new Date();
  type HoldRow = { status: string; expires_at: string | null };
  const pendingRows = (pending.data ?? []) as HoldRow[];
  const upcomingRows = (upcoming.data ?? []) as HoldRow[];

  const livePending = pendingRows.filter((row) => occupiesCalendar(row, now));

  return {
    accommodationsTotal: accRows.length,
    accommodationsVisible: accRows.filter((row) => row.visible).length,
    experiencesTotal: expRows.length,
    experiencesVisible: expRows.filter((row) => row.visible).length,
    bookingsPending: livePending.length,
    bookingsExpiringSoon: livePending.filter((row) =>
      isExpiringSoon(row.status, row.expires_at, now),
    ).length,
    bookingsUpcoming: upcomingRows.filter((row) => occupiesCalendar(row, now))
      .length,
    blocksUpcoming: blocks.length,
  };
}
