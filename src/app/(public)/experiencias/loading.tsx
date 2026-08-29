import { CardGridSkeleton, HeroBandSkeleton } from "@/components/skeletons";

/**
 * Silueta de experiencias: banda fotográfica + cuatro tarjetas a dos columnas,
 * con el mismo fondo y el mismo ritmo vertical que `experiencias/page.tsx`.
 */
export default function Loading() {
  return (
    <>
      <HeroBandSkeleton />
      <div className="section-y bg-shell">
        <div className="container-page">
          <CardGridSkeleton count={4} columns={2} />
        </div>
      </div>
    </>
  );
}
