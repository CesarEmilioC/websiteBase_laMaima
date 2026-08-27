"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ChevronRightIcon } from "@/components/icons";

/**
 * Carrusel horizontal de experiencias (portada).
 *
 * Sustituye a la rejilla plana de cuatro columnas. El desplazamiento es el
 * nativo del navegador con `scroll-snap`: en móvil se maneja con el dedo como
 * cualquier carrusel del sistema, y en escritorio hay dos flechas discretas.
 * No hay librería ni estado de posición: la única lógica de cliente es saber
 * si quedan tarjetas a un lado o al otro para apagar la flecha que sobre.
 *
 * Las tarjetas llegan como `children` ya renderizadas en el servidor (cada una
 * dentro de su `<li>`): así `ExperienceCard` sigue siendo un componente de
 * servidor y al navegador no viaja ni una línea de su marcado en JavaScript.
 *
 * El carril sangra hasta el borde derecho de la ventana (márgenes negativos
 * que compensan el padding del contenedor) para que la última tarjeta se corte
 * en el borde: es la señal visual de que hay más a la derecha.
 */
type Props = {
  children: React.ReactNode;
  label: string;
};

export function ExperiencesCarousel({ children, label }: Props) {
  const track = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    const node = track.current;
    if (!node) return;
    const max = node.scrollWidth - node.clientWidth;
    setCanPrev(node.scrollLeft > 8);
    setCanNext(node.scrollLeft < max - 8);
  }, []);

  useEffect(() => {
    sync();
    const node = track.current;
    if (!node) return;
    node.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      node.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  function scrollBy(direction: 1 | -1) {
    const node = track.current;
    if (!node) return;
    // Un paso = el ancho de la primera tarjeta más el hueco. Así el snap cae
    // siempre en una tarjeta completa, sea cual sea el tamaño de pantalla.
    const card = node.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 20 : node.clientWidth * 0.8;
    node.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div className="mb-5 hidden justify-end gap-2 lg:flex">
        <Arrow
          label="Ver las experiencias anteriores"
          disabled={!canPrev}
          onClick={() => scrollBy(-1)}
          flip
        />
        <Arrow
          label="Ver las siguientes experiencias"
          disabled={!canNext}
          onClick={() => scrollBy(1)}
        />
      </div>

      <ul
        ref={track}
        aria-label={label}
        /* `pb-3` deja sitio a la sombra de las tarjetas al levantarse en hover;
           los márgenes negativos llevan el carril hasta el borde de la ventana. */
        className="no-scrollbar -mr-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-pl-4 pb-3 pr-4 sm:-mr-6 sm:scroll-pl-6 sm:pr-6 lg:-mr-10 lg:scroll-pl-10 lg:pr-10"
      >
        {children}
      </ul>
    </div>
  );
}

function Arrow({
  label,
  disabled,
  onClick,
  flip = false,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  flip?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-inset ring-white/15 transition-[background-color,opacity,transform] duration-200 ease-ios hover:bg-white/20 active:scale-[0.94] disabled:pointer-events-none disabled:opacity-30"
    >
      <ChevronRightIcon className={`h-4 w-4 ${flip ? "-scale-x-100" : ""}`} />
    </button>
  );
}
