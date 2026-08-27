/**
 * Transición ORGÁNICA entre dos secciones.
 *
 * El sitio dejó de encadenar franjas rectangulares: cada sección "sube" hacia
 * la anterior con una curva asimétrica que evoca las lomas de Dapa. Es un SVG
 * en línea (nada de librerías, nada de imágenes) que se pinta con el MISMO
 * color de la sección que lo contiene, así que visualmente el recorte lo hace
 * la sección de abajo sobre la de arriba.
 *
 * Uso: como primer hijo de una sección `relative`, con `fill` igual al fondo
 * de esa sección.
 *
 *   <section className="relative bg-white pt-28">
 *     <SectionCurve variant="loma" fill="fill-white" />
 *     …
 *   </section>
 *
 * La sección de arriba necesita algo de aire abajo (la curva se le monta
 * encima hasta ~96 px en escritorio) y la de abajo, algo de aire arriba.
 *
 * Las curvas son ASIMÉTRICAS a propósito: una onda de libro —simétrica y
 * repetida— es justo el recurso convencional que el cliente pidió evitar. Cada
 * variante tiene su cresta en un tercio distinto del ancho, y alternarlas (con
 * `flip` cuando hace falta) evita que dos transiciones seguidas rimen.
 */

type Variant = "loma" | "onda" | "arco";

/**
 * Todas las trayectorias van en un lienzo de 1440×120 y se estiran con
 * `preserveAspectRatio="none"`: la curva conserva su carácter tanto en un
 * móvil de 390 px como en un monitor ancho.
 */
const PATHS: Record<Variant, string> = {
  // Loma con la cresta a un tercio de la izquierda, cayendo hacia la derecha.
  loma: "M0,120 L0,72 C 190,12 430,-16 720,20 C 962,50 1212,92 1440,106 L1440,120 Z",
  // Onda muy larga, con un valle a la izquierda y la cresta pasada la mitad.
  onda: "M0,120 L0,66 C 262,112 470,8 782,40 C 1030,66 1218,104 1440,64 L1440,120 Z",
  // Arco que nace bajo a la izquierda y se levanta contra el borde derecho.
  arco: "M0,120 L0,108 C 252,96 520,56 800,24 C 1052,-6 1282,8 1440,68 L1440,120 Z",
};

type Props = {
  variant?: Variant;
  /** Clase de Tailwind con el color de la sección: `fill-white`, `fill-cream`… */
  fill: string;
  /** Espeja la curva en horizontal, para no repetir la misma silueta. */
  flip?: boolean;
  /**
   * `"arriba"` (por defecto): la curva se coloca por ENCIMA de la sección que
   * la contiene y se le monta a la anterior — el caso normal.
   * `"abajo"`: se dibuja dentro del borde inferior de la sección actual, con
   * el color de la SIGUIENTE. Es lo que necesitan las bandas de encabezado
   * fotográficas, que no pueden delegar la curva en su vecina.
   */
  at?: "arriba" | "abajo";
  /** Altura de la curva. Por defecto crece con el viewport. */
  className?: string;
};

export function SectionCurve({
  variant = "loma",
  fill,
  flip = false,
  at = "arriba",
  className = "h-[44px] sm:h-[68px] lg:h-[96px]",
}: Props) {
  return (
    <div
      aria-hidden="true"
      /* `-translate-y-[calc(100%-1px)]` deja el bloque entero por encima de la
         sección, con un píxel de solape: sin él, el redondeo a subpíxeles del
         navegador puede dejar una raya del color de la sección anterior. */
      className={`pointer-events-none absolute inset-x-0 w-full ${
        at === "arriba"
          ? "top-0 -translate-y-[calc(100%-1px)]"
          : "bottom-[-1px]"
      } ${className}`}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className={`h-full w-full ${flip ? "-scale-x-100" : ""}`}
        focusable="false"
      >
        <path d={PATHS[variant]} className={fill} />
      </svg>
    </div>
  );
}
