/**
 * Pruebas de la validación del formulario de reserva.
 *
 * Estas funciones corren en dos sitios —el navegador, para avisar mientras se
 * escribe, y el servidor, donde son la validación de verdad— así que lo que se
 * comprueba aquí vale para los dos.
 */
import { describe, expect, it } from "vitest";

import { en } from "../i18n/en";
import { es } from "../i18n/es";
import {
  GUEST_FIELD_ORDER,
  HONEYPOT_FIELD,
  NOTES_MAX,
  firstErrorField,
  looksLikeBot,
  phoneDigits,
  validateGuest,
  type GuestErrorCode,
} from "./guest";

const VALID = {
  name: "Ana María Restrepo",
  email: "ana@example.com",
  phone: "+57 311 308 2813",
  notes: "",
  policyAccepted: true,
};

describe("validateGuest — camino feliz", () => {
  it("acepta unos datos completos y los devuelve limpios", () => {
    const result = validateGuest(VALID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe("Ana María Restrepo");
    expect(result.value.email).toBe("ana@example.com");
    expect(result.value.notes).toBeNull();
  });

  it("normaliza los espacios sobrantes del nombre", () => {
    const result = validateGuest({ ...VALID, name: "  Ana   María  " });
    expect(result.ok && result.value.name).toBe("Ana María");
  });

  it("guarda el correo en minúsculas", () => {
    // Evita dos filas "Ana@X.com" y "ana@x.com" para la misma persona.
    const result = validateGuest({ ...VALID, email: "  Ana@Example.COM " });
    expect(result.ok && result.value.email).toBe("ana@example.com");
  });

  it("una nota vacía o de solo espacios se guarda como NULL", () => {
    expect(validateGuest({ ...VALID, notes: "   " }).ok).toBe(true);
    const result = validateGuest({ ...VALID, notes: "   " });
    expect(result.ok && result.value.notes).toBeNull();
  });

  it("conserva la nota cuando dice algo", () => {
    const result = validateGuest({ ...VALID, notes: "  Llegamos de noche  " });
    expect(result.ok && result.value.notes).toBe("Llegamos de noche");
  });
});

describe("validateGuest — nombre", () => {
  it("lo exige", () => {
    expect(errorFor({ name: "" })).toBe("name-required");
    expect(errorFor({ name: "   " })).toBe("name-required");
  });

  it("rechaza una sola letra", () => {
    expect(errorFor({ name: "A" })).toBe("name-too-short");
  });

  it("rechaza un nombre desmesurado", () => {
    expect(errorFor({ name: "A".repeat(200) })).toBe("name-too-long");
  });
});

describe("validateGuest — correo", () => {
  it("lo exige", () => {
    expect(errorFor({ email: "" }, "email")).toBe("email-required");
  });

  it("caza el error de dedo evidente", () => {
    for (const bad of ["ana", "ana@", "@example.com", "ana@example", "a b@c.com"]) {
      expect(errorFor({ email: bad }, "email")).toBe("email-invalid");
    }
  });

  it("acepta las direcciones raras pero legítimas", () => {
    // Validar el correo contra la RFC siempre termina rechazando a alguien
    // real: aquí solo se atrapa lo que claramente no es una dirección.
    for (const good of [
      "ana+reserva@example.com",
      "ana.maria@sub.example.co",
      "a@b.io",
    ]) {
      expect(validateGuest({ ...VALID, email: good }).ok).toBe(true);
    }
  });
});

describe("validateGuest — teléfono", () => {
  it("lo exige", () => {
    expect(errorFor({ phone: "" }, "phone")).toBe("phone-required");
  });

  it("cuenta dígitos, no caracteres", () => {
    expect(phoneDigits("+57 (311) 308-2813")).toBe("573113082813");
    // Cinco dígitos vestidos de teléfono siguen siendo cinco dígitos.
    expect(errorFor({ phone: "+57 (12) 3-4" }, "phone")).toBe("phone-too-short");
  });

  it("acepta los formatos que la gente escribe de verdad", () => {
    for (const good of [
      "3113082813",
      "+57 311 308 2813",
      "(311) 308-2813",
      "+1 415 555 0132",
    ]) {
      expect(validateGuest({ ...VALID, phone: good }).ok).toBe(true);
    }
  });
});

describe("validateGuest — nota y política", () => {
  it("corta las notas kilométricas", () => {
    expect(errorFor({ notes: "x".repeat(NOTES_MAX + 1) }, "notes")).toBe(
      "notes-too-long",
    );
  });

  it("acepta una nota justo en el límite", () => {
    expect(validateGuest({ ...VALID, notes: "x".repeat(NOTES_MAX) }).ok).toBe(
      true,
    );
  });

  it("exige aceptar la política de cancelación", () => {
    expect(errorFor({ policyAccepted: false }, "policy")).toBe("policy-required");
  });
});

describe("validateGuest — varios errores a la vez", () => {
  it("los reporta todos, no solo el primero", () => {
    const result = validateGuest({
      name: "",
      email: "no-es-correo",
      phone: "",
      notes: "",
      policyAccepted: false,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual([
      "email",
      "name",
      "phone",
      "policy",
    ]);
  });
});

describe("firstErrorField", () => {
  it("respeta el orden de la PANTALLA, no el del objeto", () => {
    // El foco tiene que saltar al primer campo defectuoso que se ve, y el
    // orden de recorrido de un objeto es un detalle de implementación.
    expect(firstErrorField({ policy: "policy-required", name: "name-required" }))
      .toBe("name");
    expect(firstErrorField({ policy: "policy-required" })).toBe("policy");
    expect(firstErrorField({})).toBeNull();
  });

  it("el orden declarado cubre todos los campos", () => {
    expect(GUEST_FIELD_ORDER).toEqual([
      "name",
      "email",
      "phone",
      "notes",
      "policy",
    ]);
  });
});

describe("honeypot", () => {
  it("un campo trampa vacío es una persona", () => {
    expect(looksLikeBot("")).toBe(false);
    expect(looksLikeBot("   ")).toBe(false);
    expect(looksLikeBot(undefined)).toBe(false);
    expect(looksLikeBot(null)).toBe(false);
  });

  it("un campo trampa relleno es un rellenador automático", () => {
    expect(looksLikeBot("Acme Corp")).toBe(true);
  });

  it("se llama como un campo plausible, no «honeypot»", () => {
    // Un nombre delator le enseña al bot a saltárselo la próxima vez.
    expect(HONEYPOT_FIELD).not.toMatch(/honey|trap|bot/i);
  });
});

describe("cobertura del diccionario", () => {
  it("cada código de error tiene mensaje en los dos idiomas", () => {
    // Un error sin texto se pintaría como `undefined` debajo del campo.
    const codes: GuestErrorCode[] = [
      "name-required",
      "name-too-short",
      "name-too-long",
      "email-required",
      "email-invalid",
      "email-too-long",
      "phone-required",
      "phone-too-short",
      "phone-too-long",
      "notes-too-long",
      "policy-required",
    ];
    for (const code of codes) {
      expect(es.booking.form.errors[code]).toBeTruthy();
      expect(en.booking.form.errors[code]).toBeTruthy();
    }
  });
});

/* --- Ayuda ---------------------------------------------------------------- */

/** Valida `VALID` con un campo estropeado y devuelve el código del error. */
function errorFor(
  overrides: Partial<typeof VALID>,
  field: "name" | "email" | "phone" | "notes" | "policy" = "name",
): GuestErrorCode | undefined {
  const result = validateGuest({ ...VALID, ...overrides });
  return result.ok ? undefined : result.errors[field];
}
