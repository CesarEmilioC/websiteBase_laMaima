/**
 * Pruebas del hold de 48 horas.
 *
 * Esta es la regla más delicada del motor: decide qué ocupa el calendario que
 * ven el sitio, Airbnb y Booking a la vez. Un fallo aquí no se ve —no rompe
 * ninguna pantalla— y se manifiesta como dos grupos en la misma cabaña.
 *
 * El reloj se inyecta en todas las funciones, así que las pruebas son
 * deterministas y no dependen de la hora a la que se ejecuten.
 */
import { describe, expect, it } from "vitest";

import {
  EXPIRING_SOON_HOURS,
  HOLD_HOURS,
  formatHoldCountdownEs,
  holdExpiresAt,
  holdMinutesLeft,
  isExpiringSoon,
  isHoldExpired,
  occupiesCalendar,
} from "./holds";

const NOW = new Date("2026-09-01T12:00:00.000Z");
const hoursFromNow = (hours: number) =>
  new Date(NOW.getTime() + hours * 3600_000).toISOString();

describe("holdExpiresAt", () => {
  it("aparta las fechas exactamente 48 horas", () => {
    expect(HOLD_HOURS).toBe(48);
    const expires = holdExpiresAt(NOW);
    expect(expires.getTime() - NOW.getTime()).toBe(48 * 3600_000);
  });
});

describe("isHoldExpired", () => {
  it("un pending con vencimiento futuro sigue vivo", () => {
    expect(isHoldExpired("pending", hoursFromNow(1), NOW)).toBe(false);
  });

  it("un pending con vencimiento pasado está vencido", () => {
    expect(isHoldExpired("pending", hoursFromNow(-1), NOW)).toBe(true);
  });

  it("el instante exacto del vencimiento ya cuenta como vencido", () => {
    // El límite se cierra hacia el pasado: a las 48 h en punto las fechas ya
    // están libres. Si no, quedaría un segundo en el que ni ocupa ni está
    // liberado, y el barrido y la comprobación discreparían.
    expect(isHoldExpired("pending", NOW.toISOString(), NOW)).toBe(true);
  });

  it("un pending SIN vencimiento no vence nunca", () => {
    // Es el caso de las reservas que registra el equipo a mano: nacen
    // pendientes pero sin reloj.
    expect(isHoldExpired("pending", null, NOW)).toBe(false);
    expect(isHoldExpired("pending", undefined, NOW)).toBe(false);
  });

  it("solo vencen los pending", () => {
    // Una confirmada o una pagada que arrastre un `expires_at` de su vida
    // anterior no puede liberarse sola.
    for (const status of ["confirmed", "paid", "external", "cancelled"]) {
      expect(isHoldExpired(status, hoursFromNow(-100), NOW)).toBe(false);
    }
  });

  it("una fecha ilegible no vence (mejor ocupar de más que de menos)", () => {
    expect(isHoldExpired("pending", "no-es-una-fecha", NOW)).toBe(false);
  });
});

describe("occupiesCalendar", () => {
  it("lo cancelado nunca ocupa", () => {
    expect(occupiesCalendar({ status: "cancelled" }, NOW)).toBe(false);
    expect(
      occupiesCalendar({ status: "cancelled", expires_at: hoursFromNow(5) }, NOW),
    ).toBe(false);
  });

  it("confirmed, paid y external ocupan siempre", () => {
    for (const status of ["confirmed", "paid", "external"]) {
      expect(occupiesCalendar({ status, expires_at: null }, NOW)).toBe(true);
      expect(occupiesCalendar({ status, expires_at: hoursFromNow(-99) }, NOW)).toBe(
        true,
      );
    }
  });

  it("un pending ocupa mientras su hold esté vivo", () => {
    expect(
      occupiesCalendar({ status: "pending", expires_at: hoursFromNow(12) }, NOW),
    ).toBe(true);
  });

  it("un pending vencido NO ocupa: es la razón de ser de todo esto", () => {
    expect(
      occupiesCalendar({ status: "pending", expires_at: hoursFromNow(-1) }, NOW),
    ).toBe(false);
  });

  it("un pending manual (sin vencimiento) ocupa", () => {
    expect(occupiesCalendar({ status: "pending", expires_at: null }, NOW)).toBe(
      true,
    );
  });
});

describe("holdMinutesLeft", () => {
  it("cuenta los minutos que quedan", () => {
    expect(holdMinutesLeft(hoursFromNow(2), NOW)).toBe(120);
  });

  it("es negativo cuando ya venció", () => {
    expect(holdMinutesLeft(hoursFromNow(-0.5), NOW)).toBe(-30);
  });

  it("es null cuando no hay vencimiento", () => {
    expect(holdMinutesLeft(null, NOW)).toBeNull();
    expect(holdMinutesLeft("basura", NOW)).toBeNull();
  });
});

describe("formatHoldCountdownEs", () => {
  it("redondea a minutos cuando falta menos de una hora", () => {
    expect(formatHoldCountdownEs(hoursFromNow(0.75), NOW)).toBe("Vence en 45 min");
  });

  it("da horas y minutos cuando falta más", () => {
    expect(formatHoldCountdownEs(hoursFromNow(12.5), NOW)).toBe(
      "Vence en 12 h 30 min",
    );
  });

  it("omite los minutos cuando son cero", () => {
    expect(formatHoldCountdownEs(hoursFromNow(6), NOW)).toBe("Vence en 6 h");
  });

  it("dice cuánto hace que venció", () => {
    expect(formatHoldCountdownEs(hoursFromNow(-0.5), NOW)).toBe(
      "Vencido hace 30 min",
    );
    expect(formatHoldCountdownEs(hoursFromNow(-3), NOW)).toBe("Vencido hace 3 h");
  });

  it("no dice nada si la reserva no vence", () => {
    expect(formatHoldCountdownEs(null, NOW)).toBeNull();
  });
});

describe("isExpiringSoon", () => {
  it("marca los holds que caducan dentro del margen de urgencia", () => {
    expect(EXPIRING_SOON_HOURS).toBe(12);
    expect(isExpiringSoon("pending", hoursFromNow(2), NOW)).toBe(true);
    expect(isExpiringSoon("pending", hoursFromNow(11.9), NOW)).toBe(true);
  });

  it("no marca los que aún tienen margen", () => {
    expect(isExpiringSoon("pending", hoursFromNow(24), NOW)).toBe(false);
  });

  it("no marca los ya vencidos: eso es otro aviso", () => {
    expect(isExpiringSoon("pending", hoursFromNow(-1), NOW)).toBe(false);
  });

  it("no marca lo que no está pendiente", () => {
    expect(isExpiringSoon("confirmed", hoursFromNow(2), NOW)).toBe(false);
  });

  it("no marca lo que no vence", () => {
    expect(isExpiringSoon("pending", null, NOW)).toBe(false);
  });
});
