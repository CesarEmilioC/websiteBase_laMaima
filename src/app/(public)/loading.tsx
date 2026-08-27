import { ProseSkeleton } from "@/components/skeletons";

/**
 * Esqueleto por defecto de las rutas públicas (portada y páginas legales).
 * Las rutas con una silueta muy marcada —listados y ficha de alojamiento—
 * tienen el suyo propio en su carpeta.
 */
export default function Loading() {
  return (
    <div className="bg-white pb-24 pt-32 sm:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <ProseSkeleton />
      </div>
    </div>
  );
}
