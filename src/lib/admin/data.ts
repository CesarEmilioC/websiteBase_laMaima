/**
 * Consultas de lectura del panel de administración.
 *
 * Todas usan el cliente de servidor ligado a las cookies de la sesión, así que
 * viajan con el JWT del administrador y RLS las autoriza. A diferencia del
 * sitio público, aquí sí se ven las filas con `visible = false`.
 */
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { parseDateRange, todayInBogota } from "./dates";
import {
  BOOKING_SOURCES,
  BOOKING_STATUSES,
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
  "id, slug, name, short_description, description, capacity, price_per_night_cop, price_note, amenities, gallery, visible, sort_order, created_at, updated_at";

const EXPERIENCE_COLUMNS =
  "id, slug, name, short_description, description, duration, capacity, price_cop, price_note, gallery, visible, sort_order, created_at, updated_at";

const BOOKING_COLUMNS =
  "id, accommodation_id, guest_name, guest_email, guest_phone, check_in, check_out, guests, total_cop, status, source, payment_ref, created_at, updated_at, accommodations(name)";

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
    .in("status", ["pending", "paid", "external"])
    .gte("check_out", todayInBogota())
    .order("check_in", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`No se pudieron cargar las reservas: ${error.message}`);
  return (data ?? []).map((row) => mapBooking(row as RawRow));
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

export async function getSiteContentMap(): Promise<SiteContentMap> {
  const supabase = await adminClient();
  const { data, error } = await supabase.from("site_content").select("key, value");

  if (error) throw new Error(`No se pudo cargar el contenido: ${error.message}`);

  const map: SiteContentMap = {};
  for (const row of data ?? []) {
    const value = (row as RawRow).value;
    map[String((row as RawRow).key)] =
      typeof value === "object" && value !== null
        ? (value as Record<string, unknown>)
        : {};
  }
  return map;
}

/* ---------------------------------------------------------------------------
 * Resumen del panel
 * ------------------------------------------------------------------------- */

export type DashboardStats = {
  accommodationsTotal: number;
  accommodationsVisible: number;
  experiencesTotal: number;
  experiencesVisible: number;
  bookingsPending: number;
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
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "paid", "external"])
        .gte("check_out", today),
      listBlockedDates({ onlyUpcoming: true }),
    ]);

  const accRows = (accommodations.data ?? []) as { visible: boolean }[];
  const expRows = (experiences.data ?? []) as { visible: boolean }[];

  return {
    accommodationsTotal: accRows.length,
    accommodationsVisible: accRows.filter((row) => row.visible).length,
    experiencesTotal: expRows.length,
    experiencesVisible: expRows.filter((row) => row.visible).length,
    bookingsPending: pending.count ?? 0,
    bookingsUpcoming: upcoming.count ?? 0,
    blocksUpcoming: blocks.length,
  };
}
