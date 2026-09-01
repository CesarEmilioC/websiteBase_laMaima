import {
  CardGridSkeleton,
  HeroBandSkeleton,
  SectionHeadingSkeleton,
} from "@/components/skeletons";

/**
 * Silueta del listado: banda fotográfica, encabezado de sección y una rejilla
 * de tarjetas en tres columnas. El fondo, el ritmo vertical y el margen superior
 * de la rejilla son los mismos que los de `alojamientos/page.tsx`.
 */
export default function Loading() {
  return (
    <>
      <HeroBandSkeleton />
      <div className="section-y bg-shell">
        <div className="container-page">
          <SectionHeadingSkeleton />
          <div className="mt-12 lg:mt-14">
            <CardGridSkeleton count={6} />
          </div>
        </div>
      </div>
    </>
  );
}
