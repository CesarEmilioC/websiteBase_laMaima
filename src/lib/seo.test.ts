import { describe, expect, it } from "vitest";

import {
  accommodationTails,
  breadcrumbList,
  composeDescription,
  DESCRIPTION_LIMIT,
  pageMetadata,
  serializeJsonLd,
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
