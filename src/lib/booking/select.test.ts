import { describe, expect, it } from "vitest";

import { bookingPath, readStayParam, selectStay, STAY_QUERY_PARAM } from "./select";

/**
 * La regla que se prueba aquí es la que impide que `/reservar?cabana=casa-uba`
 * siga abriendo el calendario de una cabaña que el cliente acaba de ocultar
 * desde el panel. Es una dirección que ya está en el mundo —compartida por
 * WhatsApp, guardada en favoritos— y tiene que degradar bien.
 */

type Stay = { slug: string; name: string };

const visible: Stay[] = [
  { slug: "casa-maima", name: "Casa Maima" },
  { slug: "mirador", name: "Mirador" },
  { slug: "casa-loma", name: "Casa Loma" },
  { slug: "dos-casitas", name: "Dos Casitas" },
  { slug: "tres-casitas", name: "Tres Casitas" },
];

describe("readStayParam", () => {
  it("acepta un slug válido", () => {
    expect(readStayParam("casa-maima")).toBe("casa-maima");
  });

  it("normaliza espacios y mayúsculas", () => {
    expect(readStayParam("  Casa-Maima  ")).toBe("casa-maima");
  });

  it("devuelve null cuando no hay parámetro", () => {
    expect(readStayParam(undefined)).toBeNull();
    expect(readStayParam("")).toBeNull();
  });

  it("toma el primero si la dirección repite el parámetro", () => {
    expect(readStayParam(["mirador", "casa-loma"])).toBe("mirador");
    expect(readStayParam([])).toBeNull();
  });

  it("rechaza lo que no puede ser un slug", () => {
    expect(readStayParam("../../etc/passwd")).toBeNull();
    expect(readStayParam("casa maima")).toBeNull();
    expect(readStayParam("-casa")).toBeNull();
    expect(readStayParam("<script>")).toBeNull();
    expect(readStayParam("a".repeat(120))).toBeNull();
  });
});

describe("selectStay", () => {
  it("sin parámetro, enseña el selector y no avisa de nada", () => {
    expect(selectStay(visible, null)).toEqual({
      stay: null,
      unavailable: false,
    });
  });

  it("preselecciona el alojamiento pedido", () => {
    const { stay, unavailable } = selectStay(visible, "mirador");
    expect(stay?.slug).toBe("mirador");
    expect(unavailable).toBe(false);
  });

  it("un alojamiento OCULTO cae al selector con aviso", () => {
    // `visible` es lo que devuelve `getAccommodations()`, que ya filtra por
    // `visible = true`: Casa Uba no está, así que no se puede elegir.
    const { stay, unavailable } = selectStay(visible, "casa-uba");
    expect(stay).toBeNull();
    expect(unavailable).toBe(true);
  });

  it("un slug inexistente se comporta igual que uno oculto", () => {
    expect(selectStay(visible, "casa-inventada")).toEqual({
      stay: null,
      unavailable: true,
    });
  });

  it("sin alojamientos publicados no hay nada que preseleccionar", () => {
    expect(selectStay([], "mirador")).toEqual({
      stay: null,
      unavailable: true,
    });
    expect(selectStay([], null)).toEqual({ stay: null, unavailable: false });
  });
});

describe("bookingPath", () => {
  it("sin alojamiento apunta a la página de reservas a secas", () => {
    expect(bookingPath()).toBe("/reservar");
    expect(bookingPath(null)).toBe("/reservar");
    expect(bookingPath("")).toBe("/reservar");
  });

  it("con alojamiento añade el parámetro", () => {
    expect(bookingPath("casa-maima")).toBe(
      `/reservar?${STAY_QUERY_PARAM}=casa-maima`,
    );
  });

  it("lo que produce vuelve a leerse igual (ida y vuelta)", () => {
    const path = bookingPath("tres-casitas");
    const value = new URL(path, "https://www.lamaima.com").searchParams.get(
      STAY_QUERY_PARAM,
    );
    expect(readStayParam(value ?? undefined)).toBe("tres-casitas");
  });
});
