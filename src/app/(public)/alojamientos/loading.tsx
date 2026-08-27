import { CardGridSkeleton, HeroBandSkeleton } from "@/components/skeletons";

/** Silueta del listado: banda fotográfica + seis tarjetas en tres columnas. */
export default function Loading() {
  return (
    <>
      <HeroBandSkeleton />
      <div className="bg-cream pb-16 pt-12 sm:pb-20 sm:pt-14 lg:pb-24 lg:pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="mt-12 lg:mt-16">
            <CardGridSkeleton count={6} />
          </div>
        </div>
      </div>
    </>
  );
}
