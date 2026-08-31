/**
 * Banderitas del conmutador de idioma: España e Inglaterra… bueno, Reino Unido.
 *
 * POR QUÉ SVG Y NO EMOJI. Los emoji de bandera (🇪🇸 🇬🇧) son pares de letras
 * regionales que el sistema operativo compone en un glifo. Windows NO trae esos
 * glifos: Chrome y Edge sobre Windows pintan las dos letras sueltas ("ES",
 * "GB") en un recuadro, que es justo la mitad del público de este sitio viendo
 * un control roto. Dibujadas a mano pesan unos cientos de bytes, se ven igual en
 * todas partes y se pueden ajustar de tamaño al píxel.
 *
 * Las dos banderas se dibujan en proporción 3:2 y con las esquinas redondeadas
 * por el contenedor, no por el SVG, para que compartan silueta exacta dentro de
 * la pastilla del conmutador.
 *
 * Son decorativas: el nombre accesible del control lo pone el `aria-label` del
 * enlace que las contiene, así que van con `aria-hidden`.
 */

/**
 * Las dos banderas comparten firma —aunque solo una use `idSuffix`— para que el
 * conmutador pueda elegir el componente con una variable y renderizarlo sin
 * ramas: `const Flag = option === "es" ? FlagES : FlagGB`.
 */
type Props = {
  className?: string;
  /** Sufijo del `id` interno: hace falta cuando el control se pinta dos veces. */
  idSuffix?: string;
};

/** Bandera de España (versión civil, sin escudo: a 20 px no se distinguiría). */
export function FlagES({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 60 40"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect width="60" height="40" fill="#AA151B" />
      <rect y="10" width="60" height="20" fill="#F1BF00" />
    </svg>
  );
}

/**
 * Bandera del Reino Unido.
 *
 * La `clipPath` recorta las diagonales rojas para que queden desplazadas
 * respecto a las blancas (es lo que distingue la Union Jack de una simple cruz
 * de San Andrés). Su identificador lleva sufijo porque el conmutador se pinta
 * dos veces —barra de escritorio y menú móvil— y dos `id` iguales en el mismo
 * documento son HTML inválido.
 */
export function FlagGB({ className = "", idSuffix = "a" }: Props) {
  const clipId = `uk-diagonals-${idSuffix}`;

  return (
    <svg
      viewBox="0 0 60 40"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <clipPath id={clipId}>
          {/* Cuatro cuñas: las mitades de cada diagonal que sí llevan rojo. */}
          <path d="M30 20 60 20 60 40z M30 20 30 40 0 40z M30 20 0 20 0 0z M30 20 30 0 60 0z" />
        </clipPath>
      </defs>

      <rect width="60" height="40" fill="#012169" />
      {/* Cruz de San Andrés y de San Patricio, en blanco. */}
      <path d="M0 0 60 40M60 0 0 40" stroke="#FFFFFF" strokeWidth="8" />
      <path
        d="M0 0 60 40M60 0 0 40"
        clipPath={`url(#${clipId})`}
        stroke="#C8102E"
        strokeWidth="5"
      />
      {/* Cruz de San Jorge. */}
      <path d="M30 0V40M0 20H60" stroke="#FFFFFF" strokeWidth="13" />
      <path d="M30 0V40M0 20H60" stroke="#C8102E" strokeWidth="8" />
    </svg>
  );
}
