import { describe, expect, it } from "vitest";

import {
  accommodationTails,
  breadcrumbList,
  composeDescription,
  DESCRIPTION_LIMIT,
  languageAlternates,
  lodgingId,
  pageMetadata,
  serializeJsonLd,
  websiteId,
} from "./seo";
import { SITE } from "./site";

describe("composeDescription", () => {
  it("añade la cola más informativa que quepa", () => {
    const result = composeDescription("Cabaña pequeña.", [
      `Una cola larguísima que no cabe de ninguna manera dentro del límite. ${"x".repeat(90)}`,
      "Una cola mediana.",
      "Corta.",
    ]);

    expect(result).toBe("Cabaña pequeña. Una cola mediana.");
  });

  it("nunca supera el límite", () => {
    const base = "x".repeat(120);
    const result = composeDescription(base, accommodationTails("$1.400.000"));
    expect(result.length).toBeLessThanOrEqual(DESCRIPTION_LIMIT);
  });

  it("publica el texto solo cuando ninguna cola cabe", () => {
    const base = "y".repeat(150);
    expect(composeDescription(base, ["Cola de treinta caracteres...."])).toBe(
      base,
    );
  });

  it("recorta por palabra entera cuando ni el texto base cabe", () => {
    const base = `${"palabra ".repeat(30)}final`;
    const result = composeDescription(base, [""]);

    expect(result.length).toBeLessThanOrEqual(DESCRIPTION_LIMIT);
    expect(result.endsWith("…")).toBe(true);
    // No parte una palabra por la mitad.
    expect(result).not.toMatch(/pala…$|palab…$|palabr…$/);
  });

  it("normaliza los espacios del texto del panel", () => {
    expect(composeDescription("  Dos   espacios.  ", [""])).toBe(
      "Dos espacios.",
    );
  });

  it("no promete precio cuando el alojamiento no tiene tarifa publicada", () => {
    const tails = accommodationTails(null);
    expect(tails.every((tail) => !tail.includes("Desde"))).toBe(true);
  });

  it("nombra el lugar y la tarifa en la cola preferente", () => {
    const [preferred] = accommodationTails("$495.000");
    expect(preferred).toContain("Dapa");
    expect(preferred).toContain("$495.000");
  });
});

describe("pageMetadata", () => {
  const meta = pageMetadata({
    title: "Alojamientos",
    description: "Seis casas y cabañas.",
    path: "/alojamientos",
    image: { url: "https://cdn.example/foto.jpg", alt: "Una cabaña" },
  });

  it("declara el canónico de la página", () => {
    expect(meta.alternates?.canonical).toBe("/alojamientos");
  });

  it("repite en cada página lo que NO se hereda del layout raíz", () => {
    // La mezcla de metadatos en el App Router es superficial: declarar
    // `openGraph` en una página reemplaza el del layout entero.
    expect(meta.openGraph).toMatchObject({
      type: "website",
      locale: "es_CO",
      siteName: SITE.name,
      url: "/alojamientos",
    });
  });

  it("da a Twitter la MISMA imagen que a OpenGraph", () => {
    // El fallo original: las páginas internas heredaban la tarjeta de Twitter
    // de la portada, con su título y su foto genérica.
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Alojamientos · La Maima",
    });
    expect(JSON.stringify(meta.twitter)).toContain("https://cdn.example/foto.jpg");
  });

  it("permite un título social distinto del de la pestaña", () => {
    const custom = pageMetadata({
      title: "Casa Maima, alojamiento para 10 personas en Dapa",
      description: "…",
      path: "/alojamientos/casa-maima",
      image: { url: "https://cdn.example/a.jpg", alt: "a" },
      socialTitle: "Casa Maima · La Maima",
    });

    expect(custom.openGraph?.title).toBe("Casa Maima · La Maima");
    expect(custom.title).toBe(
      "Casa Maima, alojamiento para 10 personas en Dapa",
    );
  });
});

describe("breadcrumbList", () => {
  const list = breadcrumbList([
    { name: "Inicio", path: "/" },
    { name: "Alojamientos", path: "/alojamientos" },
    { name: "Casa Maima", path: "/alojamientos/casa-maima" },
  ]);

  it("numera las posiciones desde 1", () => {
    expect(list.itemListElement.map((item) => item.position)).toEqual([1, 2, 3]);
  });

  it("resuelve direcciones absolutas", () => {
    expect(list.itemListElement[1]).toMatchObject({
      item: `${SITE.url}/alojamientos`,
    });
  });

  it("deja la página actual sin `item`", () => {
    expect(list.itemListElement[2]).not.toHaveProperty("item");
  });
});

describe("serializeJsonLd", () => {
  it("produce JSON válido", () => {
    const graph = { "@type": "Thing", name: "La Maima" };
    expect(JSON.parse(serializeJsonLd(graph))).toEqual(graph);
  });

  it("escapa el signo de menor que para que nadie pueda cerrar el <script>", () => {
    // El texto viene del panel: una administradora podría pegar cualquier cosa.
    const output = serializeJsonLd({ name: "</script><img onerror=x>" });

    expect(output).not.toContain("</script>");
    expect(output).toContain("\\u003c");
    expect(JSON.parse(output).name).toBe("</script><img onerror=x>");
  });
});

/* ---------------------------------------------------------------------------
 * SEO bilingüe
 * -------------------------------------------------------------------------
 * Un `hreflang` que no es recíproco Google lo descarta ENTERO, y un canónico
 * que apunta al otro idioma manda a indexar la página equivocada. Las dos cosas
 * fallan en silencio: no rompen el sitio, solo hacen que la mitad no exista
 * para el buscador. De ahí que se prueben.
 * ------------------------------------------------------------------------- */
describe("alternates de idioma", () => {
  it("publica las dos versiones y un x-default al español", () => {
    expect(languageAlternates("/alojamientos")).toEqual({
      es: "/alojamientos",
      en: "/en/alojamientos",
      "x-default": "/alojamientos",
    });
  });

  it("la portada inglesa no arrastra una barra suelta", () => {
    expect(languageAlternates("/")).toEqual({
      es: "/",
      en: "/en",
      "x-default": "/",
    });
  });

  it("las dos versiones de una página se apuntan MUTUAMENTE", () => {
    const spanish = pageMetadata({
      title: "Mirador",
      description: "…",
      path: "/alojamientos/mirador",
      image: { url: "https://cdn.example/a.jpg", alt: "a" },
    });
    const english = pageMetadata({
      title: "Mirador",
      description: "…",
      path: "/alojamientos/mirador",
      image: { url: "https://cdn.example/a.jpg", alt: "a" },
      locale: "en",
    });

    // Mismo mapa de idiomas en las dos: es lo que hace el vínculo recíproco.
    expect(spanish.alternates?.languages).toEqual(
      english.alternates?.languages,
    );
    // Y cada una se declara canónica en SU árbol.
    expect(spanish.alternates?.canonical).toBe("/alojamientos/mirador");
    expect(english.alternates?.canonical).toBe("/en/alojamientos/mirador");
  });

  it("declara el og:locale del idioma de la página", () => {
    expect(
      pageMetadata({
        title: "Stays",
        description: "…",
        path: "/alojamientos",
        image: { url: "https://cdn.example/a.jpg", alt: "a" },
        locale: "en",
      }).openGraph,
    ).toMatchObject({ locale: "en_US", url: "/en/alojamientos" });
  });

  it("permite un título que ya trae la marca, sin duplicarla", () => {
    // La portada: la plantilla del layout (`%s · La Maima`) no debe aplicarse.
    const meta = pageMetadata({
      title: "La Maima — Hotel campestre",
      absoluteTitle: true,
      description: "…",
      path: "/",
      image: { url: "https://cdn.example/a.jpg", alt: "a" },
    });
    expect(meta.title).toEqual({ absolute: "La Maima — Hotel campestre" });
  });
});

describe("colas de descripción en inglés", () => {
  it("marca el precio como COP para que no se lea en dólares", () => {
    const [preferred] = accommodationTails("$495.000", "en");
    expect(preferred).toContain("COP");
    expect(preferred).toContain("Dapa");
  });

  it("no promete precio cuando el alojamiento no tiene tarifa publicada", () => {
    expect(
      accommodationTails(null, "en").every((tail) => !tail.includes("From")),
    ).toBe(true);
  });

  it("compone dentro del límite igual que en español", () => {
    const result = composeDescription(
      "A house for four with a kitchenette and a private bathroom.",
      accommodationTails("$570.000", "en"),
    );
    expect(result.length).toBeLessThanOrEqual(DESCRIPTION_LIMIT);
    expect(result).toContain("COP");
  });
});

describe("identificadores del grafo", () => {
  it("cada idioma publica su propio nodo de negocio", () => {
    // Dos documentos distintos, con descripciones distintas: compartir `@id`
    // sería declarar dos veces la misma entidad diciendo cosas diferentes.
    expect(lodgingId("es")).toBe(`${SITE.url}/#lodging`);
    expect(lodgingId("en")).toBe(`${SITE.url}/en/#lodging`);
    expect(websiteId("en")).toBe(`${SITE.url}/en/#website`);
    expect(lodgingId("es")).not.toBe(lodgingId("en"));
  });
});
