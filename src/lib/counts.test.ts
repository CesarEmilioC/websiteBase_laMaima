import { describe, expect, it } from "vitest";

import {
  capitalize,
  fillCountTokens,
  fillCountTokensDeep,
  listNames,
  listNamesWithin,
  numberWord,
  numberWordCapitalized,
  STAY_COUNT_TOKEN,
} from "./counts";

/**
 * Estas pruebas cubren el módulo que hace que el sitio NUNCA vuelva a decir
 * "seis casas" cuando hay cinco. Lo importante no son los casos bonitos sino
 * los que producen texto publicable roto: el cero, el uno, el número fuera de
 * rango y la lista que no cabe en una descripción de buscador.
 */

describe("numberWord", () => {
  it("escribe en letra del cero al doce, en los dos idiomas", () => {
    expect(numberWord(0, "es")).toBe("cero");
    expect(numberWord(5, "es")).toBe("cinco");
    expect(numberWord(6, "es")).toBe("seis");
    expect(numberWord(12, "es")).toBe("doce");

    expect(numberWord(5, "en")).toBe("five");
    expect(numberWord(6, "en")).toBe("six");
    expect(numberWord(12, "en")).toBe("twelve");
  });

  it("cae al numeral por encima de doce, que siempre es correcto", () => {
    expect(numberWord(13, "es")).toBe("13");
    expect(numberWord(40, "en")).toBe("40");
  });

  it("no inventa palabras con entradas que no son un conteo", () => {
    expect(numberWord(-1, "es")).toBe("-1");
    expect(numberWord(2.5, "es")).toBe("2.5");
  });

  it("usa el español por defecto (es el idioma de la raíz del sitio)", () => {
    expect(numberWord(5)).toBe("cinco");
  });

  it("capitaliza para abrir frase", () => {
    expect(capitalize("cinco")).toBe("Cinco");
    expect(capitalize("")).toBe("");
    expect(numberWordCapitalized(5, "es")).toBe("Cinco");
    expect(numberWordCapitalized(5, "en")).toBe("Five");
  });
});

describe("listNames", () => {
  it("compone la lista con la conjunción del idioma", () => {
    expect(listNames(["Casa Maima"], "es")).toBe("Casa Maima");
    expect(listNames(["Casa Maima", "Mirador"], "es")).toBe(
      "Casa Maima y Mirador",
    );
    expect(listNames(["Casa Maima", "Mirador", "Casa Loma"], "es")).toBe(
      "Casa Maima, Mirador y Casa Loma",
    );
    expect(listNames(["Casa Maima", "Mirador", "Casa Loma"], "en")).toBe(
      "Casa Maima, Mirador and Casa Loma",
    );
  });

  it("aplica la regla y -> e del español", () => {
    // Los nombres de las casas los escribe el cliente en el panel: mañana
    // puede haber una "Iguana" y "y Iguana" lo nota cualquiera.
    expect(listNames(["Mirador", "Iguana"], "es")).toBe("Mirador e Iguana");
    expect(listNames(["Mirador", "Higuerón"], "es")).toBe("Mirador e Higuerón");
    // Diptongo: ahí la "y" se queda.
    expect(listNames(["Mirador", "Hierbabuena"], "es")).toBe(
      "Mirador y Hierbabuena",
    );
  });

  it("ignora huecos y espacios sobrantes", () => {
    expect(listNames([" Casa Maima ", "", "  "], "es")).toBe("Casa Maima");
    expect(listNames([], "es")).toBe("");
  });
});

describe("listNamesWithin", () => {
  const names = [
    "Casa Maima",
    "Mirador",
    "Casa Loma",
    "Dos Casitas",
    "Tres Casitas",
  ];

  it("devuelve la lista entera cuando cabe", () => {
    expect(listNamesWithin(names, "es", 200)).toBe(
      "Casa Maima, Mirador, Casa Loma, Dos Casitas y Tres Casitas",
    );
  });

  it("recorta cerrando con «y más», sin partir un nombre propio", () => {
    const short = listNamesWithin(names, "es", 40);
    expect(short.length).toBeLessThanOrEqual(40);
    expect(short.endsWith("y más")).toBe(true);
    // Ningún nombre queda cortado a la mitad.
    expect(short).not.toMatch(/Casit$|Mirad$/);
  });

  it("cierra en inglés con «and more»", () => {
    const short = listNamesWithin(names, "en", 40);
    expect(short.length).toBeLessThanOrEqual(40);
    expect(short.endsWith("and more")).toBe(true);
  });

  it("devuelve vacío cuando no cabe ni un nombre, en vez de un texto roto", () => {
    expect(listNamesWithin(names, "es", 3)).toBe("");
    expect(listNamesWithin([], "es", 200)).toBe("");
  });
});

describe("fillCountTokens", () => {
  it("sustituye el token por el número real", () => {
    expect(fillCountTokens(`${STAY_COUNT_TOKEN} casas y cabañas`, 5)).toBe(
      "5 casas y cabañas",
    );
  });

  it("sustituye todas las apariciones", () => {
    expect(
      fillCountTokens(`${STAY_COUNT_TOKEN} y ${STAY_COUNT_TOKEN}`, 5),
    ).toBe("5 y 5");
  });

  it("deja intacto el texto que no lo lleva", () => {
    const text = "Casas y cabañas independientes.";
    expect(fillCountTokens(text, 5)).toBe(text);
  });

  it("no interpreta los símbolos de reemplazo de una expresión regular", () => {
    // Si esto se hiciera con `String.replace`, un "$&" en el texto del panel
    // se expandiría a la propia coincidencia.
    expect(fillCountTokens(`$& ${STAY_COUNT_TOKEN} $'`, 5)).toBe("$& 5 $'");
  });
});

describe("fillCountTokensDeep", () => {
  it("recorre objetos, arreglos y cadenas conservando la forma", () => {
    const hero = {
      title: "La naturaleza a tu alcance",
      subtitle: `${STAY_COUNT_TOKEN} casas en el bosque`,
      stats: [
        { value: "30", label: "años" },
        { value: STAY_COUNT_TOKEN, label: "casas y cabañas" },
      ],
      visible: true,
      order: 3,
      missing: null,
    };

    expect(fillCountTokensDeep(hero, 5)).toEqual({
      title: "La naturaleza a tu alcance",
      subtitle: "5 casas en el bosque",
      stats: [
        { value: "30", label: "años" },
        { value: "5", label: "casas y cabañas" },
      ],
      visible: true,
      order: 3,
      missing: null,
    });
  });

  it("no toca el objeto original", () => {
    const source = { subtitle: `${STAY_COUNT_TOKEN} casas` };
    fillCountTokensDeep(source, 5);
    expect(source.subtitle).toBe(`${STAY_COUNT_TOKEN} casas`);
  });
});
