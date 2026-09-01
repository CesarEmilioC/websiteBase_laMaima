/**
 * Pruebas del código legible de reserva.
 *
 * Lo que se protege aquí no es "que salga un código", sino las tres
 * propiedades por las que el código existe: que se pueda DICTAR sin
 * ambigüedad, que no compongan palabras que no queremos imprimir, y que dos
 * códigos distintos sean de verdad distintos con suficiente frecuencia como
 * para que el reintento del INSERT sea una rareza y no la norma.
 */
import { describe, expect, it } from "vitest";

import {
  BOOKING_CODE_ALPHABET,
  BOOKING_CODE_LENGTH,
  BOOKING_CODE_PREFIX,
  generateBookingCode,
  hasForbiddenWord,
  isBookingCode,
  normalizeBookingCode,
} from "./code";

describe("alfabeto", () => {
  it("no contiene ningún carácter confundible al dictarlo", () => {
    // 0/O, 1/I/L son EL motivo de que exista un alfabeto propio: un código
    // que hay que deletrear por teléfono no puede tener parejas ambiguas.
    for (const forbidden of ["0", "O", "1", "I", "L"]) {
      expect(BOOKING_CODE_ALPHABET).not.toContain(forbidden);
    }
  });

  it("no repite ningún símbolo", () => {
    expect(new Set(BOOKING_CODE_ALPHABET).size).toBe(
      BOOKING_CODE_ALPHABET.length,
    );
  });

  it("deja suficientes combinaciones para que un choque sea excepcional", () => {
    // 31^4 ≈ 923.000. Con unos miles de reservas al año, la probabilidad de
    // repetir es del orden de una en cientos: el reintento del INSERT existe
    // para eso y no debería dispararse casi nunca.
    const combinations = BOOKING_CODE_ALPHABET.length ** BOOKING_CODE_LENGTH;
    expect(combinations).toBeGreaterThan(500_000);
  });
});

describe("generateBookingCode", () => {
  it("respeta el formato LM-XXXX", () => {
    const code = generateBookingCode();
    expect(code).toMatch(/^LM-[A-Z2-9]{4}$/);
    expect(code.startsWith(BOOKING_CODE_PREFIX)).toBe(true);
    expect(code).toHaveLength(BOOKING_CODE_PREFIX.length + BOOKING_CODE_LENGTH);
  });

  it("solo usa símbolos del alfabeto", () => {
    for (let i = 0; i < 200; i += 1) {
      const body = generateBookingCode().slice(BOOKING_CODE_PREFIX.length);
      for (const char of body) {
        expect(BOOKING_CODE_ALPHABET).toContain(char);
      }
    }
  });

  it("mapea el azar al alfabeto posición a posición", () => {
    // Un generador fijo: siempre 0 -> siempre el primer símbolo.
    expect(generateBookingCode(() => 0)).toBe(
      `${BOOKING_CODE_PREFIX}${BOOKING_CODE_ALPHABET[0].repeat(4)}`,
    );

    // Casi 1 -> siempre el último.
    const last = BOOKING_CODE_ALPHABET[BOOKING_CODE_ALPHABET.length - 1];
    expect(generateBookingCode(() => 0.9999)).toBe(
      `${BOOKING_CODE_PREFIX}${last.repeat(4)}`,
    );
  });

  it("no se sale del alfabeto si el azar devuelve exactamente 1", () => {
    // Math.random() nunca devuelve 1, pero un generador inyectado sí puede:
    // sin el recorte, el índice se iría fuera y el código traería "undefined".
    const code = generateBookingCode(() => 1);
    expect(code).toMatch(/^LM-[A-Z2-9]{4}$/);
    expect(code).not.toContain("undefined");
  });

  it("genera códigos distintos: mil sorteos con casi ningún repetido", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i += 1) seen.add(generateBookingCode());
    // Con 923.000 combinaciones, mil sorteos producen del orden de medio
    // repetido por el problema del cumpleaños. Se admite un puñado; lo que
    // esta prueba caza es un generador roto que devuelva siempre lo mismo.
    expect(seen.size).toBeGreaterThan(990);
  });

  it("descarta las combinaciones de la lista negra", () => {
    // Un generador que insiste en producir "PUTA" en el primer intento y algo
    // limpio en el segundo: el código publicado tiene que ser el segundo.
    const sequences = [
      ..."PUTA".split("").map((char) => BOOKING_CODE_ALPHABET.indexOf(char)),
      ..."ZZZZ".split("").map((char) => BOOKING_CODE_ALPHABET.indexOf(char)),
    ];
    let call = 0;
    const scripted = () =>
      sequences[call++] / BOOKING_CODE_ALPHABET.length;

    expect(generateBookingCode(scripted)).toBe("LM-ZZZZ");
  });

  it("nunca devuelve una combinación prohibida", () => {
    for (let i = 0; i < 500; i += 1) {
      const body = generateBookingCode().slice(BOOKING_CODE_PREFIX.length);
      expect(hasForbiddenWord(body)).toBe(false);
    }
  });

  it("termina aunque el azar sea degenerado", () => {
    // Un generador atascado en una combinación prohibida no puede colgar el
    // proceso: tras varios intentos se acepta un código de respaldo.
    const stuck = () =>
      BOOKING_CODE_ALPHABET.indexOf("P") / BOOKING_CODE_ALPHABET.length;
    const code = generateBookingCode(stuck);
    expect(isBookingCode(code)).toBe(true);
  });
});

describe("isBookingCode", () => {
  it("acepta un código bien formado", () => {
    expect(isBookingCode("LM-7F3K")).toBe(true);
    expect(isBookingCode(generateBookingCode())).toBe(true);
  });

  it("rechaza lo que no lo es", () => {
    expect(isBookingCode("LM-7F3")).toBe(false); // corto
    expect(isBookingCode("LM-7F3KX")).toBe(false); // largo
    expect(isBookingCode("XX-7F3K")).toBe(false); // otro prefijo
    expect(isBookingCode("LM-7F3O")).toBe(false); // la O no está en el alfabeto
    expect(isBookingCode("LM-7f3k")).toBe(false); // minúsculas
    expect(isBookingCode("")).toBe(false);
    expect(isBookingCode(null)).toBe(false);
    expect(isBookingCode(42)).toBe(false);
  });
});

describe("normalizeBookingCode", () => {
  it("arregla lo que escribe una persona", () => {
    expect(normalizeBookingCode("lm-7f3k")).toBe("LM-7F3K");
    expect(normalizeBookingCode(" LM 7F3K ")).toBe("LM-7F3K");
    expect(normalizeBookingCode("7f3k")).toBe("LM-7F3K");
    expect(normalizeBookingCode("lm7f3k")).toBe("LM-7F3K");
  });
});
