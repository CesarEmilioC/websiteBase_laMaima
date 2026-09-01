/**
 * Pruebas del mapeo de errores de Postgres.
 *
 * Es poco código y muy fácil de romper sin enterarse: los códigos SQLSTATE son
 * cadenas mágicas y confundir `23P01` con `23505` cambia por completo lo que
 * hace el motor. Uno significa "alguien se quedó con las fechas, dile al
 * huésped y para"; el otro significa "el código de reserva salió repetido,
 * sortea otro y reintenta". Reintentar el primero sería un bucle infinito;
 * abandonar el segundo, un fallo gratuito.
 */
import { describe, expect, it } from "vitest";

import { en } from "../i18n/en";
import { es } from "../i18n/es";
import {
  PG_EXCLUSION_VIOLATION,
  PG_UNIQUE_VIOLATION,
  failureFromPostgres,
  isBookingCodeCollision,
  isExclusionViolation,
  isUniqueViolation,
  type BookingFailure,
} from "./result";

const exclusion = {
  code: PG_EXCLUSION_VIOLATION,
  message:
    'conflicting key value violates exclusion constraint "bookings_no_overlap"',
};

const codeCollision = {
  code: PG_UNIQUE_VIOLATION,
  message:
    'duplicate key value violates unique constraint "bookings_booking_code_key"',
};

const otherUnique = {
  code: PG_UNIQUE_VIOLATION,
  message: 'duplicate key value violates unique constraint "accommodations_slug_key"',
};

describe("códigos SQLSTATE", () => {
  it("son los que Postgres usa de verdad", () => {
    expect(PG_EXCLUSION_VIOLATION).toBe("23P01");
    expect(PG_UNIQUE_VIOLATION).toBe("23505");
  });
});

describe("isExclusionViolation", () => {
  it("reconoce el choque de la restricción anti-solape", () => {
    expect(isExclusionViolation(exclusion)).toBe(true);
  });

  it("no confunde un choque de unicidad con uno de solape", () => {
    expect(isExclusionViolation(codeCollision)).toBe(false);
    expect(isExclusionViolation(null)).toBe(false);
    expect(isExclusionViolation({ code: "42P01", message: "no existe" })).toBe(
      false,
    );
  });
});

describe("isBookingCodeCollision", () => {
  it("reconoce el código de reserva repetido, que SÍ se reintenta", () => {
    expect(isUniqueViolation(codeCollision)).toBe(true);
    expect(isBookingCodeCollision(codeCollision)).toBe(true);
  });

  it("no reintenta cualquier otro choque de unicidad", () => {
    // Reintentar a ciegas cualquier 23505 sería girar en el vacío hasta agotar
    // los intentos por un problema que no tiene nada que ver con el código.
    expect(isUniqueViolation(otherUnique)).toBe(true);
    expect(isBookingCodeCollision(otherUnique)).toBe(false);
  });

  it("no confunde el solape con un código repetido", () => {
    expect(isBookingCodeCollision(exclusion)).toBe(false);
    expect(isBookingCodeCollision(null)).toBe(false);
  });
});

describe("failureFromPostgres", () => {
  it("traduce el solape al mensaje amable del huésped", () => {
    expect(failureFromPostgres(exclusion)).toBe("dates-taken");
  });

  it("todo lo demás es un fallo del servidor", () => {
    expect(failureFromPostgres(otherUnique)).toBe("server");
    expect(failureFromPostgres(null)).toBe("server");
    expect(failureFromPostgres({ code: "08006", message: "conexión caída" })).toBe(
      "server",
    );
  });
});

describe("cobertura del diccionario", () => {
  it("cada motivo de fallo tiene mensaje en los dos idiomas", () => {
    const failures: BookingFailure[] = [
      "dates-taken",
      "invalid-dates",
      "min-stay",
      "over-capacity",
      "not-found",
      "rate-limited",
      "unconfigured",
      "server",
    ];
    for (const failure of failures) {
      expect(es.booking.form.failures[failure]).toBeTruthy();
      expect(en.booking.form.failures[failure]).toBeTruthy();
    }
  });

  it("el mensaje de fechas ocupadas dice lo que pasó, no «error»", () => {
    // Es EL mensaje del caso de carrera: quien lo lee tiene que entender que
    // no hizo nada mal y que puede elegir otras fechas ahora mismo.
    expect(es.booking.form.failures["dates-taken"]).toContain("se acaban de ocupar");
    expect(en.booking.form.failures["dates-taken"]).toContain("just been taken");
  });
});
