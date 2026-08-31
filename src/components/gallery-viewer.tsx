"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";

import type { GalleryImage } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";

/**
 * El visor entra en SU PROPIO trozo de JavaScript, que el navegador no pide
 * hasta que alguien toca una foto.
 *
 * Es la razón de que el visor viva en otro archivo: si se importara de la
 * forma normal, su código (y el de `react-dom/client` para el portal) viajaría
 * en el paquete inicial de la ficha, que es una página cuyo rendimiento móvil
 * se cuida al detalle. Con `ssr: false` tampoco se renderiza en el servidor:
 * el HTML de la ficha no crece ni un byte.
 */
const GalleryLightbox = dynamic(
  () => import("./gallery-lightbox").then((module) => module.GalleryLightbox),
  { ssr: false },
);

type Props = {
  /** TODAS las fotos del alojamiento, no solo las que se ven en la rejilla. */
  images: GalleryImage[];
  name: string;
  locale: Locale;
  /** La rejilla de miniaturas, renderizada en el servidor. */
  children: React.ReactNode;
};

/**
 * Envoltorio interactivo de la galería de la ficha.
 *
 * La rejilla la sigue pintando un componente de servidor (`gallery.tsx`) y
 * llega aquí como `children`: ni las fotos ni su maquetación pasan por el
 * cliente. Este componente solo aporta tres cosas:
 *
 *   1. UN escuchador de clic para toda la rejilla (delegación), en vez de un
 *      manejador por miniatura. Cada miniatura es un `<button>` real con su
 *      `data-lightbox-index`, así que el teclado funciona solo: pulsar Enter o
 *      Espacio en un botón dispara un `click` que burbujea hasta aquí.
 *   2. El montaje diferido del visor.
 *   3. La devolución del foco a la miniatura de origen al cerrar, que es lo
 *      que espera quien navega con teclado y lo que exige el patrón de
 *      diálogo modal.
 */
export function GalleryViewer({ images, name, locale, children }: Props) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const trigger = useRef<HTMLElement | null>(null);

  const onClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-lightbox-index]",
    );
    if (!button) return;

    const index = Number(button.dataset.lightboxIndex);
    if (!Number.isInteger(index) || index < 0) return;

    trigger.current = button;
    setOpenAt(index);
  }, []);

  const close = useCallback(() => {
    setOpenAt(null);
    trigger.current?.focus();
    trigger.current = null;
  }, []);

  return (
    /* El contenedor NO es el control: los controles son los `<button>` que
       lleva dentro, que ya son accesibles por teclado y por lector de
       pantalla. Este `onClick` solo recoge lo que burbujea desde ellos —
       incluido el `click` sintético que dispara pulsar Enter o Espacio en un
       botón—, así que no hace falta un manejador de teclado propio. */
    <div onClick={onClick}>
      {children}

      {openAt !== null && (
        <GalleryLightbox
          images={images}
          name={name}
          locale={locale}
          startIndex={openAt}
          onClose={close}
        />
      )}
    </div>
  );
}
