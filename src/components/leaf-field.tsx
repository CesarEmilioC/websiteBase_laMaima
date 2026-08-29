/**
 * Capa decorativa de hojas flotando.
 *
 * Inspirada en el fondo animado de hotelcampestre.com, pero traída a la
 * paleta y al tono de La Maima: en vez de un enjambre de hojas verdes, unas
 * pocas siluetas muy tenues en azul o arena que se mecen tan despacio que casi
 * no se ven moverse. Es atmósfera, no decoración infantil.
 *
 * COSTE EN RENDIMIENTO: prácticamente cero.
 *  - Es un server component: no viaja ni un byte de JavaScript.
 *  - Cinco elementos como máximo, SVG en línea (ni una petición de red).
 *  - La animación toca SOLO `transform`, así que el navegador la resuelve en
 *    el compositor: no hay reflow ni repintado en ningún fotograma.
 *  - Ninguna hoja tiene `filter`, `box-shadow` ni `backdrop-filter`, que son
 *    los que de verdad cuestan.
 *
 * ACCESIBILIDAD: `aria-hidden` (no aporta información) y, con
 * `prefers-reduced-motion: reduce`, `globals.css` congela las hojas en su
 * posición inicial en vez de dejarlas saltar al fotograma final.
 *
 * MAQUETACIÓN: el contenedor es `absolute inset-0` con `overflow: hidden`, de
 * modo que una hoja desplazada nunca puede generar scroll horizontal. Debe
 * colocarse dentro de un ancestro `relative` y por debajo del contenido.
 */

type Tone = "light" | "dark";

/**
 * Cada hoja lleva su propia posición, tamaño, giro y —sobre todo— su propia
 * duración y desfase. Las duraciones son números primos entre sí (29, 37, 31,
 * 43, 34 s): así el conjunto tarda horas en repetir la misma combinación y
 * nunca se ven dos hojas haciendo el mismo gesto a la vez, que es lo que
 * delata una animación barata.
 */
const LEAVES = [
  {
    className: "left-[5%] top-[16%] h-14 w-14 sm:h-20 sm:w-20",
    rotate: -24,
    duration: "29s",
    delay: "0s",
    x: "22px",
    y: "-30px",
    from: "-7deg",
    to: "6deg",
    alt: false,
  },
  {
    className: "right-[7%] top-[10%] h-16 w-16 sm:h-24 sm:w-24",
    rotate: 38,
    duration: "37s",
    delay: "-6s",
    x: "-26px",
    y: "24px",
    from: "5deg",
    to: "-9deg",
    alt: true,
  },
  {
    className: "left-[17%] bottom-[14%] h-12 w-12 sm:h-16 sm:w-16",
    rotate: 12,
    duration: "31s",
    delay: "-14s",
    x: "18px",
    y: "22px",
    from: "8deg",
    to: "-5deg",
    alt: true,
  },
  {
    className: "right-[15%] bottom-[20%] h-16 w-16 sm:h-28 sm:w-28",
    rotate: -52,
    duration: "43s",
    delay: "-3s",
    x: "-20px",
    y: "-28px",
    from: "-4deg",
    to: "9deg",
    alt: false,
  },
  {
    className: "left-[45%] top-[32%] hidden h-14 w-14 lg:block",
    rotate: 68,
    duration: "34s",
    delay: "-20s",
    x: "24px",
    y: "18px",
    from: "6deg",
    to: "-7deg",
    alt: false,
  },
] as const;

type Props = {
  /**
   * `"light"` — hojas claras (arena) para bandas oscuras.
   * `"dark"`  — hojas azules para fondos claros.
   */
  tone?: Tone;
  /** Ajuste fino de la opacidad general de la capa. */
  className?: string;
};

export function LeafField({ tone = "light", className = "" }: Props) {
  // Sobre foto y azul marino la hoja va clara (arena); sobre blanco cálido,
  // azul.
  //
  // POR QUÉ CONTORNO Y NO SILUETA MACIZA: una silueta rellena, por poca
  // opacidad que se le ponga, sobre una fotografía se lee como una mancha de
  // niebla o una huella en el objetivo, no como una hoja. Dibujada —contorno
  // fino, nervio central y tres pares de nervaduras, con un relleno casi
  // inexistente que solo la separa del fondo— se reconoce al instante y remite
  // además al monograma del logotipo, que es un haz de nervaduras.
  const color = tone === "light" ? "#e8e0d1" : "#345fc6";
  const fillOpacity = tone === "light" ? 0.05 : 0.045;
  const strokeOpacity = tone === "light" ? 0.3 : 0.24;

  return (
    <div aria-hidden="true" className={`leaf-field ${className}`}>
      {LEAVES.map((leaf, index) => (
        <div
          key={index}
          className={`leaf absolute ${leaf.alt ? "leaf-alt" : ""} ${leaf.className}`}
          style={
            {
              "--leaf-duration": leaf.duration,
              "--leaf-delay": leaf.delay,
              "--leaf-x": leaf.x,
              "--leaf-y": leaf.y,
              "--leaf-from": leaf.from,
              "--leaf-to": leaf.to,
            } as React.CSSProperties
          }
        >
          {/* El giro base va en un envoltorio propio para que la animación
              pueda sumar el suyo sin sobrescribirlo. */}
          <svg
            viewBox="0 0 24 40"
            className="h-full w-full"
            style={{ transform: `rotate(${leaf.rotate}deg)` }}
            focusable="false"
          >
            <g
              stroke={color}
              strokeOpacity={strokeOpacity}
              strokeLinecap="round"
              fill="none"
              vectorEffect="non-scaling-stroke"
            >
              {/* Contorno lanceolado: dos curvas simétricas que se juntan en
                  punta arriba y abajo. */}
              <path
                d="M12 1.5C19.6 12 21.8 26 12 38.5C2.2 26 4.4 12 12 1.5Z"
                fill={color}
                fillOpacity={fillOpacity}
                strokeWidth="0.7"
              />
              {/* Nervio central */}
              <path d="M12 4.5V35.5" strokeWidth="0.6" />
              {/* Tres pares de nervaduras, cada par un poco más corto que el
                  anterior: es lo que convierte el contorno en una hoja y no en
                  una almendra. */}
              <path
                d="M12 13.5C10.2 11.9 8.6 10.9 6.6 10.2M12 13.5C13.8 11.9 15.4 10.9 17.4 10.2M12 21C10.1 19.6 8.2 18.7 5.9 18.1M12 21C13.9 19.6 15.8 18.7 18.1 18.1M12 28.5C10.4 27.4 8.9 26.7 7.1 26.2M12 28.5C13.6 27.4 15.1 26.7 16.9 26.2"
                strokeWidth="0.5"
              />
            </g>
          </svg>
        </div>
      ))}
    </div>
  );
}
