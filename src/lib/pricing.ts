/**
 * Motor de tarifas de La Maima.
 *
 * En La Maima el precio NO es "una tarifa por noche": cada cabaña publica una
 * tabla de precios **por número de huéspedes**, y algunas noches valen menos
 * que otras. Este módulo convierte esas reglas —tal como están en el documento
 * oficial del cliente— en un número y en un desglose que el huésped entienda.
 *
 * Las cuatro reglas del documento:
 *
 *   1. **Precio por ocupación.** Cada cabaña tiene tramos (`rate_tiers`) del
 *      tipo "2 personas: $570.000". Se cobra el tramo más bajo que alcance
 *      para el grupo: pedir 9 camas en Casa Maima (tramos de 8 y de 10) paga
 *      el de 10, nunca el de 8.
 *   2. **Noches de distinto tipo.** Tres Casitas publica dos tablas (fin de
 *      semana y lunes–jueves); las demás publican una sola tabla y un
 *      **descuento del 25 %** en las noches de lunes a jueves no festivas,
 *      que no aplica entre el 14 de diciembre y el 15 de enero. Una estadía
 *      puede mezclar noches caras y baratas, y se suma noche a noche.
 *   3. **Huésped adicional.** Por encima del tramo más alto se cobra un valor
 *      por persona (con precio propio entre semana en Tres Casitas).
 *   4. **Estancia mínima** por temporada y por cabaña: puentes festivos,
 *      Semana Santa y la temporada del 23 de diciembre al 7 de enero.
 *
 * Encima de todo eso pueden existir **paquetes** (`rate_plans`, por ejemplo
 * "San Valentín"): si un paquete activo cubre la noche y trae precio, ese
 * precio manda sobre la tabla por ocupación.
 *
 * El módulo es **puro**: no toca Supabase ni el DOM, así que lo usan por igual
 * el render del servidor, el widget del navegador y los tests.
 */
import { addDays, nightsBetween, weekdayIndex } from "./dates";
import { formatCOP, formatGuests, formatNights } from "./format";
import { DEFAULT_LOCALE, type Locale } from "./i18n/config";

/* ---------------------------------------------------------------------------
 * Tipos
 * ------------------------------------------------------------------------- */

/** Tipo de noche ya resuelto: o cuenta como fin de semana, o como entre semana. */
export type DayType = "weekend" | "weekday";

/**
 * `any` es el caso normal: una sola tabla que vale todos los días. `weekend` y
 * `weekday` solo los usa Tres Casitas, la única con dos tablas publicadas.
 */
export type TierDayType = "any" | DayType;

export type RateTier = {
  /** Tope de huéspedes que cubre el tramo. */
  guests: number;
  price_cop: number;
  day_type: TierDayType;
};

export type MinStayRule = {
  /** Texto que ve el huésped: "Puentes festivos", "Semana Santa 2027"… */
  label: string;
  /**
   * `holiday_bridge` se calcula con la tabla de festivos (no lleva fechas);
   * `date_range` trae la temporada explícita y editable.
   */
  rule_type: "holiday_bridge" | "date_range";
  /** Primera noche de la temporada (inclusive). */
  date_from: string | null;
  /** Última noche de la temporada (inclusive). */
  date_to: string | null;
  min_nights: number;
};

export type RatePlan = {
  name: string;
  description: string | null;
  /** Primera noche cubierta (inclusive). */
  date_from: string;
  /** Última noche cubierta (inclusive). */
  date_to: string;
  /** `null` = el paquete solo nombra la temporada y respeta la tabla. */
  price_per_night_cop: number | null;
  /** Huéspedes que cubre el precio del paquete. `null` = todos. */
  guests_included: number | null;
  /** Orden manual que pone el panel. Menor = manda. Por defecto 0. */
  sort?: number;
  /**
   * `true` cuando el plan se creó para **todos** los alojamientos. Un plan
   * hecho para esta cabaña en concreto le gana (ver `planForNight`).
   */
  appliesToAll?: boolean;
};

export type Holiday = {
  /** "YYYY-MM-DD" */
  date: string;
  /** El festivo cae en lunes, así que arma puente. */
  is_bridge: boolean;
};

/** Todo lo que el motor necesita saber de una cabaña. Es serializable. */
export type RateConfig = {
  capacity: number;
  /** Respaldo plano para las cabañas que aún no tienen tabla publicada. */
  basePriceCop: number;
  tiers: RateTier[];
  extraPersonPriceCop: number | null;
  extraPersonPriceWeekdayCop: number | null;
  breakfastIncluded: boolean;
  breakfastPriceCop: number | null;
  /** 25 en casi todas; `null` en Tres Casitas, que ya publica precio propio. */
  weekdayDiscountPct: number | null;
  /** Aclaración larga de la tarifa, redactada por el cliente. */
  rateNote: string | null;
  minStayRules: MinStayRule[];
  ratePlans: RatePlan[];
  holidays: Holiday[];
};

/* ---------------------------------------------------------------------------
 * Temporada sin descuento
 * ------------------------------------------------------------------------- */

/**
 * Del 14 de diciembre al 15 de enero no hay descuento entre semana, aunque la
 * noche caiga en martes. El rango cruza el fin de año, así que se compara solo
 * "MM-DD": es la única forma de que valga para cualquier año sin resembrar.
 */
export function isNoDiscountSeason(iso: string): boolean {
  const monthDay = iso.slice(5);
  return monthDay >= "12-14" || monthDay <= "01-15";
}

/* ---------------------------------------------------------------------------
 * Tipo de noche
 * ------------------------------------------------------------------------- */

/**
 * Una noche se identifica por la fecha en que se duerme (la de entrada).
 *
 * Cuenta como **entre semana** la noche de lunes, martes, miércoles o jueves
 * que no sea festivo; el resto —viernes, sábado, domingo y cualquier festivo—
 * cuenta como fin de semana. Es la lectura literal del documento ("lunes a
 * jueves, no festivos").
 *
 * Nota para cuando el cliente lo pida: la víspera de un festivo entre semana
 * (el lunes cuando el martes es festivo) hoy sigue contando como entre semana.
 * Cambiarlo es tocar solo esta función.
 */
export function nightDayType(iso: string, holidays: Set<string>): DayType {
  if (holidays.has(iso)) return "weekend";
  return weekdayIndex(iso) <= 3 ? "weekday" : "weekend";
}

/** Lista de fechas de todas las noches de `[checkIn, checkOut)`. */
export function nightsOf(checkIn: string, checkOut: string): string[] {
  const total = nightsBetween(checkIn, checkOut);
  return Array.from({ length: Math.max(0, total) }, (_, index) =>
    addDays(checkIn, index),
  );
}

/* ---------------------------------------------------------------------------
 * Tramos por ocupación
 * ------------------------------------------------------------------------- */

/**
 * Tramos que aplican a una noche, ordenados de menor a mayor ocupación.
 *
 * Si la cabaña publica tabla propia para ese tipo de noche se usa esa; si no,
 * la tabla única (`any`).
 */
export function tiersForDayType(
  tiers: RateTier[],
  dayType: DayType,
): RateTier[] {
  const specific = tiers.filter((tier) => tier.day_type === dayType);
  const pool = specific.length
    ? specific
    : tiers.filter((tier) => tier.day_type === "any");
  return [...pool].sort((a, b) => a.guests - b.guests);
}

/**
 * Tramo aplicable a un grupo: el más bajo que le alcance.
 *
 * Por debajo del tramo mínimo se paga ese mínimo (Casa Loma empieza en 2
 * personas: una sola paga tarifa de dos). Por encima del máximo se devuelve el
 * máximo y la diferencia se cobra como huéspedes adicionales.
 */
export function tierFor(pool: RateTier[], guests: number): RateTier | null {
  if (pool.length === 0) return null;
  return pool.find((tier) => tier.guests >= guests) ?? pool[pool.length - 1];
}

/* ---------------------------------------------------------------------------
 * Precio de una noche
 * ------------------------------------------------------------------------- */

export type NightRate = {
  date: string;
  dayType: DayType;
  /** Tarifa del tramo (o del paquete) antes del descuento. */
  baseCop: number;
  /** Descuento aplicado sobre `baseCop`, en porcentaje. 0 si no hay. */
  discountPct: number;
  /** Huéspedes por encima del tramo más alto. */
  extraGuests: number;
  /** Lo que cuestan esos huéspedes adicionales. */
  extraCop: number;
  /** Total de la noche: base con descuento + adicionales. */
  totalCop: number;
  /** Nombre del paquete que cubre la noche, si hay alguno activo. */
  planName: string | null;
};

/** Valor por huésped adicional según el tipo de noche. */
function extraPersonPrice(config: RateConfig, dayType: DayType): number {
  if (dayType === "weekday" && config.extraPersonPriceWeekdayCop !== null) {
    return config.extraPersonPriceWeekdayCop;
  }
  return config.extraPersonPriceCop ?? 0;
}

/**
 * REGLA DE PRECEDENCIA ENTRE PLANES (la que se explica en el panel).
 *
 * Nada impide que la administradora cree dos planes que se crucen en fechas
 * —el panel avisa pero no lo bloquea, porque a veces es a propósito—, así que
 * el motor necesita una regla fija para decidir cuál cobra. Gana UNO solo, en
 * este orden:
 *
 *   1. **Alcance.** El plan hecho para ese alojamiento gana al plan de "todos
 *      los alojamientos": lo particular manda sobre lo general.
 *   2. **Orden.** A igual alcance, el número de orden más bajo (la columna
 *      "Orden" del panel: menor = manda).
 *   3. **Rango más corto.** A igual orden, el plan que cubre menos noches, por
 *      ser el más específico en el tiempo (un fin de semana temático gana a una
 *      temporada entera).
 *   4. **Nombre.** Orden alfabético, solo para que el resultado nunca dependa
 *      del azar ni del orden en que llegaron las filas.
 *
 * Devuelve un número negativo si `a` manda sobre `b` (mismo criterio que
 * `Array.prototype.sort`).
 */
export function comparePlans(a: RatePlan, b: RatePlan): number {
  const scope = Number(a.appliesToAll ?? false) - Number(b.appliesToAll ?? false);
  if (scope !== 0) return scope;

  const sort = (a.sort ?? 0) - (b.sort ?? 0);
  if (sort !== 0) return sort;

  const span = planSpan(a) - planSpan(b);
  if (span !== 0) return span;

  return a.name.localeCompare(b.name, "es");
}

/** Noches que cubre el plan, ambos extremos inclusive. */
function planSpan(plan: RatePlan): number {
  return nightsBetween(plan.date_from, plan.date_to) + 1;
}

/**
 * Plan que cobra esa noche: de todos los que la cubren, el que gana según
 * `comparePlans`.
 */
export function planForNight(plans: RatePlan[], iso: string): RatePlan | null {
  let winner: RatePlan | null = null;
  for (const plan of plans) {
    if (plan.date_from > iso || iso > plan.date_to) continue;
    if (!winner || comparePlans(plan, winner) < 0) winner = plan;
  }
  return winner;
}

/**
 * Planes que se cruzan en fechas dentro de una misma lista.
 *
 * El panel lo usa para advertir ("estos dos planes se pisan del 12 al 14"), no
 * para impedir nada: solaparlos es legítimo y la regla de arriba decide.
 */
export function overlappingPlanPairs<T extends RatePlan>(
  plans: T[],
): [T, T][] {
  const pairs: [T, T][] = [];
  for (let i = 0; i < plans.length; i += 1) {
    for (let j = i + 1; j < plans.length; j += 1) {
      const a = plans[i];
      const b = plans[j];
      if (a.date_from <= b.date_to && b.date_from <= a.date_to) {
        pairs.push([a, b]);
      }
    }
  }
  return pairs;
}

/** Tarifa de una noche concreta, con su desglose. */
export function nightRate(
  config: RateConfig,
  iso: string,
  guests: number,
  holidaySet: Set<string>,
): NightRate {
  const dayType = nightDayType(iso, holidaySet);
  const plan = planForNight(config.ratePlans, iso);

  const pool = tiersForDayType(config.tiers, dayType);
  const tier = tierFor(pool, guests);
  const topTier = pool.length ? pool[pool.length - 1] : null;

  // El precio del paquete manda sobre la tabla; si el paquete no trae precio,
  // solo pone nombre a la temporada y se sigue cobrando por tramos.
  const planPrice = plan?.price_per_night_cop ?? null;
  const baseCop = planPrice ?? tier?.price_cop ?? config.basePriceCop;

  // Los huéspedes adicionales se cuentan sobre el tope del paquete cuando hay
  // paquete con precio, y sobre el tramo más alto cuando se cobra por tabla.
  const includedGuests =
    planPrice !== null
      ? (plan?.guests_included ?? guests)
      : (topTier?.guests ?? guests);
  const extraGuests = Math.max(0, guests - includedGuests);
  const extraCop = extraGuests * extraPersonPrice(config, dayType);

  // El descuento de lunes a jueves no se acumula con un paquete con precio
  // cerrado, y no existe entre el 14 de diciembre y el 15 de enero. Se aplica
  // solo a la tarifa del tramo, no al huésped adicional.
  const discountPct =
    planPrice === null &&
    dayType === "weekday" &&
    config.weekdayDiscountPct !== null &&
    !isNoDiscountSeason(iso)
      ? config.weekdayDiscountPct
      : 0;

  const discounted = Math.round((baseCop * (100 - discountPct)) / 100);

  return {
    date: iso,
    dayType,
    baseCop,
    discountPct,
    extraGuests,
    extraCop,
    totalCop: discounted + extraCop,
    planName: plan?.name ?? null,
  };
}

/* ---------------------------------------------------------------------------
 * Estancia mínima
 * ------------------------------------------------------------------------- */

/**
 * Noches que forman puente: la del sábado y la del domingo anteriores a un
 * festivo en lunes. La noche del lunes festivo queda fuera a propósito — es la
 * noche en que el puente termina y la gente ya va de salida.
 */
export function bridgeNights(holidays: Holiday[]): Set<string> {
  const nights = new Set<string>();
  for (const holiday of holidays) {
    if (!holiday.is_bridge) continue;
    nights.add(addDays(holiday.date, -2));
    nights.add(addDays(holiday.date, -1));
  }
  return nights;
}

/** ¿Alguna noche de la estadía cae dentro de la regla? */
function ruleApplies(
  rule: MinStayRule,
  nights: string[],
  bridges: Set<string>,
): boolean {
  if (rule.rule_type === "holiday_bridge") {
    return nights.some((night) => bridges.has(night));
  }
  const { date_from: from, date_to: to } = rule;
  if (!from || !to) return false;
  return nights.some((night) => from <= night && night <= to);
}

export type MinStayIssue = {
  label: string;
  requiredNights: number;
  message: string;
};

/**
 * Estancia mínima exigible para unas fechas: la más alta de todas las reglas
 * que toquen la estadía. Devuelve `null` cuando no falta ninguna noche.
 */
export function minStayFor(
  config: RateConfig,
  checkIn: string,
  checkOut: string,
  locale: Locale = DEFAULT_LOCALE,
): MinStayIssue | null {
  const nights = nightsOf(checkIn, checkOut);
  if (nights.length === 0) return null;

  const bridges = bridgeNights(config.holidays);

  let worst: MinStayRule | null = null;
  for (const rule of config.minStayRules) {
    if (!ruleApplies(rule, nights, bridges)) continue;
    if (!worst || rule.min_nights > worst.min_nights) worst = rule;
  }

  if (!worst || nights.length >= worst.min_nights) return null;

  /* `label` llega YA traducido desde `@/lib/content` (columna `label_en` de
     `min_stay_rules`), así que aquí solo se compone la frase. */
  const required = formatNights(worst.min_nights, locale);

  if (locale === "en") {
    return {
      label: worst.label,
      requiredNights: worst.min_nights,
      message:
        worst.rule_type === "holiday_bridge"
          ? `Over long holiday weekends the minimum stay is ${required}.`
          : /* El rótulo NO se pasa a minúscula en inglés: "Easter Week" y
               "Christmas season" son nombres propios de temporada y
               "during easter week" se leería como un descuido. */
            `During ${worst.label} the minimum stay is ${required}.`,
    };
  }

  return {
    label: worst.label,
    requiredNights: worst.min_nights,
    message:
      worst.rule_type === "holiday_bridge"
        ? `En puentes festivos la estancia mínima es de ${required}.`
        : `En ${lowerFirst(worst.label)} la estancia mínima es de ${required}.`,
  };
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/* ---------------------------------------------------------------------------
 * Cotización completa
 * ------------------------------------------------------------------------- */

/** Un renglón del desglose: todas las noches que cuestan lo mismo. */
export type QuoteLine = {
  nights: number;
  unitCop: number;
  subtotalCop: number;
  dayType: DayType;
  discountPct: number;
  planName: string | null;
  /** "3 noches × $570.000" */
  label: string;
  /** "Lunes a jueves · 25 % de descuento", o `null` si no hay nada que aclarar. */
  detail: string | null;
};

export type BreakfastInfo = {
  included: boolean;
  /** Valor por persona cuando el desayuno se cobra aparte. */
  pricePerPersonCop: number | null;
  /** Lo que costaría el desayuno de todo el grupo (no entra en el total). */
  optionalTotalCop: number | null;
  label: string;
};

export type Quote = {
  nights: number;
  guests: number;
  nightly: NightRate[];
  lines: QuoteLine[];
  /** Suma de las noches. El desayuno opcional NO está incluido. */
  totalCop: number;
  /** Promedio por noche, para el titular del resumen. */
  averageNightCop: number;
  /** Cuántos huéspedes se cobran como adicionales, y cuánto suman. */
  extraGuests: number;
  extraTotalCop: number;
  breakfast: BreakfastInfo | null;
  minStay: MinStayIssue | null;
  /** Nombres de los paquetes que tocan la estadía. */
  planNames: string[];
  /** El grupo supera la capacidad publicada. */
  overCapacity: boolean;
};

/**
 * Agrupa las noches por precio. No exige que sean consecutivas: un desglose de
 * "3 noches × $570.000 · 1 noche entre semana × $427.500" se lee mucho mejor
 * que cuatro renglones con fechas.
 */
function buildLines(nightly: NightRate[], locale: Locale): QuoteLine[] {
  const groups = new Map<string, QuoteLine>();

  for (const night of nightly) {
    const unit = night.totalCop;
    const key = `${unit}|${night.dayType}|${night.discountPct}|${night.planName ?? ""}`;
    const existing = groups.get(key);
    if (existing) {
      existing.nights += 1;
      existing.subtotalCop += unit;
      existing.label = `${formatNights(existing.nights, locale)} × ${formatCOP(unit)}`;
      continue;
    }
    groups.set(key, {
      nights: 1,
      unitCop: unit,
      subtotalCop: unit,
      dayType: night.dayType,
      discountPct: night.discountPct,
      planName: night.planName,
      label: `${formatNights(1, locale)} × ${formatCOP(unit)}`,
      detail: lineDetail(night, locale),
    });
  }

  return [...groups.values()];
}

function lineDetail(night: NightRate, locale: Locale): string | null {
  const parts: string[] = [];
  const english = locale === "en";

  if (night.planName) parts.push(night.planName);

  if (night.discountPct > 0) {
    parts.push(
      english
        ? `Monday to Thursday · ${night.discountPct} % off`
        : `lunes a jueves · ${night.discountPct} % de descuento`,
    );
  } else if (night.dayType === "weekday" && !night.planName) {
    parts.push(english ? "Monday to Thursday" : "lunes a jueves");
  } else if (!night.planName) {
    parts.push(english ? "weekend or public holiday" : "fin de semana o festivo");
  }

  if (night.extraGuests > 0) {
    const amount = formatCOP(night.extraCop);
    if (english) {
      parts.push(
        night.extraGuests === 1
          ? `includes 1 extra guest (${amount})`
          : `includes ${night.extraGuests} extra guests (${amount})`,
      );
    } else {
      parts.push(
        night.extraGuests === 1
          ? `incluye 1 huésped adicional (${amount})`
          : `incluye ${night.extraGuests} huéspedes adicionales (${amount})`,
      );
    }
  }

  if (parts.length === 0) return null;
  const [first, ...rest] = parts;
  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(" · ");
}

/**
 * Cómo se anuncia el desayuno, sin fechas de por medio.
 *
 * `null` significa "el documento del cliente no lo dice": callarse es mejor
 * que prometer un desayuno que quizá no está incluido. Hoy pasa con Tres
 * Casitas, cuya ficha no menciona el desayuno.
 */
export function breakfastLabel(
  config: RateConfig,
  locale: Locale = DEFAULT_LOCALE,
): string | null {
  if (locale === "en") {
    if (config.breakfastIncluded) return "Breakfast included";
    if (config.breakfastPriceCop === null) return null;
    return `Breakfast extra: ${formatCOP(config.breakfastPriceCop)} per person`;
  }
  if (config.breakfastIncluded) return "Desayuno incluido";
  if (config.breakfastPriceCop === null) return null;
  return `Desayuno aparte: ${formatCOP(config.breakfastPriceCop)} por persona`;
}

function breakfastInfo(
  config: RateConfig,
  guests: number,
  nights: number,
  locale: Locale,
): BreakfastInfo | null {
  const label = breakfastLabel(config, locale);
  if (label === null) return null;

  if (config.breakfastIncluded) {
    return {
      included: true,
      pricePerPersonCop: null,
      optionalTotalCop: null,
      label,
    };
  }
  return {
    included: false,
    pricePerPersonCop: config.breakfastPriceCop,
    optionalTotalCop:
      nights > 0 && config.breakfastPriceCop !== null
        ? config.breakfastPriceCop * guests * nights
        : null,
    label,
  };
}

/**
 * Cotización de una estadía: precio noche a noche, desglose agrupado, total,
 * desayuno y validación de estancia mínima.
 */
export function quote(
  config: RateConfig,
  checkIn: string,
  checkOut: string,
  guests: number,
  locale: Locale = DEFAULT_LOCALE,
): Quote {
  const holidaySet = new Set(config.holidays.map((holiday) => holiday.date));
  const nights = nightsOf(checkIn, checkOut);

  const nightly = nights.map((iso) =>
    nightRate(config, iso, guests, holidaySet),
  );

  const totalCop = nightly.reduce((sum, night) => sum + night.totalCop, 0);
  const extraTotalCop = nightly.reduce((sum, night) => sum + night.extraCop, 0);
  const extraGuests = nightly[0]?.extraGuests ?? 0;

  const planNames = [
    ...new Set(
      nightly
        .map((night) => night.planName)
        .filter((name): name is string => Boolean(name)),
    ),
  ];

  return {
    nights: nights.length,
    guests,
    nightly,
    lines: buildLines(nightly, locale),
    totalCop,
    averageNightCop: nights.length
      ? Math.round(totalCop / nights.length)
      : 0,
    extraGuests,
    extraTotalCop,
    breakfast: breakfastInfo(config, guests, nights.length, locale),
    minStay: minStayFor(config, checkIn, checkOut, locale),
    planNames,
    overCapacity: guests > config.capacity,
  };
}

/* ---------------------------------------------------------------------------
 * Tarifa "Desde" de los listados
 * ------------------------------------------------------------------------- */

export type LowestRate = {
  amountCop: number;
  /** Ocupación a la que corresponde ese precio. `null` si no hay tabla. */
  guests: number | null;
  dayType: TierDayType | null;
};

/**
 * Precio más bajo publicado: el tramo mínimo de la tabla.
 *
 * Se toma el precio de tabla **sin** aplicarle el descuento de lunes a jueves.
 * Un "Desde" que solo se consigue de martes prometería de menos y decepciona
 * en la ficha; el descuento se anuncia aparte, en `price_note`.
 */
export function lowestRate(
  tiers: RateTier[],
  fallbackCop: number,
): LowestRate {
  if (tiers.length === 0) {
    return { amountCop: fallbackCop, guests: null, dayType: null };
  }
  const cheapest = tiers.reduce((best, tier) =>
    tier.price_cop < best.price_cop ? tier : best,
  );
  return {
    amountCop: cheapest.price_cop,
    guests: cheapest.guests,
    dayType: cheapest.day_type,
  };
}

/* ---------------------------------------------------------------------------
 * Textos de apoyo
 * ------------------------------------------------------------------------- */

export type TierRow = {
  key: string;
  /** "Hasta 2 personas", "Hasta 8 personas", "Hasta 2 personas · lunes a jueves"… */
  label: string;
  price: number;
};

/**
 * La tabla de precios tal como se publica en la ficha.
 *
 * Cada renglón se escribe SIEMPRE como "Hasta N personas", lo pida el salto o
 * no. Un tramo cubre desde el tramo anterior hasta el suyo —Casa Loma empieza
 * en 2 personas y una sola paga lo mismo— pero incluso cuando los tramos van de
 * uno en uno el precio es un techo de ocupación, no una cuota por cabeza: el
 * cliente pidió expresamente que ninguna fila muestre el número seco ("2
 * personas") ni un rango ("2-4 personas"), porque el huésped lo leía como
 * "precio por persona". El sufijo de día de la semana no cambia.
 */
export function tierRows(
  tiers: RateTier[],
  locale: Locale = DEFAULT_LOCALE,
): TierRow[] {
  const hasTwoTables = tiers.some((tier) => tier.day_type !== "any");
  const order: TierDayType[] = ["any", "weekend", "weekday"];
  const english = locale === "en";

  const sorted = [...tiers].sort(
    (a, b) =>
      order.indexOf(a.day_type) - order.indexOf(b.day_type) ||
      a.guests - b.guests,
  );

  return sorted.map((tier) => {
    /* "Hasta 4 personas" / "Up to 4 guests": el techo de ocupación, nunca una
       cuota por cabeza (ver la nota de arriba). */
    const occupancy = english
      ? `Up to ${formatGuests(tier.guests, "en")}`
      : `Hasta ${formatGuests(tier.guests, "es")}`;

    const when =
      !hasTwoTables || tier.day_type === "any"
        ? ""
        : tier.day_type === "weekday"
          ? english
            ? " · Monday to Thursday"
            : " · lunes a jueves"
          : english
            ? " · weekend"
            : " · fin de semana";

    return {
      key: `${tier.day_type}-${tier.guests}`,
      label: `${occupancy}${when}`,
      price: tier.price_cop,
    };
  });
}

/**
 * Resumen de las estancias mínimas para la ficha del alojamiento, sin repetir
 * la misma temporada dos veces (2027 y 2028 dicen lo mismo).
 */
export function minStaySummary(
  rules: MinStayRule[],
  locale: Locale = DEFAULT_LOCALE,
): string[] {
  const seen = new Map<string, number>();
  for (const rule of rules) {
    // "Semana Santa 2027" y "Semana Santa 2028" comparten resumen.
    const family = rule.label.replace(/\s*\d{4}(\/\d{2})?\s*$/, "").trim();
    const current = seen.get(family);
    if (current === undefined || rule.min_nights > current) {
      seen.set(family, rule.min_nights);
    }
  }
  return [...seen.entries()].map(([family, min]) =>
    locale === "en"
      ? `${family}: minimum ${formatNights(min, "en")}`
      : `${family}: mínimo ${formatNights(min, "es")}`,
  );
}

/* ---------------------------------------------------------------------------
 * Notas de la tarifa, en puntos
 * ------------------------------------------------------------------------- */

export type RateNoteKind =
  | "breakfast"
  | "weekday"
  | "extra-guest"
  | "min-stay"
  | "other";

/** Un dato de la tarifa, uno por línea. */
export type RateNote = {
  key: string;
  kind: RateNoteKind;
  /** El dato. Frase corta y cerrada. */
  text: string;
  /** Matiz o excepción, en segundo plano. */
  detail?: string;
};

/**
 * Temas que YA cuentan los puntos derivados de los campos estructurados.
 *
 * Sirven para no repetir en el texto libre lo que la lista ya dijo: ver
 * `extraSentences()`.
 */
/**
 * Marca interna para cortar el texto libre en frases.
 *
 * Se construye con `String.fromCharCode` en vez de escribir el carácter en el
 * código: un carácter de control literal dentro de una cadena convierte el
 * archivo en "binario" para media caja de herramientas (grep, diffs, revisión
 * de código) y es invisible al leerlo.
 */
const SENTENCE_BREAK = String.fromCharCode(1);

const NOTE_TOPICS: Record<
  Locale,
  Record<Exclude<RateNoteKind, "other">, RegExp>
> = {
  es: {
    breakfast: /desayun/i,
    weekday: /descuento|lunes a jueves|fin de semana|festiv/i,
    "extra-guest": /adicional/i,
    "min-stay": /estancia mínima|noches mínim/i,
  },
  en: {
    breakfast: /breakfast/i,
    weekday: /discount|monday to thursday|weekend|holiday|% off/i,
    "extra-guest": /extra guest|additional guest/i,
    "min-stay": /minimum stay|minimum of \d+ nights/i,
  },
};

/**
 * Frases del texto libre (`rate_note`) que aportan algo que la lista no dice.
 *
 * El campo lo escribe el cliente a mano y hoy repite, en prosa, exactamente lo
 * que ya está en las columnas ("El desayuno no está incluido: $25.000 por
 * persona. Descuento del 25 % de lunes a jueves…"). Repetirlo debajo de los
 * puntos sería leerlo dos veces, así que se descartan las frases cuyo tema ya
 * tiene su punto; lo que quede —una aclaración que solo vive en el texto— sí se
 * publica.
 *
 * DOS TRAMPAS en el troceado en frases, las dos resueltas por el patrón:
 *
 *   · No vale cortar en cada punto. En COP el punto es el separador de miles y
 *     "$25.000 por persona" se partiría en "$25." y "000 por persona", que es
 *     justo la frase huérfana que acabaría publicándose como aclaración. Se
 *     exige que tras el punto venga un espacio y una MAYÚSCULA (o un signo de
 *     apertura), que es como empieza una frase de verdad.
 *   · No vale usar una mirada atrás (`/(?<=\.)\s+/`). Esto también corre en el
 *     navegador, dentro del widget de reservas, y Safari no entendió las
 *     miradas atrás hasta la 16.4: donde no las entiende, el patrón ni siquiera
 *     compila y se lleva la página entera por delante. El truco es capturar el
 *     signo y volver a ponerlo, con un carácter de control como separador
 *     (nunca aparece en un texto escrito a mano).
 */
function extraSentences(
  rateNote: string | null,
  covered: Set<RateNoteKind>,
  locale: Locale,
): string[] {
  if (!rateNote) return [];

  const topics = Object.entries(NOTE_TOPICS[locale]) as [
    Exclude<RateNoteKind, "other">,
    RegExp,
  ][];

  return rateNote
    .replace(/([.!?])\s+(?=[A-ZÁÉÍÓÚÜÑ¿¡"«(])/g, "$1" + SENTENCE_BREAK)
    .split(SENTENCE_BREAK)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter(
      (sentence) =>
        !topics.some(([kind, topic]) => covered.has(kind) && topic.test(sentence)),
    );
}

/**
 * Las condiciones de la tarifa como LISTA DE PUNTOS, un dato por línea.
 *
 * En la ficha esto se leía como un párrafo corrido ("El desayuno no está
 * incluido: $25.000 por persona. Descuento del 25 % de lunes a jueves no
 * festivos, salvo del 14 de diciembre al 15 de enero."), y en un párrafo los
 * datos se pierden: quien mira una cabaña busca UNA cosa —cuánto cuesta el
 * desayuno, si le sale más barato entre semana— y no quiere leer una frase
 * entera para encontrarla.
 *
 * Los puntos salen de los CAMPOS de la base de datos (`breakfast_included`,
 * `breakfast_price_cop`, `weekday_discount_pct`, `extra_person_price_cop`, las
 * reglas de estancia mínima), no de la prosa: así el día que la administradora
 * cambie un precio desde el panel, el punto cambia con él aunque nadie
 * reescriba el texto. `rate_note` solo aporta las frases que digan algo que las
 * columnas no cuentan.
 *
 * Devuelve la lista vacía cuando no hay nada que decir (hoy, Casa Uba): quien
 * la pinta no tiene que comprobar nada más.
 */
export function rateNotes(
  config: RateConfig,
  locale: Locale = DEFAULT_LOCALE,
): RateNote[] {
  const notes: RateNote[] = [];
  const english = locale === "en";

  /* 1. Desayuno. Si el documento del cliente no dice nada, no se inventa: ni
        "incluido" ni un precio. */
  if (config.breakfastIncluded) {
    notes.push({
      key: "breakfast",
      kind: "breakfast",
      text: english
        ? "Breakfast is included in the rate."
        : "Desayuno incluido en la tarifa.",
    });
  } else if (config.breakfastPriceCop !== null) {
    const price = formatCOP(config.breakfastPriceCop);
    notes.push({
      key: "breakfast",
      kind: "breakfast",
      text: english
        ? `Breakfast is not included: ${price} per person.`
        : `El desayuno no está incluido: ${price} por persona.`,
    });
  }

  /* 2. Entre semana. Dos formas de decir lo mismo: casi todas las cabañas
        descuentan un porcentaje, y Tres Casitas publica dos tablas. */
  if (config.weekdayDiscountPct !== null) {
    notes.push({
      key: "weekday",
      kind: "weekday",
      text: english
        ? `${config.weekdayDiscountPct} % off from Monday to Thursday.`
        : `${config.weekdayDiscountPct} % de descuento de lunes a jueves.`,
      detail: english
        ? "Not valid on public holidays or between 14 December and 15 January."
        : "No aplica en festivos ni entre el 14 de diciembre y el 15 de enero.",
    });
  } else if (config.tiers.some((tier) => tier.day_type !== "any")) {
    notes.push({
      key: "weekday",
      kind: "weekday",
      text: english
        ? "Separate rates for Monday to Thursday and for the weekend."
        : "Tarifas propias de lunes a jueves y de fin de semana.",
      detail: english
        ? "Public holidays are charged at the weekend rate."
        : "Los festivos se cobran como fin de semana.",
    });
  }

  /* 3. Huésped adicional, con su precio propio entre semana si lo tiene. */
  if (config.extraPersonPriceCop !== null) {
    const price = formatCOP(config.extraPersonPriceCop);
    notes.push({
      key: "extra-guest",
      kind: "extra-guest",
      text: english
        ? `Extra guest: ${price} per night.`
        : `Huésped adicional: ${price} por noche.`,
      ...(config.extraPersonPriceWeekdayCop !== null
        ? {
            detail: english
              ? `${formatCOP(config.extraPersonPriceWeekdayCop)} from Monday to Thursday.`
              : `${formatCOP(config.extraPersonPriceWeekdayCop)} de lunes a jueves.`,
          }
        : {}),
    });
  }

  /* 4. Estancia mínima: una línea por temporada. */
  for (const line of minStaySummary(config.minStayRules, locale)) {
    notes.push({ key: `min-stay-${line}`, kind: "min-stay", text: `${line}.` });
  }

  /* 5. Lo que el texto libre añade y las columnas no cuentan. `config.rateNote`
        llega ya en el idioma que toca (columna `rate_note_en`), y los temas que
        se descartan por repetidos tienen su propio juego de patrones por
        idioma; ver `NOTE_TOPICS`. */
  const covered = new Set(notes.map((note) => note.kind));
  extraSentences(config.rateNote, covered, locale).forEach(
    (sentence, position) => {
      notes.push({ key: `other-${position}`, kind: "other", text: sentence });
    },
  );

  return notes;
}
