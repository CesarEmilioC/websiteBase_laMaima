"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin/auth";
import { isIsoDate, nightsBetween } from "@/lib/admin/dates";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import {
  MIN_STAY_RULE_TYPES,
  TIER_DAY_TYPES,
  okState,
  type ActionState,
} from "@/lib/admin/types";
import {
  ValidationError,
  checkbox,
  isUuid,
  optionalInt,
  optionalText,
  requiredDate,
  requiredEnum,
  requiredInt,
  requiredText,
  requiredUuid,
  runAction,
} from "@/lib/admin/validation";
import { lowestRate, type TierDayType } from "@/lib/pricing";

const PATH = "/admin/tarifas";

/**
 * Publica los cambios de tarifas.
 *
 * Todo lo que se toca aquí (tramos, planes, festivos, estancias mínimas) entra
 * en el precio que ve el huésped, así que además de refrescar el panel hay que
 * invalidar el sitio público con el mismo mecanismo que el resto del CRUD.
 */
function publish() {
  revalidatePath(PATH);
  revalidatePath("/admin");
  revalidatePublicSite();
}

/** Redirección con mensaje para las acciones que no usan `useActionState`. */
function backWith(kind: "ok" | "error", message: string): never {
  redirect(`${PATH}?${kind}=${encodeURIComponent(message)}`);
}

/* ---------------------------------------------------------------------------
 * A. Tarifas por ocupación (rate_tiers + campos del alojamiento)
 * ------------------------------------------------------------------------- */

type TierInput = { guests: number; price_cop: number; day_type: TierDayType };

/**
 * Lee la tabla de tramos que envía el editor como JSON.
 *
 * Se valida aquí y no solo en el navegador porque una Server Action se puede
 * invocar por POST directo: el `min`/`max` del <input> es comodidad, no
 * seguridad.
 */
function parseTiers(formData: FormData, capacity: number): TierInput[] {
  const raw = String(formData.get("tiers") ?? "").trim();
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ValidationError("No se pudo leer la tabla de tarifas.");
  }
  if (!Array.isArray(parsed)) return [];

  const seen = new Set<string>();
  const tiers: TierInput[] = [];

  for (const item of parsed) {
    if (typeof item !== "object" || item === null) continue;
    const { guests, price_cop: price, day_type: dayType } = item as Record<
      string,
      unknown
    >;

    // Una fila totalmente vacía se ignora: es la que el editor deja al añadir.
    if ((guests === "" || guests === null) && (price === "" || price === null)) {
      continue;
    }

    const guestCount = Number(guests);
    const priceCop = Number(price);

    if (!Number.isInteger(guestCount) || guestCount < 1) {
      throw new ValidationError(
        "El número de huéspedes de cada fila debe ser un número entero de 1 en adelante.",
      );
    }
    if (guestCount > capacity) {
      throw new ValidationError(
        `Hay una fila para ${guestCount} huéspedes y el alojamiento admite ${capacity}. Sube la capacidad del alojamiento o corrige la fila.`,
      );
    }
    if (!Number.isFinite(priceCop) || !Number.isInteger(priceCop) || priceCop <= 0) {
      throw new ValidationError(
        `El precio de la fila de ${guestCount} huéspedes debe ser un número mayor que cero.`,
      );
    }
    if (priceCop > 100_000_000) {
      throw new ValidationError("Hay un precio fuera de rango (máximo $100.000.000).");
    }

    const type = TIER_DAY_TYPES.includes(dayType as TierDayType)
      ? (dayType as TierDayType)
      : "any";

    const key = `${type}|${guestCount}`;
    if (seen.has(key)) {
      throw new ValidationError(
        `Hay dos filas para ${guestCount} huéspedes en el mismo tipo de noche. Deja solo una.`,
      );
    }
    seen.add(key);

    tiers.push({ guests: guestCount, price_cop: priceCop, day_type: type });
  }

  // Mezclar la tabla única con las tablas por tipo de noche dejaría precios
  // ambiguos: el motor usaría la específica y la 'any' quedaría muerta.
  const types = new Set(tiers.map((tier) => tier.day_type));
  if (types.has("any") && types.size > 1) {
    throw new ValidationError(
      "No puedes mezclar filas de “Todos los días” con filas de fin de semana o de lunes a jueves. Usa una sola tabla o dos tablas separadas.",
    );
  }

  return tiers;
}

/**
 * Guarda la tabla por ocupación de un alojamiento y sus campos de tarifa.
 *
 * Los tramos se reescriben enteros (borrar + insertar) en vez de compararse
 * fila a fila: son media docena de filas sin nada que los referencie, y así el
 * resultado es exactamente lo que la administradora ve en pantalla.
 */
export async function saveOccupancyRatesAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const { supabase } = await requireAdmin();
    const id = requiredUuid(formData, "accommodation_id", "Alojamiento");

    const { data: accommodation, error: loadError } = await supabase
      .from("accommodations")
      .select("id, name, capacity, price_per_night_cop")
      .eq("id", id)
      .maybeSingle();

    if (loadError) throw new Error(loadError.message);
    if (!accommodation) {
      throw new ValidationError("Ese alojamiento ya no existe.");
    }

    const tiers = parseTiers(formData, Number(accommodation.capacity));

    const breakfastIncluded = checkbox(formData, "breakfast_included");
    const breakfastPrice = optionalInt(
      formData,
      "breakfast_price_cop",
      "Precio del desayuno",
      { min: 0, max: 1_000_000 },
    );

    const weekdayDiscount = optionalInt(
      formData,
      "weekday_discount_pct",
      "Descuento entre semana",
      { min: 1, max: 99 },
    );

    const extraPerson = optionalInt(
      formData,
      "extra_person_price_cop",
      "Huésped adicional",
      { min: 0, max: 10_000_000 },
    );
    const extraPersonWeekday = optionalInt(
      formData,
      "extra_person_price_weekday_cop",
      "Huésped adicional entre semana",
      { min: 0, max: 10_000_000 },
    );

    if (extraPersonWeekday !== null && extraPerson === null) {
      throw new ValidationError(
        "Pusiste un valor de huésped adicional entre semana sin poner el normal. Completa los dos o deja los dos vacíos.",
      );
    }

    // La columna `price_per_night_cop` es la tarifa "Desde" de los listados:
    // se mantiene pegada al tramo más bajo publicado (así lo documenta el
    // esquema) y solo conserva su valor cuando todavía no hay tabla.
    const from = lowestRate(
      tiers.map((tier) => ({ ...tier })),
      Number(accommodation.price_per_night_cop),
    );

    const { error: updateError } = await supabase
      .from("accommodations")
      .update({
        price_per_night_cop: from.amountCop,
        price_note: optionalText(formData, "price_note", 160),
        extra_person_price_cop: extraPerson,
        extra_person_price_weekday_cop: extraPersonWeekday,
        breakfast_included: breakfastIncluded,
        breakfast_price_cop: breakfastIncluded ? null : breakfastPrice,
        weekday_discount_pct: weekdayDiscount,
        rate_note: optionalText(formData, "rate_note", 600),
      })
      .eq("id", id);

    if (updateError) throw new Error(updateError.message);

    const { error: deleteError } = await supabase
      .from("rate_tiers")
      .delete()
      .eq("accommodation_id", id);

    if (deleteError) throw new Error(deleteError.message);

    if (tiers.length > 0) {
      const { error: insertError } = await supabase.from("rate_tiers").insert(
        tiers.map((tier, index) => ({
          accommodation_id: id,
          guests: tier.guests,
          price_cop: tier.price_cop,
          day_type: tier.day_type,
          sort: index,
        })),
      );
      if (insertError) throw new Error(insertError.message);
    }

    publish();
    return okState(
      tiers.length > 0
        ? `Tarifas de ${accommodation.name} guardadas. El sitio ya muestra “Desde ${formatCop(from.amountCop)}”.`
        : `Tarifas de ${accommodation.name} guardadas. Sin tabla por ocupación se sigue mostrando ${formatCop(from.amountCop)} como tarifa de referencia.`,
    );
  });
}

/** "$1.400.000" — mismo formato que el sitio, sin importar el componente. */
function formatCop(amount: number): string {
  return `$${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

/* ---------------------------------------------------------------------------
 * B. Planes especiales (rate_plans)
 * ------------------------------------------------------------------------- */

/** Alojamiento del plan: cadena vacía = "todos los alojamientos". */
function planAccommodation(formData: FormData): string | null {
  const value = String(formData.get("accommodation_id") ?? "").trim();
  if (!value || value === "all") return null;
  if (!isUuid(value)) {
    throw new ValidationError("Debes elegir un alojamiento de la lista.");
  }
  return value;
}

export async function saveRatePlanAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const { supabase } = await requireAdmin();

    const id = String(formData.get("id") ?? "").trim();
    const name = requiredText(formData, "name", "Nombre del plan", 120);
    const accommodationId = planAccommodation(formData);

    const dateFrom = requiredDate(formData, "date_from", "Desde");
    const dateTo = requiredDate(formData, "date_to", "Hasta");
    if (nightsBetween(dateFrom, dateTo) < 0) {
      throw new ValidationError(
        "La fecha “Hasta” no puede ser anterior a la fecha “Desde”.",
      );
    }

    const price = optionalInt(
      formData,
      "price_per_night_cop",
      "Precio por noche",
      { min: 1, max: 100_000_000 },
    );
    const guestsIncluded = optionalInt(
      formData,
      "guests_included",
      "Huéspedes incluidos",
      { min: 1, max: 100 },
    );

    if (accommodationId && guestsIncluded !== null) {
      const { data: accommodation } = await supabase
        .from("accommodations")
        .select("capacity, name")
        .eq("id", accommodationId)
        .maybeSingle();

      if (accommodation && guestsIncluded > Number(accommodation.capacity)) {
        throw new ValidationError(
          `${accommodation.name} admite ${accommodation.capacity} personas: el plan no puede incluir ${guestsIncluded}.`,
        );
      }
    }

    const payload = {
      accommodation_id: accommodationId,
      name,
      description: optionalText(formData, "description", 400),
      date_from: dateFrom,
      date_to: dateTo,
      price_per_night_cop: price,
      guests_included: guestsIncluded,
      active: checkbox(formData, "active"),
      sort: requiredInt(formData, "sort", "Orden", { min: 0, max: 9999 }),
    };

    if (id) {
      if (!isUuid(id)) throw new ValidationError("El plan no es válido.");
      const { error } = await supabase
        .from("rate_plans")
        .update(payload)
        .eq("id", id);
      if (error) throw new Error(error.message);

      publish();
      return okState(`Plan “${name}” guardado.`);
    }

    const { error } = await supabase.from("rate_plans").insert(payload);
    if (error) throw new Error(error.message);

    publish();
    redirect(
      `${PATH}?ok=${encodeURIComponent(
        `Plan “${name}” creado. Revisa abajo que las fechas y el precio sean los correctos.`,
      )}`,
    );
  });
}

export async function toggleRatePlanAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const active = String(formData.get("active") ?? "") === "true";

  if (!isUuid(id)) backWith("error", "El plan no es válido.");

  const { error } = await supabase
    .from("rate_plans")
    .update({ active })
    .eq("id", id);

  if (error) backWith("error", error.message);

  publish();
  backWith(
    "ok",
    active
      ? "Plan activado: su precio ya manda en esas fechas."
      : "Plan desactivado: esas fechas vuelven a la tarifa normal.",
  );
}

export async function deleteRatePlanAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();

  if (!isUuid(id)) backWith("error", "El plan no es válido.");

  const { error } = await supabase.from("rate_plans").delete().eq("id", id);
  if (error) backWith("error", error.message);

  publish();
  backWith("ok", "Plan eliminado.");
}

/* ---------------------------------------------------------------------------
 * C. Festivos
 * ------------------------------------------------------------------------- */

export async function createHolidayAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const { supabase } = await requireAdmin();

    const date = requiredDate(formData, "holiday_date", "Fecha");
    const name = requiredText(formData, "name", "Nombre del festivo", 120);

    const { error } = await supabase
      .from("holidays")
      .insert({ holiday_date: date, name });

    if (error) {
      // 23505 = clave duplicada: ese festivo ya está sembrado.
      if (error.code === "23505") {
        throw new ValidationError("Ese día ya está en la lista de festivos.");
      }
      throw new Error(error.message);
    }

    publish();
    return okState(`Festivo “${name}” añadido.`);
  });
}

export async function deleteHolidayAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const date = String(formData.get("holiday_date") ?? "").trim();

  if (!isIsoDate(date)) backWith("error", "La fecha no es válida.");

  const { error } = await supabase
    .from("holidays")
    .delete()
    .eq("holiday_date", date);

  if (error) backWith("error", error.message);

  publish();
  backWith("ok", "Festivo eliminado.");
}

/* ---------------------------------------------------------------------------
 * D. Estancias mínimas
 * ------------------------------------------------------------------------- */

export async function saveMinStayRuleAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const { supabase } = await requireAdmin();

    const id = String(formData.get("id") ?? "").trim();
    const accommodationId = requiredUuid(
      formData,
      "accommodation_id",
      "Alojamiento",
    );
    const label = requiredText(formData, "label", "Nombre de la temporada", 120);
    const ruleType = requiredEnum(
      formData,
      "rule_type",
      "Cuándo aplica",
      MIN_STAY_RULE_TYPES,
    );
    const minNights = requiredInt(formData, "min_nights", "Noches mínimas", {
      min: 1,
      max: 30,
    });

    let dateFrom: string | null = null;
    let dateTo: string | null = null;

    if (ruleType === "date_range") {
      dateFrom = requiredDate(formData, "date_from", "Desde");
      dateTo = requiredDate(formData, "date_to", "Hasta");
      if (nightsBetween(dateFrom, dateTo) < 0) {
        throw new ValidationError(
          "La fecha “Hasta” no puede ser anterior a la fecha “Desde”.",
        );
      }
    }

    const payload = {
      accommodation_id: accommodationId,
      label,
      rule_type: ruleType,
      date_from: dateFrom,
      date_to: dateTo,
      min_nights: minNights,
      sort: requiredInt(formData, "sort", "Orden", { min: 0, max: 9999 }),
    };

    if (id) {
      if (!isUuid(id)) throw new ValidationError("La regla no es válida.");
      const { error } = await supabase
        .from("min_stay_rules")
        .update(payload)
        .eq("id", id);
      if (error) throw new Error(error.message);

      publish();
      return okState(`Estancia mínima de “${label}” actualizada.`);
    }

    const { error } = await supabase.from("min_stay_rules").insert(payload);
    if (error) throw new Error(error.message);

    publish();
    return okState(`Estancia mínima de “${label}” añadida.`);
  });
}

export async function deleteMinStayRuleAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();

  if (!isUuid(id)) backWith("error", "La regla no es válida.");

  const { error } = await supabase.from("min_stay_rules").delete().eq("id", id);
  if (error) backWith("error", error.message);

  publish();
  backWith("ok", "Regla de estancia mínima eliminada.");
}
