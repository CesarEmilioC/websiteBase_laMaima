import Image from "next/image";

import type { GalleryImage } from "@/lib/content";

type Props = {
  images: GalleryImage[];
  /** Nombre del alojamiento, para el alt de respaldo. */
  name: string;
};

/**
 * Galería del detalle de alojamiento: una foto principal grande y hasta tres
 * secundarias en una columna que ocupa exactamente el mismo alto (escritorio)
 * o una rejilla debajo (móvil). Si el número de secundarias es impar, la
 * última ocupa el ancho completo para no dejar un hueco.
 *
 * Es estática a propósito: el visor con lightbox llega cuando el cliente
 * entregue las fotos definitivas en alta resolución.
 */
const SIDE_ROWS: Record<number, string> = {
  1: "lg:grid-rows-1",
  2: "lg:grid-rows-2",
  3: "lg:grid-rows-3",
};

export function Gallery({ images, name }: Props) {
  if (images.length === 0) return null;

  const [main, ...rest] = images;
  const side = rest.slice(0, 3);
  const fallbackAlt = `${name} en La Maima`;

  return (
    <section aria-label={`Galería de fotos de ${name}`}>
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-forest-100 lg:col-span-2 lg:aspect-[3/2]">
          <Image
            src={main.url}
            alt={main.alt || fallbackAlt}
            fill
            priority
            /* Es el LCP de la ficha: se le pide prioridad explícita para que
               el navegador no la ponga en la misma cola que el resto. */
            fetchPriority="high"
            sizes="(min-width: 1280px) 800px, (min-width: 1024px) 66vw, 100vw"
            className="object-cover"
          />
        </div>

        {side.length > 0 && (
          <div
            className={`grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-1 ${SIDE_ROWS[side.length]}`}
          >
            {side.map((image, index) => {
              const isLoneLast =
                side.length % 2 === 1 && index === side.length - 1;

              return (
                <div
                  key={`${image.url}-${index}`}
                  className={`relative overflow-hidden rounded-card bg-forest-100 lg:col-span-1 lg:aspect-auto lg:h-full ${
                    isLoneLast
                      ? "col-span-2 aspect-[16/9]"
                      : "aspect-[4/3]"
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={image.alt || fallbackAlt}
                    fill
                    sizes="(min-width: 1280px) 400px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
