import { ProseSkeleton } from "@/components/skeletons";

/**
 * Esqueleto por defecto de las rutas públicas (portada y páginas legales).
 * Las rutas con una silueta muy marcada —listados y ficha de alojamiento—
 * tienen el suyo propio en su carpeta.
 *
 * El relleno superior no es el de `.section-y`: por debajo del header fijo
 * (64 px, 74 px desde `md`) haría falta sumarle el aire, así que se declara
 * igual que en las cabeceras sin foto (`pt-28 sm:pt-32 lg:pt-36`).
 */
export default function Loading() {
  return (
    <div className="bg-shell pb-24 pt-28 sm:pt-32 lg:pt-36">
      <div className="container-page">
        <ProseSkeleton />
      </div>
    </div>
  );
}
