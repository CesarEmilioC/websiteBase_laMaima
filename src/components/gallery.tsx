import Image from "next/image";

import { GalleryViewer } from "./gallery-viewer";
import { ExpandIcon } from "./icons";
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
 * v2.1 — CADA FOTO ABRE UN VISOR A PANTALLA COMPLETA. La vista sigue mostrando
 * cuatro fotos (más sería una parrilla, y el cliente quiere que la ficha se
 * lea de un vistazo), pero desde cualquiera de ellas se llega a la galería
 * ENTERA: la cuarta miniatura anuncia cuántas quedan con un "+N fotos".
 *
 * Este componente se queda en el SERVIDOR. Las miniaturas son `<button>`
 * normales con un `data-lightbox-index`, y quien los escucha es el envoltorio
 * `GalleryViewer` por delegación: así ni las fotos ni esta maquetación viajan
 * al navegador, y el visor solo se descarga cuando alguien toca una.
 */
const SIDE_ROWS: Record<number, string> = {
  1: "lg:grid-rows-1",
  2: "lg:grid-rows-2",
  3: "lg:grid-rows-3",
};

/** Cuántas fotos se ven sin abrir el visor. */
const VISIBLE = 4;

export function Gallery({ images, name }: Props) {
  if (images.length === 0) return null;

  const [main, ...rest] = images;
  const side = rest.slice(0, VISIBLE - 1);
  const fallbackAlt = `${name} en La Maima`;
  const total = images.length;
  /* Cuántas quedan fuera de la vista. El cliente añade y quita fotos desde el
     panel, así que el número se calcula siempre: nada supone doce ni ocho. */
  const remaining = Math.max(0, total - (1 + side.length));

  /** Texto accesible de cada miniatura: qué foto es y qué va a pasar al tocarla. */
  const label = (position: number, alt: string) =>
    total > 1
      ? `Ver la foto ${position} de ${total} a pantalla completa: ${alt}`
      : `Ver la foto a pantalla completa: ${alt}`;

  return (
    <section aria-label={`Galería de fotos de ${name}`}>
      <GalleryViewer images={images} name={name}>
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
          <button
            type="button"
            data-lightbox-index={0}
            aria-label={label(1, main.alt || fallbackAlt)}
            className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-card bg-brand-100 lg:col-span-2 lg:aspect-[3/2]"
          >
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
            {/* Señal de que la foto se puede abrir. Aparece al pasar el ratón o
                al recibir el foco por teclado; en táctil no estorba porque
                nunca llega a mostrarse. */}
            <span
              aria-hidden="true"
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-navy/45 text-white opacity-0 backdrop-blur-md transition-opacity duration-200 ease-ios group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              <ExpandIcon className="h-[1.05rem] w-[1.05rem]" />
            </span>
          </button>

          {side.length > 0 && (
            <div
              className={`grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-1 ${SIDE_ROWS[side.length]}`}
            >
              {side.map((image, index) => {
                const isLoneLast =
                  side.length % 2 === 1 && index === side.length - 1;
                /* El "+N fotos" va en la ÚLTIMA miniatura visible, que es la
                   que hace de puerta a lo que no se ve. */
                const showsRemaining =
                  remaining > 0 && index === side.length - 1;

                return (
                  <button
                    key={`${image.url}-${index}`}
                    type="button"
                    data-lightbox-index={index + 1}
                    aria-label={
                      showsRemaining
                        ? `Ver las ${total} fotos a pantalla completa`
                        : label(index + 2, image.alt || fallbackAlt)
                    }
                    className={`group relative cursor-zoom-in overflow-hidden rounded-card bg-brand-100 lg:col-span-1 lg:aspect-auto lg:h-full ${
                      isLoneLast ? "col-span-2 aspect-[16/9]" : "aspect-[4/3]"
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || fallbackAlt}
                      fill
                      sizes="(min-width: 1280px) 400px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      /* Las secundarias bajan a 68: comparten la carga inicial
                         con la principal, que es el LCP de la ficha, y a este
                         tamaño la diferencia de calidad no se aprecia. Y por lo
                         mismo van con prioridad baja explícita: entran a la vez
                         que la principal y no deben quitarle ancho de banda. */
                      quality={68}
                      fetchPriority="low"
                      className="object-cover"
                    />

                    {showsRemaining ? (
                      /* Velo con el resto de la galería. Es opaco a propósito:
                         tiene que leerse como "aquí hay más", no como una foto
                         más de la fila. */
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-navy/55 text-white backdrop-blur-[2px] transition-colors duration-200 ease-ios group-hover:bg-navy/65"
                      >
                        <ExpandIcon className="h-5 w-5" />
                        <span className="text-[1.0625rem] font-semibold tracking-[-0.02em]">
                          +{remaining} {remaining === 1 ? "foto" : "fotos"}
                        </span>
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 bg-navy/0 transition-colors duration-200 ease-ios group-hover:bg-navy/20 group-focus-visible:bg-navy/20"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </GalleryViewer>
    </section>
  );
}
