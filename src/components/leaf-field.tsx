/**
 * Capa decorativa de hojas flotando.
 *
 * Inspirada en el fondo animado de hotelcampestre.com, pero traída a la
 * paleta y al tono de La Maima: en vez de un enjambre de hojas verdes, unas
 * pocas siluetas tenues en azul o arena que cruzan la banda muy despacio. Es
 * atmósfera, no decoración infantil.
 *
 * v2.1 — EL MOVIMIENTO SE HACE PERCEPTIBLE. En la versión anterior cada hoja
 * recorría unos 20-30 px en más de medio minuto: técnicamente animado,
 * visualmente inmóvil. Ahora cada hoja combina DOS movimientos en elementos
 * anidados, que es lo que hace la diferencia entre "flotar" y "deslizarse":
 *
 *   · DERIVA (elemento exterior, `.leaf`): un viaje largo de 90-160 px en
 *     30-58 s. Es lo que de verdad se nota al mirar la pantalla unos segundos.
 *   · BALANCEO (elemento interior, `.leaf-sway`): un giro de hasta ±24° con un
 *     vaivén corto, en 9-17 s. Al ir a otro ritmo que la deriva, la hoja no
 *     repite nunca el mismo gesto en la misma posición.
 *
 * COSTE EN RENDIMIENTO: prácticamente cero, igual que antes.
 *  - Es un server component: no viaja ni un byte de JavaScript.
 *  - Cinco hojas como máximo, SVG en línea (ni una petición de red).
 *  - Las dos animaciones tocan SOLO `transform`, así que el navegador las
 *    resuelve en el compositor: no hay reflow ni repintado en ningún fotograma.
 *  - Ninguna hoja tiene `filter`, `box-shadow` ni `backdrop-filter`, que son
 *    los que de verdad cuestan.
 *
 * ACCESIBILIDAD: `aria-hidden` (no aporta información) y, con
 * `prefers-reduced-motion: reduce`, `globals.css` congela las DOS capas en su
 * posición inicial en vez de dejarlas saltar al fotograma final.
 *
 * MAQUETACIÓN: el contenedor es `absolute inset-0` con `overflow: hidden`, de
 * modo que una hoja desplazada nunca puede generar scroll horizontal. Debe
 * colocarse dentro de un ancestro `relative` y por debajo del contenido.
 */

type Tone = "light" | "dark";

/**
 * Cada hoja lleva su propia posición, tamaño, giro base y —sobre todo— sus
 * propias duraciones y desfases.
 *
 * Las duraciones de deriva son números primos entre sí (31, 41, 37, 53, 47 s) y
 * las de balanceo también (11, 17, 9, 13, 15 s): el periodo real de una hoja es
 * el mínimo común múltiplo de los dos, o sea horas. Nunca se ven dos hojas
 * haciendo el mismo gesto a la vez, que es lo que delata una animación barata.
 *
 * Los desfases son negativos para que al cargar la página el conjunto ya esté
 * "en marcha" y a medio recorrido, no todas arrancando desde el mismo sitio.
 */
const LEAVES = [
  {
    className: "left-[5%] top-[16%] h-14 w-14 sm:h-20 sm:w-20",
    rotate: -24,
    duration: "31s",
    delay: "-4s",
    x: "128px",
    y: "-104px",
    swayDuration: "11s",
    swayDelay: "-3s",
    from: "-14deg",
    to: "16deg",
    swayX: "16px",
    swayY: "12px",
    scale: 1.12,
  },
  {
    className: "right-[7%] top-[10%] h-16 w-16 sm:h-24 sm:w-24",
    rotate: 38,
    duration: "41s",
    delay: "-17s",
    x: "-150px",
    y: "118px",
    swayDuration: "17s",
    swayDelay: "-6s",
    from: "12deg",
    to: "-20deg",
    swayX: "-14px",
    swayY: "10px",
    scale: 1.08,
  },
  {
    className: "left-[17%] bottom-[14%] h-12 w-12 sm:h-16 sm:w-16",
    rotate: 12,
    duration: "37s",
    delay: "-25s",
    x: "112px",
    y: "96px",
    swayDuration: "9s",
    swayDelay: "-2s",
    from: "18deg",
    to: "-14deg",
    swayX: "12px",
    swayY: "-10px",
    scale: 1.14,
  },
  {
    className: "right-[15%] bottom-[20%] h-16 w-16 sm:h-28 sm:w-28",
    rotate: -52,
    duration: "53s",
    delay: "-9s",
    x: "-104px",
    y: "-132px",
    swayDuration: "13s",
    swayDelay: "-8s",
    from: "-10deg",
    to: "22deg",
    swayX: "-18px",
    swayY: "14px",
    scale: 1.09,
  },
  {
    className: "left-[45%] top-[32%] hidden h-14 w-14 lg:block",
    rotate: 68,
    duration: "47s",
    delay: "-31s",
    x: "136px",
    y: "88px",
    swayDuration: "15s",
    swayDelay: "-11s",
    from: "16deg",
    to: "-18deg",
    swayX: "14px",
    swayY: "-12px",
    scale: 1.11,
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
  //
  // v2.1: la opacidad sube un punto (0,30 → 0,38 en claro; 0,24 → 0,30 en
  // azul). Con el recorrido corto de antes, una hoja casi invisible tampoco se
  // veía moverse; con el recorrido nuevo, subirla lo justo es lo que hace que
  // el gesto se perciba sin que la capa compita con el titular.
  const color = tone === "light" ? "#e8e0d1" : "#345fc6";
  const fillOpacity = tone === "light" ? 0.07 : 0.06;
  const strokeOpacity = tone === "light" ? 0.38 : 0.3;

  return (
    <div aria-hidden="true" className={`leaf-field ${className}`}>
      {LEAVES.map((leaf, index) => (
        <div
          key={index}
          className={`leaf absolute ${leaf.className}`}
          style={
            {
              "--leaf-duration": leaf.duration,
              "--leaf-delay": leaf.delay,
              "--leaf-x": leaf.x,
              "--leaf-y": leaf.y,
            } as React.CSSProperties
          }
        >
          {/* Capa del balanceo: gira y se mece a un ritmo distinto del de la
              deriva del contenedor. Son dos elementos y no uno porque una
              segunda animación sobre el mismo elemento sobrescribiría el
              `transform` de la primera. */}
          <div
            className="leaf-sway"
            style={
              {
                "--sway-duration": leaf.swayDuration,
                "--sway-delay": leaf.swayDelay,
                "--leaf-from": leaf.from,
                "--leaf-to": leaf.to,
                "--sway-x": leaf.swayX,
                "--sway-y": leaf.swayY,
                "--leaf-scale": leaf.scale,
              } as React.CSSProperties
            }
          >
            {/* El giro base va en un envoltorio propio para que las animaciones
                puedan sumar el suyo sin sobrescribirlo. */}
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
                    anterior: es lo que convierte el contorno en una hoja y no
                    en una almendra. */}
                <path
                  d="M12 13.5C10.2 11.9 8.6 10.9 6.6 10.2M12 13.5C13.8 11.9 15.4 10.9 17.4 10.2M12 21C10.1 19.6 8.2 18.7 5.9 18.1M12 21C13.9 19.6 15.8 18.7 18.1 18.1M12 28.5C10.4 27.4 8.9 26.7 7.1 26.2M12 28.5C13.6 27.4 15.1 26.7 16.9 26.2"
                  strokeWidth="0.5"
                />
              </g>
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
