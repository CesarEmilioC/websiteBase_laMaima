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

/** Bloque gris con el pulso suave de iOS. */
function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-cream-200 ${className}`} />;
}

/** Banda de encabezado fotográfica de las páginas internas. */
export function HeroBandSkeleton() {
  return (
    <div className="flex min-h-[58vh] items-end bg-forest-900 pt-24 sm:min-h-[64vh]">
      <div className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24 lg:px-10 lg:pb-32">
        <div className="h-5 w-40 animate-pulse rounded-full bg-white/15" />
        <div className="mt-6 h-11 w-3/4 max-w-xl animate-pulse rounded-full bg-white/15 sm:h-14" />
        <div className="mt-4 h-11 w-1/2 max-w-md animate-pulse rounded-full bg-white/10 sm:h-14" />
      </div>
    </div>
  );
}

/** Rejilla de tarjetas (alojamientos o experiencias). */
export function CardGridSkeleton({
  count,
  columns = 3,
}: {
  count: number;
  columns?: 2 | 3;
}) {
  return (
    <div
      className={`grid gap-6 sm:grid-cols-2 lg:gap-7 ${
        columns === 3 ? "lg:grid-cols-3" : ""
      }`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-card bg-white shadow-card">
          <div className="aspect-[4/3] animate-pulse bg-cream-200" />
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
