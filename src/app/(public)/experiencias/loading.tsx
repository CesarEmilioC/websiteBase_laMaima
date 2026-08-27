import { CardGridSkeleton, HeroBandSkeleton } from "@/components/skeletons";

/** Silueta de experiencias: banda fotográfica + cuatro tarjetas a dos columnas. */
export default function Loading() {
  return (
    <>
      <HeroBandSkeleton />
      <div className="bg-cream pb-16 pt-12 sm:pb-20 sm:pt-14 lg:pb-24 lg:pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <CardGridSkeleton count={4} columns={2} />
        </div>
      </div>
    </>
  );
}
