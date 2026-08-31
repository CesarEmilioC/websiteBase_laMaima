/**
 * Pruebas del sitio bilingüe.
 *
 * Cubren las tres piezas que, si se rompen, rompen el inglés entero sin que
 * nada falle a gritos: el mapeo de rutas entre árboles, los textos calculados
 * (fechas, cantidades, mensaje de WhatsApp) y la integridad del diccionario.
 */
import { describe, expect, it } from "vitest";

import { formatDate, formatLongDate, formatRange, monthTitle, weekdaysShort } from "./dates";
import { formatCOP, formatGuests, formatNights } from "./format";
import { dict } from "./i18n";
import { en } from "./i18n/en";
import { es } from "./i18n/es";
import {
  DEFAULT_LOCALE,
  LOCALES,
  localePath,
  otherLocale,
  splitLocale,
} from "./i18n/config";
import { bookingRequestMessage, generalMessage } from "./whatsapp";

describe("rutas por idioma", () => {
  it("deja el español en la raíz, sin prefijo", () => {
    // Es la condición de partida: las direcciones ya indexadas no se mueven.
    expect(DEFAULT_LOCALE).toBe("es");
    expect(localePath("es", "/")).toBe("/");
    expect(localePath("es", "/alojamientos/mirador")).toBe(
      "/alojamientos/mirador",
    );
  });

  it("cuelga el inglés de /en", () => {
    expect(localePath("en", "/")).toBe("/en");
    expect(localePath("en", "/alojamientos")).toBe("/en/alojamientos");
    expect(localePath("en", "/legal/privacidad")).toBe("/en/legal/privacidad");
  });

  it("no deja una barra suelta antes del ancla de la portada", () => {
    // "/en/#contacto" y "/en#contacto" son direcciones distintas para el
    // buscador, y la canónica es la segunda.
    expect(localePath("en", "/#contacto")).toBe("/en#contacto");
    expect(localePath("es", "/#contacto")).toBe("/#contacto");
  });

  it("separa el prefijo para saltar a la MISMA página del otro árbol", () => {
    expect(splitLocale("/en/alojamientos/mirador")).toEqual({
      locale: "en",
      path: "/alojamientos/mirador",
    });
    expect(splitLocale("/en")).toEqual({ locale: "en", path: "/" });
    expect(splitLocale("/en/")).toEqual({ locale: "en", path: "/" });
    expect(splitLocale("/alojamientos")).toEqual({
      locale: "es",
      path: "/alojamientos",
    });
  });

  it("no confunde una ruta que solo EMPIEZA por «en»", () => {
    // "/experiencias" empieza por "/e"; el prefijo es "/en/" completo.
    expect(splitLocale("/experiencias").locale).toBe("es");
  });

  it("ida y vuelta: separar y volver a componer no cambia la dirección", () => {
    for (const pathname of [
      "/",
      "/alojamientos",
      "/alojamientos/casa-maima",
      "/experiencias",
      "/legal/terminos",
      "/en",
      "/en/alojamientos/casa-maima",
      "/en/legal/terminos",
    ]) {
      const { locale, path } = splitLocale(pathname);
      expect(localePath(locale, path)).toBe(pathname);
    }
  });

  it("con dos idiomas, «el otro» es el que no es este", () => {
    expect(otherLocale("es")).toBe("en");
    expect(otherLocale("en")).toBe("es");
  });
});

describe("diccionario", () => {
  it("el inglés tiene exactamente las mismas claves que el español", () => {
    /* El tipo `Dictionary` ya lo exige en compilación; esta prueba lo verifica
       también en ejecución, que es lo que protege de un `as any` despistado. */
    const keys = (value: unknown, prefix = ""): string[] => {
      if (typeof value !== "object" || value === null) return [prefix];
      return Object.entries(value).flatMap(([key, child]) =>
        keys(child, prefix ? `${prefix}.${key}` : key),
      );
    };
    expect(keys(en).sort()).toEqual(keys(es).sort());
  });

  it("ningún texto inglés se quedó en español", () => {
    // Red de seguridad barata: si alguien copia el bloque español y olvida
    // traducirlo, casi seguro arrastra una de estas palabras.
    const flat = JSON.stringify(en);
    for (const word of ["Reservar", "Huéspedes", "Alojamientos", "noche"]) {
      expect(flat).not.toContain(word);
    }
  });

  it("`dict()` devuelve el diccionario del idioma pedido", () => {
    expect(dict("es").nav.book).toBe("Reservar");
    expect(dict("en").nav.book).toBe("Book");
    expect(LOCALES).toEqual(["es", "en"]);
  });
});

describe("fechas y cantidades por idioma", () => {
  it("mantiene el orden día-mes-año también en inglés", () => {
    // Un huésped extranjero compara estas fechas con su tarjeta de embarque:
    // mezclar los dos órdenes es cómo alguien llega un día tarde.
    expect(formatDate("2026-09-12", "es")).toBe("12 sep 2026");
    expect(formatDate("2026-09-12", "en")).toBe("12 Sep 2026");
    expect(formatLongDate("2026-09-12", "es")).toBe("12 de septiembre de 2026");
    expect(formatLongDate("2026-09-12", "en")).toBe("12 September 2026");
  });

  it("por defecto sigue hablando español (el panel no cambió)", () => {
    expect(formatDate("2026-09-12")).toBe("12 sep 2026");
    expect(formatLongDate("2026-09-12")).toBe("12 de septiembre de 2026");
    expect(formatGuests(4)).toBe("4 personas");
    expect(formatNights(1)).toBe("1 noche");
  });

  it("resume los rangos omitiendo el mes repetido", () => {
    expect(formatRange("2026-09-12", "2026-09-15", "en")).toBe(
      "12 – 15 Sep 2026",
    );
  });

  it("empieza la semana en LUNES en los dos idiomas", () => {
    /* En inglés se conserva el lunes a propósito: el calendario marca las
       noches baratas de lunes a jueves como un bloque, y ese bloque se parte si
       el domingo se muda a la primera columna. */
    expect(weekdaysShort("es")[0]).toBe("lun");
    expect(weekdaysShort("en")[0]).toBe("Mon");
    expect(weekdaysShort("en")).toHaveLength(7);
    expect(weekdaysShort("en")[6]).toBe("Sun");
  });

  it("titula los meses del calendario en el idioma de la página", () => {
    expect(monthTitle({ year: 2026, month: 9 }, "es")).toBe("Septiembre 2026");
    expect(monthTitle({ year: 2026, month: 9 }, "en")).toBe("September 2026");
  });

  it("concuerda singular y plural en los dos idiomas", () => {
    expect(formatGuests(1, "en")).toBe("1 guest");
    expect(formatGuests(4, "en")).toBe("4 guests");
    expect(formatNights(1, "en")).toBe("1 night");
    expect(formatNights(3, "en")).toBe("3 nights");
  });

  it("escribe los pesos igual en los dos idiomas", () => {
    // Un "$1,400,000" a la inglesa se lee como dólares; el separador se queda.
    expect(formatCOP(1_400_000)).toBe("$1.400.000");
  });
});

describe("mensajes de WhatsApp", () => {
  const request = {
    accommodation: "Mirador",
    checkIn: "2026-09-12",
    checkOut: "2026-09-15",
    nights: 3,
    guests: 2,
    totalCop: 1_710_000,
    detail: "3 nights × $570.000 · Breakfast included",
  };

  it("redacta la solicitud en el idioma del visitante", () => {
    const english = bookingRequestMessage(request, "en");
    expect(english).toContain("I'd like to book Mirador");
    expect(english).toContain("12 September 2026");
    expect(english).toContain("(3 nights, 2 guests)");
    expect(english).toContain("$1.710.000 COP");
    expect(english).toContain("confirm availability and payment");
  });

  it("el español no cambia", () => {
    const spanish = bookingRequestMessage(request);
    expect(spanish).toContain("Quiero reservar Mirador");
    expect(spanish).toContain("12 de septiembre de 2026");
    expect(spanish).toContain("(3 noches, 2 huéspedes)");
  });

  it("siempre dice COP: el total no puede leerse como dólares", () => {
    for (const locale of LOCALES) {
      expect(bookingRequestMessage(request, locale)).toContain("COP");
    }
  });

  it("traduce también el mensaje del botón flotante", () => {
    expect(generalMessage("es")).toContain("Hola");
    expect(generalMessage("en")).toContain("Hi!");
  });
});
