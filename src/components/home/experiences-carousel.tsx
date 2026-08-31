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
  /** Nombres accesibles de las flechas, ya traducidos. */
  prevLabel: string;
  nextLabel: string;
};

export function ExperiencesCarousel({
  children,
  label,
  prevLabel,
  nextLabel,
}: Props) {
  const track = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  /**
   * Desplazamiento máximo del carril, MEDIDO UNA VEZ.
   *
   * Aquí estaba el coste evitable del carrusel. La versión anterior leía
   * `scrollWidth` y `clientWidth` dentro del manejador de `scroll`, y las dos
   * son propiedades que OBLIGAN al navegador a rehacer estilo y maquetación
   * antes de responder ("forced synchronous layout"). Como el manejador se
   * dispara en cada fotograma del desplazamiento, se pagaba ese recálculo
   * sesenta veces por segundo mientras el dedo estaba en la pantalla. Medido
   * con CDP a 4× de ralentización de CPU: ~50 ms de recálculo de estilo por
   * cada barrido de dos segundos, un 25 % del total.
   *
   * El máximo solo cambia si cambia el tamaño de la ventana o el número de
   * tarjetas, así que se guarda y se recalcula únicamente ahí.
   */
  const maxScroll = useRef(0);

  /** Evita encadenar más de una comprobación por fotograma. */
  const frame = useRef(0);

  const measure = useCallback(() => {
    const node = track.current;
    if (!node) return;
    maxScroll.current = node.scrollWidth - node.clientWidth;
  }, []);

  /**
   * Estado de las flechas. Solo LEE `scrollLeft`, que el navegador ya tiene
   * calculado, y solo escribe en el estado de React cuando el valor cambia de
   * verdad (dos veces en todo un recorrido: al salir del principio y al llegar
   * al final).
   */
  const sync = useCallback(() => {
    const node = track.current;
    if (!node) return;
    const max = maxScroll.current;
    const left = node.scrollLeft;
    setCanPrev((current) => {
      const next = left > 8;
      return current === next ? current : next;
    });
    setCanNext((current) => {
      const next = left < max - 8;
      return current === next ? current : next;
    });
  }, []);

  /** Un `sync` por fotograma como mucho, nunca uno por evento de scroll. */
  const onScroll = useCallback(() => {
    if (frame.current) return;
    frame.current = window.requestAnimationFrame(() => {
      frame.current = 0;
      sync();
    });
  }, [sync]);

  useEffect(() => {
    const node = track.current;
    if (!node) return;

    measure();
    sync();

    const onResize = () => {
      measure();
      sync();
    };

    node.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    /* Las tarjetas pueden cambiar de ancho sin que la ventana se mueva (las
       fotos entran con `loading="lazy"`, y el cliente añade o quita
       experiencias desde el panel). `ResizeObserver` cubre eso; el evento de
       ventana, por sí solo, no. */
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onResize);
    observer?.observe(node);

    return () => {
      node.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
      if (frame.current) window.cancelAnimationFrame(frame.current);
    };
  }, [measure, onScroll, sync]);

  function scrollByCards(direction: 1 | -1) {
    const node = track.current;
    if (!node) return;
    /* Un paso = la distancia entre el borde de una tarjeta y el de la
       siguiente, medida sobre las dos primeras. Antes se sumaba el hueco a
       mano (`+ 20`), que es el valor de `gap-5`: si algún día cambia la clase,
       el paso deja de coincidir con el punto de anclaje y la flecha se queda a
       medio camino. Medido, no puede desincronizarse. */
    const cards = node.children;
    const first = cards[0] as HTMLElement | undefined;
    const second = cards[1] as HTMLElement | undefined;
    const step =
      first && second
        ? second.offsetLeft - first.offsetLeft
        : (first?.offsetWidth ?? node.clientWidth * 0.8);

    node.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div className="mb-5 hidden justify-end gap-2 lg:flex">
        <Arrow
          label={prevLabel}
          disabled={!canPrev}
          onClick={() => scrollByCards(-1)}
          flip
        />
        <Arrow
          label={nextLabel}
          disabled={!canNext}
          onClick={() => scrollByCards(1)}
        />
      </div>

      <ul
        ref={track}
        aria-label={label}
        /* `pb-3` deja sitio a la sombra de las tarjetas al levantarse en hover;
           los márgenes negativos llevan el carril hasta el borde de la ventana.

           `overscroll-x-contain` es OBLIGATORIO en cualquier carril horizontal
           de este sitio: sin él, al llegar al principio de la lista el gesto
           sobrante se encadena al navegador y Chrome y Safari lo interpretan
           como "deslizar para volver atrás" — el visitante se sale de la página
           creyendo que el carrusel se ha atascado. Se acota SOLO el eje X: el
           vertical tiene que seguir encadenándose para que la página pueda
           desplazarse con el dedo apoyado sobre las tarjetas, que en móvil
           ocupan casi toda la pantalla.

           Por la misma razón NO se pone `touch-action: pan-x`: bloquearía el
           desplazamiento vertical de la página desde dentro del carrusel. Aquí
           `auto` es lo correcto — el navegador decide el eje con el primer
           movimiento del dedo, que es justo lo que se quiere.

           El anclaje se queda en `mandatory`, no en `proximity`. Se probaron
           los dos con arrastres de 40, 80, 140 y 260 px (CDP, móvil emulado):
           con `mandatory` cualquier arrastre avanza una tarjeta completa; con
           `proximity`, los de 40 y 80 px VUELVEN al punto de partida y el de
           140 px se queda a mitad de tarjeta. Es decir: proximity produce
           exactamente la sensación de "no se mueve" que había que quitar. */
        className="no-scrollbar -mr-4 flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain scroll-pl-4 pb-3 pr-4 sm:-mr-6 sm:scroll-pl-6 sm:pr-6 lg:-mr-10 lg:scroll-pl-10 lg:pr-10"
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
