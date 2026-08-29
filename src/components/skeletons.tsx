/**
 * Esqueletos de carga de las rutas públicas.
 *
 * Todas las páginas del sitio son estáticas y Next las precarga al pasar el
 * cursor (o al entrar el enlace en pantalla), así que en el uso normal estos
 * bloques apenas se ven. Existen para el caso contrario: la primera visita
 * desde una conexión lenta, o el enlace que se toca antes de que la precarga
 * termine. Sin ellos la pantalla se queda congelada en la página anterior y la
 * navegación "se siente trabada"; con ellos el cambio de página es inmediato y
 * el contenido llega encima.
 *
 * Son marcado puro con la paleta del sitio (nada de JavaScript, nada de
 * imágenes) y reproducen la SILUETA real de cada página, para que el salto al
 * contenido definitivo no mueva nada de sitio.
 */

/**
 * Bloque de arena con el pulso suave de iOS.
 *
 * El tono es `sand` (#e8e0d1) —el escalón más marcado de los neutros cálidos—
 * porque el lienzo del sitio es `shell` (#faf7f0) y las tarjetas son blancas:
 * con `sand-soft` el esqueleto casi no se vería.
 */
function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-sand ${className}`} />;
}

/**
 * Banda de encabezado fotográfica de las páginas internas.
 *
 * El alto (`min-h`), el relleno superior y el inferior son los MISMOS que los
 * de `PageHero`: si se tocan allí hay que tocarlos aquí, o el titular real
 * aparecerá en una posición distinta a la del esqueleto y la página dará un
 * salto (CLS) justo al terminar de cargar.
 */
export function HeroBandSkeleton() {
  return (
    <div className="flex min-h-[58vh] items-end bg-navy-soft pt-28 sm:min-h-[64vh] sm:pt-32">
      <div className="container-page w-full pb-16 sm:pb-20 lg:pb-24">
        {/* Miga de pan */}
        <div className="h-4 w-48 animate-pulse rounded-full bg-white/12" />
        {/* Etiqueta en pastilla */}
        <div className="mt-5 h-7 w-40 animate-pulse rounded-full bg-white/15" />
        {/* Titular a dos líneas */}
        <div className="mt-5 h-10 w-3/4 max-w-xl animate-pulse rounded-full bg-white/15 sm:h-12" />
        <div className="mt-3 h-10 w-1/2 max-w-md animate-pulse rounded-full bg-white/10 sm:h-12" />
        {/* Descripción */}
        <div className="mt-6 h-4 w-full max-w-lg animate-pulse rounded-full bg-white/10" />
        <div className="mt-2.5 h-4 w-2/3 max-w-sm animate-pulse rounded-full bg-white/10" />
      </div>
    </div>
  );
}

/**
 * Rejilla de tarjetas (alojamientos o experiencias).
 *
 * Las clases de rejilla replican una a una las de la página real: tres
 * columnas y `gap-7` en el listado de alojamientos, dos columnas desde `md` y
 * `gap-8` en el de experiencias.
 */
export function CardGridSkeleton({
  count,
  columns = 3,
}: {
  count: number;
  columns?: 2 | 3;
}) {
  return (
    <div
      className={`grid gap-6 ${
        columns === 3
          ? "sm:grid-cols-2 lg:grid-cols-3 lg:gap-7"
          : "md:grid-cols-2 lg:gap-8"
      }`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-card bg-white shadow-card ring-1 ring-inset ring-ink/[0.04]"
        >
          <div className="aspect-[4/3] animate-pulse bg-sand" />
          <div className="p-6">
            <Block className="h-6 w-2/3" />
            <Block className="mt-3 h-4 w-full" />
            <Block className="mt-2 h-4 w-4/5" />
            <Block className="mt-6 h-8 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Encabezado de sección: etiqueta en versalitas, titular y párrafo de apoyo. */
export function SectionHeadingSkeleton() {
  return (
    <div className="max-w-2xl">
      <Block className="h-3.5 w-32" />
      <Block className="mt-4 h-9 w-3/4 max-w-md sm:h-11" />
      <Block className="mt-5 h-4 w-full" />
      <Block className="mt-2.5 h-4 w-11/12" />
      <Block className="mt-2.5 h-4 w-3/5" />
    </div>
  );
}

/** Bloque de texto genérico, para la portada y el resto de rutas. */
export function ProseSkeleton() {
  return (
    <div>
      <Block className="h-4 w-28" />
      <Block className="mt-4 h-10 w-3/4 max-w-2xl sm:h-12" />
      <Block className="mt-3 h-10 w-1/2 max-w-xl sm:h-12" />
      <Block className="mt-8 h-4 w-full max-w-xl" />
      <Block className="mt-2.5 h-4 w-11/12 max-w-xl" />
      <Block className="mt-2.5 h-4 w-4/5 max-w-xl" />
    </div>
  );
}
