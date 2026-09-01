import { describe, expect, it } from "vitest";

import { dict } from "./i18n";
import { LOCALES } from "./i18n/config";
import { DESCRIPTION_LIMIT } from "./seo";
import { siteDescription } from "./site";

/**
 * TODO TEXTO DEL SITIO QUE DICE CUÁNTAS CASAS HAY.
 *
 * El sitio afirmaba "seis" en catorce sitios —titulares, botones,
 * descripciones de buscador, el pie, el JSON-LD— porque cuando se escribieron
 * había seis casas. El día que el cliente ocultó Casa Uba desde el panel, esos
 * catorce textos empezaron a mentir a la vez.
 *
 * Estas pruebas fijan la propiedad que lo impide: NINGUNA de esas frases
 * contiene un número escrito a mano, y todas dicen el que se les pasa. El caso
 * que de verdad importa es el de hoy —cinco visibles— y los dos que rompen las
 * plantillas ingenuas: uno solo y ninguno.
 */

/** Palabras que solo pueden venir de un número escrito a mano. */
const FROZEN = ["seis", "Seis", "six", "Six"];

describe("titulares y botones que cuentan alojamientos", () => {
  it("con cinco visibles, ninguno dice «seis»", () => {
    const es = dict("es");
    const en = dict("en");

    const spanish = [
      es.home.accommodations.title(5),
      es.home.accommodations.cta(5),
      es.accommodations.heroDescription(5),
      es.accommodations.sectionTitle(5),
      es.detail.othersCta(5),
      es.footer.blurb(5),
      es.bookingHub.chooseTitle(5),
      es.bookingHub.metaDescription(5),
    ];
    const english = [
      en.home.accommodations.title(5),
      en.home.accommodations.cta(5),
      en.accommodations.heroDescription(5),
      en.accommodations.sectionTitle(5),
      en.detail.othersCta(5),
      en.footer.blurb(5),
      en.bookingHub.chooseTitle(5),
      en.bookingHub.metaDescription(5),
    ];

    for (const text of [...spanish, ...english]) {
      for (const word of FROZEN) {
        expect(text).not.toContain(word);
      }
    }

    // Sin distinguir mayúsculas: los titulares abren la frase ("Cinco casas
    // y cabañas") y el resto la lleva dentro ("Ver los cinco").
    expect(spanish.every((text) => /cinco/i.test(text))).toBe(true);
    expect(english.every((text) => /five/i.test(text))).toBe(true);
  });

  it("si mañana reactivan Casa Uba, vuelven a decir «seis» sin tocar código", () => {
    expect(dict("es").home.accommodations.title(6)).toBe(
      "Seis casas y cabañas, cada una con su",
    );
    expect(dict("es").home.accommodations.cta(6)).toBe("Ver los seis y reservar");
    expect(dict("es").accommodations.sectionTitle(6)).toBe("Seis casas y cabañas");
    expect(dict("en").accommodations.sectionTitle(6)).toBe("Six houses and cabins");
    expect(dict("en").home.accommodations.cta(6)).toBe("See all six and book");
  });

  it("abre las frases con mayúscula donde toca", () => {
    expect(dict("es").accommodations.sectionTitle(5)).toBe("Cinco casas y cabañas");
    expect(dict("en").accommodations.sectionTitle(5)).toBe("Five houses and cabins");
  });

  it("con UN solo alojamiento concuerda el artículo en vez de decir «los uno»", () => {
    const es = dict("es");
    const en = dict("en");

    for (const text of [
      es.home.accommodations.title(1),
      es.home.accommodations.cta(1),
      es.accommodations.sectionTitle(1),
      es.accommodations.heroDescription(1),
      es.detail.othersCta(1),
      es.footer.blurb(1),
    ]) {
      expect(text).not.toMatch(/\b(los|las) uno\b/);
      expect(text).not.toContain("uno ");
    }

    for (const text of [
      en.home.accommodations.title(1),
      en.home.accommodations.cta(1),
      en.accommodations.sectionTitle(1),
      en.footer.blurb(1),
    ]) {
      expect(text).not.toMatch(/\ball one\b/);
    }
  });

  it("sin nada publicado, el pie no anuncia «cero casas»", () => {
    for (const locale of LOCALES) {
      const blurb = dict(locale).footer.blurb(0);
      expect(blurb).not.toContain("cero");
      expect(blurb).not.toContain("zero");
      expect(blurb).not.toContain("0 ");
      // Sigue siendo una frase completa, no un hueco.
      expect(blurb.length).toBeGreaterThan(80);
    }
  });
});

describe("siteDescription", () => {
  it("dice el número real en los dos idiomas", () => {
    expect(siteDescription(5, "es")).toContain("cinco casas y cabañas");
    expect(siteDescription(5, "en")).toContain("five houses and cabins");
    expect(siteDescription(6, "es")).toContain("seis casas y cabañas");
  });

  it("concuerda el singular y no dice «cero»", () => {
    expect(siteDescription(1, "es")).toContain("una casa");
    expect(siteDescription(1, "en")).toContain("one house");
    expect(siteDescription(0, "es")).not.toContain("cero");
    expect(siteDescription(0, "en")).not.toContain("zero");
  });

  it("cabe en la descripción del buscador en todos los casos", () => {
    // Es el `<meta name="description">` de TODO el sitio: si se pasa del
    // límite, Google la corta y la última frase se pierde.
    for (const locale of LOCALES) {
      for (const count of [0, 1, 5, 6, 12]) {
        expect(siteDescription(count, locale).length).toBeLessThanOrEqual(
          DESCRIPTION_LIMIT,
        );
      }
    }
  });

  it("empieza por lo que se busca: la primera línea es la que sobrevive en móvil", () => {
    expect(siteDescription(5, "es").startsWith("Hotel campestre")).toBe(true);
    expect(siteDescription(5, "en").startsWith("Country hotel")).toBe(true);
  });
});
