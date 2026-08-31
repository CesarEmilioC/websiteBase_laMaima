/**
 * Pruebas del motor de tarifas.
 *
 * Aquí se calcula dinero, así que los casos no son inventados: cada cifra sale
 * del documento oficial de tarifas de La Maima y de los datos sembrados en
 * Supabase. Si una de estas pruebas se pone en rojo, o cambió el documento o
 * el motor está cobrando mal.
 */
import { describe, expect, it } from "vitest";

import { weekdayIndex } from "./dates";
import {
  breakfastLabel,
  comparePlans,
  isNoDiscountSeason,
  lowestRate,
  minStaySummary,
  nightDayType,
  overlappingPlanPairs,
  planForNight,
  quote,
  rateNotes,
  tierRows,
  type Holiday,
  type MinStayRule,
  type RateConfig,
  type RatePlan,
  type RateTier,
} from "./pricing";

/* ---------------------------------------------------------------------------
 * Fixtures: los mismos datos que hay sembrados en la base
 * ------------------------------------------------------------------------- */

/** Festivos de Colombia usados en las pruebas (puente = festivo en lunes). */
const HOLIDAY_DATES = [
  "2026-01-01",
  "2026-01-12",
  "2026-03-23",
  "2026-04-02",
  "2026-04-03",
  "2026-05-01",
  "2026-05-18",
  "2026-06-08",
  "2026-06-15",
  "2026-06-29",
  "2026-07-20",
  "2026-08-07",
  "2026-08-17",
  "2026-10-12",
  "2026-11-02",
  "2026-11-16",
  "2026-12-08",
  "2026-12-25",
  "2027-01-01",
  "2027-01-11",
  "2027-03-22",
  "2027-03-25",
  "2027-03-26",
  "2027-05-01",
  "2027-05-10",
  "2027-05-31",
  "2027-06-07",
  "2027-07-05",
  "2027-07-20",
  "2027-08-07",
  "2027-08-16",
  "2027-10-18",
  "2027-11-01",
  "2027-11-15",
  "2027-12-08",
  "2027-12-25",
];

// `is_bridge` es una columna generada en Postgres (lunes = puente). Aquí se
// reproduce con la misma regla para que el fixture no pueda mentir.
const HOLIDAYS: Holiday[] = HOLIDAY_DATES.map((date) => ({
  date,
  is_bridge: weekdayIndex(date) === 0,
}));

const BRIDGE = { label: "Puentes festivos", rule_type: "holiday_bridge" as const, date_from: null, date_to: null };

function seasons(easterNights: number, decemberNights: number): MinStayRule[] {
  return [
    { ...BRIDGE, min_nights: 2 },
    {
      label: "Semana Santa 2027",
      rule_type: "date_range",
      date_from: "2027-03-21",
      date_to: "2027-03-28",
      min_nights: easterNights,
    },
    {
      label: "Semana Santa 2028",
      rule_type: "date_range",
      date_from: "2028-04-09",
      date_to: "2028-04-16",
      min_nights: easterNights,
    },
    {
      label: "Temporada 23 dic – 7 ene 2026/27",
      rule_type: "date_range",
      date_from: "2026-12-23",
      date_to: "2027-01-07",
      min_nights: decemberNights,
    },
  ];
}

function tiers(list: [number, number][], dayType: RateTier["day_type"] = "any"): RateTier[] {
  return list.map(([guests, price_cop]) => ({ guests, price_cop, day_type: dayType }));
}

const CASA_MAIMA: RateConfig = {
  capacity: 10,
  basePriceCop: 1400000,
  tiers: tiers([
    [8, 1400000],
    [10, 1700000],
  ]),
  extraPersonPriceCop: null,
  extraPersonPriceWeekdayCop: null,
  breakfastIncluded: false,
  breakfastPriceCop: 25000,
  weekdayDiscountPct: 25,
  rateNote: null,
  minStayRules: seasons(2, 3),
  ratePlans: [],
  holidays: HOLIDAYS,
};

const MIRADOR: RateConfig = {
  capacity: 5,
  basePriceCop: 545000,
  tiers: tiers([
    [1, 545000],
    [2, 570000],
    [3, 620000],
    [4, 645000],
  ]),
  extraPersonPriceCop: 75000,
  extraPersonPriceWeekdayCop: null,
  breakfastIncluded: true,
  breakfastPriceCop: null,
  weekdayDiscountPct: 25,
  rateNote: null,
  minStayRules: seasons(3, 4),
  ratePlans: [],
  holidays: HOLIDAYS,
};

const CASA_LOMA: RateConfig = {
  ...MIRADOR,
  capacity: 6,
  basePriceCop: 540000,
  tiers: tiers([
    [2, 540000],
    [3, 590000],
    [4, 615000],
    [5, 665000],
    [6, 720000],
  ]),
  minStayRules: seasons(3, 3),
};

const DOS_CASITAS: RateConfig = {
  ...MIRADOR,
  capacity: 4,
  basePriceCop: 495000,
  tiers: tiers([
    [2, 495000],
    [3, 545000],
    [4, 570000],
  ]),
  minStayRules: seasons(3, 3),
};

const TRES_CASITAS: RateConfig = {
  capacity: 3,
  basePriceCop: 290000,
  tiers: [
    ...tiers(
      [
        [1, 390000],
        [2, 415000],
      ],
      "weekend",
    ),
    ...tiers(
      [
        [1, 290000],
        [2, 310000],
      ],
      "weekday",
    ),
  ],
  extraPersonPriceCop: 75000,
  extraPersonPriceWeekdayCop: 55000,
  breakfastIncluded: false,
  breakfastPriceCop: null,
  weekdayDiscountPct: null,
  rateNote: null,
  minStayRules: seasons(3, 3),
  ratePlans: [],
  holidays: HOLIDAYS,
};

/** Casa Uba no aparece en el documento del cliente: no tiene tabla todavía. */
const CASA_UBA: RateConfig = {
  capacity: 4,
  basePriceCop: 450000,
  tiers: [],
  extraPersonPriceCop: null,
  extraPersonPriceWeekdayCop: null,
  breakfastIncluded: false,
  breakfastPriceCop: null,
  weekdayDiscountPct: null,
  rateNote: null,
  minStayRules: [],
  ratePlans: [],
  holidays: HOLIDAYS,
};

/* --- Fechas de referencia --------------------------------------------------
 * Septiembre de 2026 no tiene ningún festivo, así que sirve de laboratorio
 * limpio para separar "fin de semana" de "entre semana".
 * ------------------------------------------------------------------------ */
const TUE = "2026-09-01"; // martes normal
const WED = "2026-09-02";
const FRI = "2026-09-04";
const SAT = "2026-09-05";
const SUN = "2026-09-06";
const MON = "2026-09-07";

/** Precio de una sola noche, que es como se lee el documento. */
function oneNight(config: RateConfig, date: string, guests: number): number {
  return quote(config, date, addOneDay(date), guests).totalCop;
}

function addOneDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/* ---------------------------------------------------------------------------
 * Tipo de noche
 * ------------------------------------------------------------------------- */

describe("tipo de noche", () => {
  const set = new Set(HOLIDAY_DATES);

  it("cuenta lunes a jueves no festivos como entre semana", () => {
    expect(nightDayType(MON, set)).toBe("weekday");
    expect(nightDayType(TUE, set)).toBe("weekday");
    expect(nightDayType(WED, set)).toBe("weekday");
    expect(nightDayType("2026-09-03", set)).toBe("weekday"); // jueves
  });

  it("cuenta viernes, sábado y domingo como fin de semana", () => {
    expect(nightDayType(FRI, set)).toBe("weekend");
    expect(nightDayType(SAT, set)).toBe("weekend");
    expect(nightDayType(SUN, set)).toBe("weekend");
  });

  it("cuenta un festivo entre semana como fin de semana", () => {
    // 12 de octubre de 2026 es lunes festivo (Día de la Raza).
    expect(weekdayIndex("2026-10-12")).toBe(0);
    expect(nightDayType("2026-10-12", set)).toBe("weekend");
    // 8 de diciembre de 2026 es martes festivo (Inmaculada).
    expect(weekdayIndex("2026-12-08")).toBe(1);
    expect(nightDayType("2026-12-08", set)).toBe("weekend");
  });
});

describe("temporada sin descuento (14 dic – 15 ene)", () => {
  it("cubre el tramo de diciembre y el de enero", () => {
    expect(isNoDiscountSeason("2026-12-14")).toBe(true);
    expect(isNoDiscountSeason("2026-12-31")).toBe(true);
    expect(isNoDiscountSeason("2027-01-15")).toBe(true);
  });

  it("deja fuera lo anterior y lo posterior", () => {
    expect(isNoDiscountSeason("2026-12-13")).toBe(false);
    expect(isNoDiscountSeason("2027-01-16")).toBe(false);
    expect(isNoDiscountSeason("2026-09-01")).toBe(false);
  });
});

/* ---------------------------------------------------------------------------
 * Precio por ocupación, cabaña por cabaña
 * ------------------------------------------------------------------------- */

describe("Casa Maima", () => {
  it("cobra el tramo de hasta 8 personas", () => {
    expect(oneNight(CASA_MAIMA, SAT, 8)).toBe(1400000);
    expect(oneNight(CASA_MAIMA, SAT, 4)).toBe(1400000);
  });

  it("cobra el tramo de 10 a partir de la novena persona", () => {
    // El documento no publica precio para 9: se sube al tramo siguiente en vez
    // de cobrar de menos.
    expect(oneNight(CASA_MAIMA, SAT, 9)).toBe(1700000);
    expect(oneNight(CASA_MAIMA, SAT, 10)).toBe(1700000);
  });

  it("aplica el 25 % de lunes a jueves", () => {
    expect(oneNight(CASA_MAIMA, TUE, 8)).toBe(1050000);
    expect(oneNight(CASA_MAIMA, TUE, 10)).toBe(1275000);
  });

  it("anuncia el desayuno aparte y lo cotiza fuera del total", () => {
    const result = quote(CASA_MAIMA, SAT, SUN, 8);
    expect(result.breakfast?.included).toBe(false);
    expect(result.breakfast?.pricePerPersonCop).toBe(25000);
    expect(result.breakfast?.optionalTotalCop).toBe(25000 * 8);
    expect(result.totalCop).toBe(1400000); // el desayuno no entra en el total
  });
});

describe("Mirador", () => {
  it("cobra $570.000 para 2 personas en fin de semana", () => {
    expect(oneNight(MIRADOR, SAT, 2)).toBe(570000);
  });

  it("cobra $427.500 para 2 personas un martes no festivo", () => {
    expect(oneNight(MIRADOR, TUE, 2)).toBe(427500);
  });

  it("sigue la tabla completa del documento", () => {
    expect(oneNight(MIRADOR, SAT, 1)).toBe(545000);
    expect(oneNight(MIRADOR, SAT, 3)).toBe(620000);
    expect(oneNight(MIRADOR, SAT, 4)).toBe(645000);
  });

  it("suma $75.000 por la quinta persona en sofá cama", () => {
    expect(oneNight(MIRADOR, SAT, 5)).toBe(645000 + 75000);
  });

  it("descuenta solo la tarifa base, no al huésped adicional", () => {
    // 645.000 × 0,75 = 483.750, más los 75.000 del sofá cama.
    expect(oneNight(MIRADOR, TUE, 5)).toBe(483750 + 75000);
  });

  it("anuncia el desayuno incluido", () => {
    expect(breakfastLabel(MIRADOR)).toBe("Desayuno incluido");
    expect(quote(MIRADOR, SAT, SUN, 2).breakfast?.included).toBe(true);
  });
});

describe("Casa Loma", () => {
  it("cobra el tramo mínimo de 2 personas aunque viaje una sola", () => {
    expect(oneNight(CASA_LOMA, SAT, 1)).toBe(540000);
    expect(oneNight(CASA_LOMA, SAT, 2)).toBe(540000);
  });

  it("sigue la tabla hasta 6 personas", () => {
    expect(oneNight(CASA_LOMA, SAT, 3)).toBe(590000);
    expect(oneNight(CASA_LOMA, SAT, 4)).toBe(615000);
    expect(oneNight(CASA_LOMA, SAT, 5)).toBe(665000);
    expect(oneNight(CASA_LOMA, SAT, 6)).toBe(720000);
  });

  it("aplica el 25 % entre semana", () => {
    expect(oneNight(CASA_LOMA, TUE, 4)).toBe(461250);
  });
});

describe("Dos Casitas", () => {
  it("sigue la tabla del documento", () => {
    expect(oneNight(DOS_CASITAS, SAT, 2)).toBe(495000);
    expect(oneNight(DOS_CASITAS, SAT, 3)).toBe(545000);
    expect(oneNight(DOS_CASITAS, SAT, 4)).toBe(570000);
  });

  it("aplica el 25 % entre semana", () => {
    expect(oneNight(DOS_CASITAS, TUE, 2)).toBe(371250);
    expect(oneNight(DOS_CASITAS, WED, 3)).toBe(408750);
  });
});

describe("Tres Casitas (dos tablas propias)", () => {
  it("usa la tabla de fin de semana los viernes, sábados y domingos", () => {
    expect(oneNight(TRES_CASITAS, SAT, 1)).toBe(390000);
    expect(oneNight(TRES_CASITAS, SAT, 2)).toBe(415000);
    expect(oneNight(TRES_CASITAS, FRI, 2)).toBe(415000);
  });

  it("usa la tabla de lunes a jueves y NO le aplica el 25 %", () => {
    expect(oneNight(TRES_CASITAS, MON, 1)).toBe(290000);
    expect(oneNight(TRES_CASITAS, TUE, 2)).toBe(310000);
    // Si se hubiera aplicado el descuento saldría 232.500: no debe pasar.
    expect(oneNight(TRES_CASITAS, TUE, 1)).not.toBe(217500);
  });

  it("cobra la tercera persona a $75.000 en fin de semana y a $55.000 entre semana", () => {
    expect(oneNight(TRES_CASITAS, SAT, 3)).toBe(415000 + 75000);
    expect(oneNight(TRES_CASITAS, TUE, 3)).toBe(310000 + 55000);
  });

  it("vuelve a la tabla de fin de semana en un lunes festivo", () => {
    expect(oneNight(TRES_CASITAS, "2026-10-12", 2)).toBe(415000);
  });

  it("no promete desayuno: el documento no lo menciona", () => {
    expect(breakfastLabel(TRES_CASITAS)).toBeNull();
    expect(quote(TRES_CASITAS, SAT, SUN, 2).breakfast).toBeNull();
  });
});

describe("alojamiento sin tabla publicada (Casa Uba)", () => {
  it("cae al precio de respaldo sin romperse", () => {
    expect(oneNight(CASA_UBA, SAT, 2)).toBe(450000);
    expect(oneNight(CASA_UBA, TUE, 4)).toBe(450000);
  });
});

/* ---------------------------------------------------------------------------
 * Estadías que mezclan tipos de noche
 * ------------------------------------------------------------------------- */

describe("estadías con noches mezcladas", () => {
  it("suma noche a noche y agrupa el desglose", () => {
    // Viernes, sábado y domingo a tarifa plena; lunes con 25 %.
    const result = quote(MIRADOR, FRI, "2026-09-08", 2);

    expect(result.nights).toBe(4);
    expect(result.totalCop).toBe(570000 * 3 + 427500);
    expect(result.lines).toHaveLength(2);

    const [weekend, weekday] = result.lines;
    expect(weekend.nights).toBe(3);
    expect(weekend.unitCop).toBe(570000);
    expect(weekend.label).toBe("3 noches × $570.000");
    expect(weekday.nights).toBe(1);
    expect(weekday.unitCop).toBe(427500);
    expect(weekday.label).toBe("1 noche × $427.500");
    expect(weekday.detail).toContain("25 % de descuento");
  });

  it("da un promedio por noche coherente con el total", () => {
    const result = quote(MIRADOR, FRI, "2026-09-08", 2);
    expect(result.averageNightCop * result.nights).toBeCloseTo(
      result.totalCop,
      -3,
    );
  });

  it("no descuenta las noches entre semana de la temporada de fin de año", () => {
    // 15 de diciembre de 2026 es martes, pero cae dentro del 14 dic – 15 ene.
    expect(weekdayIndex("2026-12-15")).toBe(1);
    expect(oneNight(MIRADOR, "2026-12-15", 2)).toBe(570000);
    // 19 de enero de 2027 es martes y ya está fuera de la temporada.
    expect(weekdayIndex("2027-01-19")).toBe(1);
    expect(oneNight(MIRADOR, "2027-01-19", 2)).toBe(427500);
  });

  it("cobra tarifa plena la noche de un lunes festivo", () => {
    expect(oneNight(MIRADOR, "2026-10-12", 2)).toBe(570000);
  });
});

/* ---------------------------------------------------------------------------
 * Estancia mínima
 * ------------------------------------------------------------------------- */

describe("estancia mínima en puentes festivos", () => {
  // 12 de octubre de 2026 es lunes festivo: el puente son las noches del
  // sábado 10 y del domingo 11.
  it("exige 2 noches si la estadía toca el sábado o el domingo del puente", () => {
    const issue = quote(MIRADOR, "2026-10-10", "2026-10-11", 2).minStay;
    expect(issue?.requiredNights).toBe(2);
    expect(issue?.message).toBe(
      "En puentes festivos la estancia mínima es de 2 noches.",
    );
  });

  it("acepta la estadía cuando ya son 2 noches", () => {
    expect(quote(MIRADOR, "2026-10-10", "2026-10-12", 2).minStay).toBeNull();
  });

  it("no exige nada en un fin de semana corriente", () => {
    expect(quote(MIRADOR, SAT, SUN, 2).minStay).toBeNull();
  });
});

describe("estancia mínima por temporada", () => {
  it("pide 3 noches en Semana Santa en el Mirador y 2 en Casa Maima", () => {
    const dates = ["2027-03-25", "2027-03-27"] as const;

    expect(quote(MIRADOR, dates[0], dates[1], 2).minStay?.requiredNights).toBe(3);
    expect(quote(CASA_MAIMA, dates[0], dates[1], 8).minStay).toBeNull();
  });

  it("pide 4 noches en el Mirador y 3 en las demás entre el 23 dic y el 7 ene", () => {
    expect(
      quote(MIRADOR, "2026-12-26", "2026-12-29", 2).minStay?.requiredNights,
    ).toBe(4);
    expect(
      quote(CASA_LOMA, "2026-12-26", "2026-12-29", 2).minStay,
    ).toBeNull();
    expect(
      quote(CASA_LOMA, "2026-12-26", "2026-12-28", 2).minStay?.requiredNights,
    ).toBe(3);
  });

  it("se queda con la exigencia más alta cuando dos reglas se cruzan", () => {
    // Fin de año: la temporada (4 noches en el Mirador) manda sobre el
    // puente de Año Nuevo (2 noches).
    const issue = quote(MIRADOR, "2026-12-31", "2027-01-02", 2).minStay;
    expect(issue?.requiredNights).toBe(4);
  });

  it("redacta el mensaje con el nombre de la temporada", () => {
    const issue = quote(MIRADOR, "2027-03-25", "2027-03-27", 2).minStay;
    expect(issue?.message).toBe(
      "En semana Santa 2027 la estancia mínima es de 3 noches.",
    );
  });
});

/* ---------------------------------------------------------------------------
 * Paquetes (rate_plans)
 * ------------------------------------------------------------------------- */

describe("paquetes", () => {
  const SAN_VALENTIN: RateConfig = {
    ...MIRADOR,
    ratePlans: [
      {
        name: "San Valentín",
        description: "Cena incluida",
        date_from: "2027-02-13",
        date_to: "2027-02-14",
        price_per_night_cop: 800000,
        guests_included: 2,
      },
    ],
  };

  it("el precio del paquete manda sobre la tabla por ocupación", () => {
    // 2027-02-13 es sábado; sin paquete costaría 570.000.
    expect(oneNight(SAN_VALENTIN, "2027-02-13", 2)).toBe(800000);
  });

  it("el paquete anula el descuento entre semana", () => {
    // 2027-02-15 (lunes) ya está fuera del paquete: vuelve el 25 %.
    expect(oneNight(SAN_VALENTIN, "2027-02-15", 2)).toBe(427500);
    // Dentro del paquete no hay descuento aunque la noche sea entre semana.
    const inside: RateConfig = {
      ...SAN_VALENTIN,
      ratePlans: [
        { ...SAN_VALENTIN.ratePlans[0], date_from: TUE, date_to: TUE },
      ],
    };
    expect(oneNight(inside, TUE, 2)).toBe(800000);
  });

  it("cobra huéspedes por encima de los que incluye el paquete", () => {
    expect(oneNight(SAN_VALENTIN, "2027-02-13", 3)).toBe(800000 + 75000);
  });

  it("expone el nombre del paquete en la cotización", () => {
    const result = quote(SAN_VALENTIN, "2027-02-13", "2027-02-15", 2);
    expect(result.planNames).toEqual(["San Valentín"]);
    expect(result.lines[0].detail).toContain("San Valentín");
  });

  it("fuera del rango del paquete se vuelve a la tabla por ocupación", () => {
    // 2027-02-12 (viernes) es el día anterior al paquete.
    expect(oneNight(SAN_VALENTIN, "2027-02-12", 2)).toBe(570000);
    // 2027-02-15 (lunes) es el día siguiente: vuelve el 25 %.
    expect(oneNight(SAN_VALENTIN, "2027-02-15", 2)).toBe(427500);
    const result = quote(SAN_VALENTIN, "2027-02-15", "2027-02-16", 2);
    expect(result.planNames).toEqual([]);
  });

  it("un plan sin precio propio solo pone nombre a la temporada", () => {
    const sinPrecio: RateConfig = {
      ...MIRADOR,
      ratePlans: [
        {
          name: "Temporada de avistamiento",
          description: null,
          date_from: SAT,
          date_to: SAT,
          price_per_night_cop: null,
          guests_included: null,
        },
      ],
    };
    // Se sigue cobrando la tabla…
    expect(oneNight(sinPrecio, SAT, 2)).toBe(570000);
    // …pero el nombre viaja hasta el desglose.
    expect(quote(sinPrecio, SAT, SUN, 2).planNames).toEqual([
      "Temporada de avistamiento",
    ]);
  });

  it("sin huéspedes incluidos el precio del plan cubre a todo el grupo", () => {
    const abierto: RateConfig = {
      ...MIRADOR,
      ratePlans: [
        {
          name: "Puente con cena",
          description: null,
          date_from: SAT,
          date_to: SAT,
          price_per_night_cop: 900000,
          guests_included: null,
        },
      ],
    };
    expect(oneNight(abierto, SAT, 4)).toBe(900000);
  });
});

/* ---------------------------------------------------------------------------
 * Precedencia entre planes que se cruzan
 * ------------------------------------------------------------------------- */

describe("precedencia entre planes", () => {
  function plan(overrides: Partial<RatePlan> & { name: string }): RatePlan {
    return {
      description: null,
      date_from: "2027-02-13",
      date_to: "2027-02-14",
      price_per_night_cop: 800000,
      guests_included: 2,
      ...overrides,
    };
  }

  const DEL_ALOJAMIENTO = plan({
    name: "San Valentín en el Mirador",
    price_per_night_cop: 900000,
  });
  const DE_TODOS = plan({
    name: "San Valentín en toda la reserva",
    price_per_night_cop: 800000,
    appliesToAll: true,
  });

  it("1) el plan del alojamiento gana al de todos los alojamientos", () => {
    // El de "todos" va primero en la lista y aun así pierde: manda el alcance,
    // no el orden en que llegaron las filas.
    expect(planForNight([DE_TODOS, DEL_ALOJAMIENTO], "2027-02-13")?.name).toBe(
      DEL_ALOJAMIENTO.name,
    );

    const config: RateConfig = {
      ...MIRADOR,
      ratePlans: [DE_TODOS, DEL_ALOJAMIENTO],
    };
    expect(oneNight(config, "2027-02-13", 2)).toBe(900000);
  });

  it("2) a igual alcance gana el número de orden más bajo", () => {
    const primero = plan({ name: "Cumpleaños", sort: 0, price_per_night_cop: 700000 });
    const segundo = plan({ name: "Aniversario", sort: 5, price_per_night_cop: 990000 });

    expect(planForNight([segundo, primero], "2027-02-13")?.name).toBe("Cumpleaños");

    const config: RateConfig = { ...MIRADOR, ratePlans: [segundo, primero] };
    expect(oneNight(config, "2027-02-13", 2)).toBe(700000);
  });

  it("3) a igual orden gana el plan de rango más corto", () => {
    const temporada = plan({
      name: "Temporada de febrero",
      date_from: "2027-02-01",
      date_to: "2027-02-28",
      price_per_night_cop: 650000,
    });
    const finDeSemana = plan({
      name: "Fin de semana temático",
      date_from: "2027-02-13",
      date_to: "2027-02-14",
      price_per_night_cop: 880000,
    });

    expect(planForNight([temporada, finDeSemana], "2027-02-13")?.name).toBe(
      "Fin de semana temático",
    );
    // Y en un día que solo cubre la temporada, manda la temporada.
    expect(planForNight([temporada, finDeSemana], "2027-02-20")?.name).toBe(
      "Temporada de febrero",
    );
  });

  it("4) el último desempate es alfabético, para que no dependa del azar", () => {
    const a = plan({ name: "Abril florecido" });
    const z = plan({ name: "Zafra" });

    expect(comparePlans(a, z)).toBeLessThan(0);
    expect(planForNight([z, a], "2027-02-13")?.name).toBe("Abril florecido");
  });

  it("detecta los solapes para poder avisar en el panel", () => {
    const enero = plan({
      name: "Enero",
      date_from: "2027-01-01",
      date_to: "2027-01-15",
    });
    const febrero = plan({
      name: "Febrero",
      date_from: "2027-02-01",
      date_to: "2027-02-28",
    });
    const puente = plan({
      name: "Puente de febrero",
      date_from: "2027-02-13",
      date_to: "2027-02-15",
    });

    expect(overlappingPlanPairs([enero, febrero])).toEqual([]);

    const pairs = overlappingPlanPairs([enero, febrero, puente]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].map((item) => item.name)).toEqual([
      "Febrero",
      "Puente de febrero",
    ]);
  });

  it("un solo plan cubre la noche cuando el otro ya terminó", () => {
    const viejo = plan({
      name: "Plan viejo",
      date_from: "2026-12-01",
      date_to: "2026-12-31",
    });
    expect(planForNight([viejo, DEL_ALOJAMIENTO], "2027-02-13")?.name).toBe(
      DEL_ALOJAMIENTO.name,
    );
    expect(planForNight([viejo, DEL_ALOJAMIENTO], "2026-12-05")?.name).toBe(
      "Plan viejo",
    );
    expect(planForNight([viejo, DEL_ALOJAMIENTO], "2027-06-01")).toBeNull();
  });
});

/* ---------------------------------------------------------------------------
 * Tarifa "Desde" y textos de la ficha
 * ------------------------------------------------------------------------- */

describe("tarifa Desde", () => {
  it("toma el tramo más bajo publicado", () => {
    expect(lowestRate(MIRADOR.tiers, MIRADOR.basePriceCop)).toEqual({
      amountCop: 545000,
      guests: 1,
      dayType: "any",
    });
    expect(lowestRate(CASA_MAIMA.tiers, CASA_MAIMA.basePriceCop).amountCop).toBe(
      1400000,
    );
    expect(lowestRate(CASA_LOMA.tiers, CASA_LOMA.basePriceCop).amountCop).toBe(
      540000,
    );
  });

  it("en Tres Casitas es el tramo de lunes a jueves", () => {
    expect(lowestRate(TRES_CASITAS.tiers, TRES_CASITAS.basePriceCop)).toEqual({
      amountCop: 290000,
      guests: 1,
      dayType: "weekday",
    });
  });

  it("cae al precio de respaldo sin tabla", () => {
    expect(lowestRate([], 450000).amountCop).toBe(450000);
  });
});

describe("tabla de precios de la ficha", () => {
  it("marca 'Hasta' cuando el tramo cubre varias ocupaciones", () => {
    expect(tierRows(CASA_MAIMA.tiers).map((row) => row.label)).toEqual([
      "Hasta 8 personas",
      "Hasta 10 personas",
    ]);
    expect(tierRows(CASA_LOMA.tiers)[0].label).toBe("Hasta 2 personas");
  });

  /* Decisión del cliente: TODAS las filas dicen "Hasta N personas", también
     cuando los tramos van de uno en uno. El número seco ("2 personas") se leía
     como una cuota por cabeza y no lo es. */
  it("escribe 'Hasta' también cuando los tramos van de uno en uno", () => {
    expect(tierRows(MIRADOR.tiers).map((row) => row.label)).toEqual([
      "Hasta 1 persona",
      "Hasta 2 personas",
      "Hasta 3 personas",
      "Hasta 4 personas",
    ]);
  });

  it("distingue las dos tablas de Tres Casitas", () => {
    expect(tierRows(TRES_CASITAS.tiers).map((row) => row.label)).toEqual([
      "Hasta 1 persona · fin de semana",
      "Hasta 2 personas · fin de semana",
      "Hasta 1 persona · lunes a jueves",
      "Hasta 2 personas · lunes a jueves",
    ]);
  });
});

describe("resumen de estancias mínimas", () => {
  it("no repite la misma temporada de dos años distintos", () => {
    expect(minStaySummary(MIRADOR.minStayRules)).toEqual([
      "Puentes festivos: mínimo 2 noches",
      "Semana Santa: mínimo 3 noches",
      "Temporada 23 dic – 7 ene: mínimo 4 noches",
    ]);
  });
});

/* ---------------------------------------------------------------------------
 * Notas de la tarifa en puntos
 *
 * Lo que se prueba aquí no es texto bonito: es que cada dato salga del CAMPO
 * que le corresponde (y no del párrafo que escribe el cliente a mano), porque
 * de eso depende que la ficha siga diciendo la verdad cuando la administradora
 * cambie un precio desde el panel.
 * ------------------------------------------------------------------------- */
describe("notas de la tarifa", () => {
  it("saca el desayuno de los campos, no del texto libre", () => {
    const [breakfast] = rateNotes(CASA_MAIMA);
    expect(breakfast.kind).toBe("breakfast");
    expect(breakfast.text).toBe(
      "El desayuno no está incluido: $25.000 por persona.",
    );

    expect(rateNotes(MIRADOR)[0].text).toBe("Desayuno incluido en la tarifa.");
  });

  it("pone la excepción del descuento en la línea de matiz, no en la principal", () => {
    const weekday = rateNotes(CASA_MAIMA).find(
      (note) => note.kind === "weekday",
    );
    expect(weekday?.text).toBe("25 % de descuento de lunes a jueves.");
    expect(weekday?.detail).toContain("14 de diciembre");
  });

  it("anuncia las dos tablas de Tres Casitas en vez de un descuento", () => {
    const notes = rateNotes(TRES_CASITAS);
    const weekday = notes.find((note) => note.kind === "weekday");
    expect(weekday?.text).toBe(
      "Tarifas propias de lunes a jueves y de fin de semana.",
    );

    // Y su huésped adicional tiene precio propio entre semana.
    const extra = notes.find((note) => note.kind === "extra-guest");
    expect(extra?.text).toBe("Huésped adicional: $75.000 por noche.");
    expect(extra?.detail).toBe("$55.000 de lunes a jueves.");
  });

  it("omite el huésped adicional cuando la cabaña no lo cobra", () => {
    expect(rateNotes(CASA_MAIMA).some((note) => note.kind === "extra-guest"))
      .toBe(false);
  });

  it("añade una línea por temporada con estancia mínima", () => {
    const minStay = rateNotes(MIRADOR).filter(
      (note) => note.kind === "min-stay",
    );
    expect(minStay.map((note) => note.text)).toEqual([
      "Puentes festivos: mínimo 2 noches.",
      "Semana Santa: mínimo 3 noches.",
      "Temporada 23 dic – 7 ene: mínimo 4 noches.",
    ]);
  });

  it("no repite en prosa lo que los campos ya dijeron", () => {
    // El `rate_note` real de Casa Maima: las dos frases ya son puntos.
    const notes = rateNotes({
      ...CASA_MAIMA,
      rateNote:
        "El desayuno no está incluido: $25.000 por persona. Descuento del 25% de lunes a jueves no festivos, salvo del 14 de diciembre al 15 de enero.",
    });
    expect(notes.some((note) => note.kind === "other")).toBe(false);
  });

  it("sí publica lo que el texto libre añade y los campos no cuentan", () => {
    const notes = rateNotes({
      ...CASA_MAIMA,
      rateNote:
        "Desayuno incluido. La leña de la fogata se cobra aparte en recepción.",
    });
    const extra = notes.filter((note) => note.kind === "other");
    expect(extra).toHaveLength(1);
    expect(extra[0].text).toBe(
      "La leña de la fogata se cobra aparte en recepción.",
    );
  });

  it("no dice nada de una cabaña sin tarifas publicadas", () => {
    expect(rateNotes(CASA_UBA)).toEqual([]);
  });
});
