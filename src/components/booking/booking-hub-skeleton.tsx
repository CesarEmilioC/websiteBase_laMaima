import { HeroBandSkeleton } from "@/components/skeletons";

/**
 * Silueta de `/reservar`: banda fotográfica y la sala azul marino de debajo.
 *
 * Esta ruta se renderiza en cada petición (lee `?cabana=` de la dirección), así
 * que es la única página pública donde el esqueleto se ve de verdad y no solo
 * con la red a rastras. Por eso copia las medidas de las dos posibilidades
 * —encabezado de sección centrado y una rejilla de tarjetas— con el mismo
 * fondo `navy`: si el esqueleto fuera claro, la página parpadearía de blanco a
 * azul al llegar el contenido.
 *
 * No intenta adivinar CUÁNTAS tarjetas habrá: pinta tres, que es una fila
 * completa en escritorio y basta para que se lea como "aquí viene una lista".
 * Un esqueleto no afirma nada sobre el negocio; solo reserva sitio.
 */
export function BookingHubSkeleton() {
  return (
    <>
      <HeroBandSkeleton />
      <div className="section-y bg-navy">
        <div className="container-page max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto h-3.5 w-24 animate-pulse rounded-full bg-white/15" />
            <div className="mx-auto mt-4 h-10 w-3/4 animate-pulse rounded-full bg-white/15 sm:h-12" />
            <div className="mx-auto mt-5 h-4 w-full animate-pulse rounded-full bg-white/10" />
            <div className="mx-auto mt-2.5 h-4 w-4/5 animate-pulse rounded-full bg-white/10" />
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-6">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="overflow-hidden rounded-card bg-white shadow-card"
              >
                <div className="aspect-[16/10] animate-pulse bg-sand" />
                <div className="p-5 sm:p-6">
                  <div className="h-6 w-2/3 animate-pulse rounded-full bg-sand" />
                  <div className="mt-3 h-5 w-1/2 animate-pulse rounded-full bg-sand" />
                  <div className="mt-5 h-11 w-full animate-pulse rounded-full bg-sand-soft" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
