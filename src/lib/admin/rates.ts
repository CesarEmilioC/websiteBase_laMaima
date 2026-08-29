/**
 * Lectura de las tablas de tarifas para el panel: tramos por ocupación,
 * planes especiales, festivos y estancias mínimas.
 *
 * Vive aparte de `@/lib/admin/data` porque son cuatro tablas que solo usa la
 * sección `/admin/tarifas`, y porque aquí sí interesan columnas que el sitio
 * público ignora (`id`, `active`, `sort`) para poder editarlas.
 *
 * Todas las consultas viajan con el JWT del administrador (cliente de servidor
 * ligado a las cookies), así que RLS las autoriza igual que el resto del panel.
 */
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { todayInBogota } from "./dates";
import { TIER_DAY_TYPES, type MinStayRuleType } from "./types";
import { comparePlans, type TierDayType } from "@/lib/pricing";

/* ---------------------------------------------------------------------------
 * Tipos
 * ------------------------------------------------------------------------- */

export type AdminRateTier = {
  id: string;
  accommodation_id: string;
  guests: number;
  price_cop: number;
  day_type: TierDayType;
  sort: number;
};

export type AdminRatePlan = {
  id: string;
  /** `null` = el plan vale para todos los alojamientos. */
  accommodation_id: string | null;
  accommodation_name: string | null;
  name: string;
  description: string | null;
  date_from: string;
  date_to: string;
  price_per_night_cop: number | null;
  guests_included: number | null;
  active: boolean;
  sort: number;
};

export type AdminHoliday = {
  date: string;
  name: string;
  /** Columna generada en Postgres: el festivo cae en lunes y arma puente. */
  is_bridge: boolean;
};

export type AdminMinStayRule = {
  id: string;
  accommodation_id: string;
  accommodation_name: string | null;
  label: string;
  rule_type: MinStayRuleType;
  date_from: string | null;
  date_to: string | null;
  min_nights: number;
  sort: number;
};

/* ---------------------------------------------------------------------------
 * Consultas
 * ------------------------------------------------------------------------- */

const adminClient = cache(async (): Promise<SupabaseClient> => createClient());

type RawRow = Record<string, unknown>;

function toDayType(value: unknown): TierDayType {
  return TIER_DAY_TYPES.includes(value as TierDayType)
    ? (value as TierDayType)
    : "any";
}

/** El join de PostgREST puede llegar como objeto o como arreglo de uno. */
function joinedName(value: unknown): string | null {
  if (Array.isArray(value)) return joinedName(value[0]);
  if (typeof value !== "object" || value === null) return null;
  const { name } = value as Record<string, unknown>;
  return typeof name === "string" ? name : null;
}

/** Todos los tramos, agrupados por alojamiento y ya ordenados para la tabla. */
export async function listRateTiersByAccommodation(): Promise<
  Map<string, AdminRateTier[]>
> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("rate_tiers")
    .select("id, accommodation_id, guests, price_cop, day_type, sort")
    .order("day_type", { ascending: true })
    .order("guests", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar las tarifas: ${error.message}`);
  }

  const grouped = new Map<string, AdminRateTier[]>();
  for (const raw of data ?? []) {
    const row = raw as RawRow;
    const tier: AdminRateTier = {
      id: String(row.id),
      accommodation_id: String(row.accommodation_id),
      guests: Number(row.guests),
      price_cop: Number(row.price_cop),
      day_type: toDayType(row.day_type),
      sort: Number(row.sort ?? 0),
    };
    const list = grouped.get(tier.accommodation_id) ?? [];
    list.push(tier);
    grouped.set(tier.accommodation_id, list);
  }
  return grouped;
}

export async function listRatePlans(): Promise<AdminRatePlan[]> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("rate_plans")
    .select(
      "id, accommodation_id, name, description, date_from, date_to, price_per_night_cop, guests_included, active, sort, accommodations(name)",
    )
    .order("sort", { ascending: true })
    .order("date_from", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar los planes: ${error.message}`);
  }

  return (data ?? []).map((raw) => {
    const row = raw as RawRow;
    return {
      id: String(row.id),
      accommodation_id: (row.accommodation_id as string | null) ?? null,
      accommodation_name: joinedName(row.accommodations),
      name: String(row.name),
      description: (row.description as string | null) ?? null,
      date_from: String(row.date_from),
      date_to: String(row.date_to),
      price_per_night_cop:
        row.price_per_night_cop === null ? null : Number(row.price_per_night_cop),
      guests_included:
        row.guests_included === null ? null : Number(row.guests_included),
      active: Boolean(row.active),
      sort: Number(row.sort ?? 0),
    };
  });
}

export async function getRatePlan(id: string): Promise<AdminRatePlan | null> {
  const plans = await listRatePlans();
  return plans.find((plan) => plan.id === id) ?? null;
}

/**
 * Festivos de hoy en adelante (con un año de margen hacia atrás para que la
 * lista no arranque en blanco cada 1 de enero).
 */
export async function listHolidays(): Promise<AdminHoliday[]> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("holidays")
    .select("holiday_date, name, is_bridge")
    .gte("holiday_date", `${Number(todayInBogota().slice(0, 4)) - 1}-01-01`)
    .order("holiday_date", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar los festivos: ${error.message}`);
  }

  return (data ?? []).map((raw) => {
    const row = raw as RawRow;
    return {
      date: String(row.holiday_date),
      name: String(row.name),
      is_bridge: Boolean(row.is_bridge),
    };
  });
}

export async function listMinStayRules(): Promise<AdminMinStayRule[]> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("min_stay_rules")
    .select(
      "id, accommodation_id, label, rule_type, date_from, date_to, min_nights, sort, accommodations(name)",
    )
    .order("sort", { ascending: true });

  if (error) {
    throw new Error(
      `No se pudieron cargar las estancias mínimas: ${error.message}`,
    );
  }

  return (data ?? []).map((raw) => {
    const row = raw as RawRow;
    return {
      id: String(row.id),
      accommodation_id: String(row.accommodation_id),
      accommodation_name: joinedName(row.accommodations),
      label: String(row.label),
      rule_type: (row.rule_type === "date_range"
        ? "date_range"
        : "holiday_bridge") as MinStayRuleType,
      date_from: (row.date_from as string | null) ?? null,
      date_to: (row.date_to as string | null) ?? null,
      min_nights: Number(row.min_nights),
      sort: Number(row.sort ?? 0),
    };
  });
}

/* ---------------------------------------------------------------------------
 * Estado de un plan
 * ------------------------------------------------------------------------- */

export type PlanStatus = "vigente" | "proximo" | "pasado" | "inactivo";

/**
 * En qué situación está un plan HOY, que es lo que la administradora quiere
 * ver de un vistazo en la lista. Un plan desactivado se anuncia como tal
 * aunque sus fechas estén en curso: no cobra nada.
 */
export function planStatus(
  plan: AdminRatePlan,
  today = todayInBogota(),
): PlanStatus {
  if (!plan.active) return "inactivo";
  if (plan.date_to < today) return "pasado";
  if (plan.date_from > today) return "proximo";
  return "vigente";
}

export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  vigente: "En curso",
  proximo: "Próximo",
  pasado: "Terminado",
  inactivo: "Desactivado",
};

/* ---------------------------------------------------------------------------
 * Solapes entre planes
 * ------------------------------------------------------------------------- */

export type PlanOverlap = {
  /** El que cobra según la regla de precedencia. */
  winner: AdminRatePlan;
  /** El que queda tapado en las noches comunes. */
  loser: AdminRatePlan;
  /** Noches en las que se pisan, ambos extremos inclusive. */
  from: string;
  to: string;
};

/** Un plan del panel visto por el motor de tarifas. */
function asEnginePlan(plan: AdminRatePlan) {
  return {
    name: plan.name,
    description: plan.description,
    date_from: plan.date_from,
    date_to: plan.date_to,
    price_per_night_cop: plan.price_per_night_cop,
    guests_included: plan.guests_included,
    sort: plan.sort,
    appliesToAll: plan.accommodation_id === null,
  };
}

/**
 * Parejas de planes ACTIVOS que se pisan en fechas y pueden llegar a la misma
 * cabaña (dos del mismo alojamiento, o uno de ellos "para todos").
 *
 * Solaparlos no es un error —a veces es a propósito— así que esto solo sirve
 * para avisar en el panel y decir cuál va a cobrar.
 */
export function planOverlaps(plans: AdminRatePlan[]): PlanOverlap[] {
  const active = plans.filter((plan) => plan.active);
  const overlaps: PlanOverlap[] = [];

  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const a = active[i];
      const b = active[j];

      const sameScope =
        a.accommodation_id === b.accommodation_id ||
        a.accommodation_id === null ||
        b.accommodation_id === null;
      if (!sameScope) continue;
      if (a.date_from > b.date_to || b.date_from > a.date_to) continue;

      const aWins = comparePlans(asEnginePlan(a), asEnginePlan(b)) <= 0;
      overlaps.push({
        winner: aWins ? a : b,
        loser: aWins ? b : a,
        from: a.date_from > b.date_from ? a.date_from : b.date_from,
        to: a.date_to < b.date_to ? a.date_to : b.date_to,
      });
    }
  }
  return overlaps;
}
