"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import type { GalleryImage } from "@/lib/content";

/**
 * Galería automática de la sección "Sobre la reserva".
 *
 * Sustituye a la foto única: unas pocas imágenes que cuentan qué es la reserva
 * (el valle, el bosque, la quebrada, la fauna) encadenadas con un fundido
 * lento. Las edita el cliente desde `/admin/contenido` (clave
 * `site_content.home_about.gallery`), con el mismo editor de galería que usan
 * alojamientos y experiencias.
 *
 * Reglas de comportamiento:
 *
 *  - Avance cada 4,5 s con fundido cruzado de 900 ms. El fotograma entrante
 *    llega con un 4 % de escala de más y se asienta durante el fundido: es un
 *    movimiento de transformación (barato para el compositor) que evita que el
 *    cambio se sienta mecánico.
 *  - Se PAUSA con el puntero encima, con el dedo apoyado y cuando el teclado
 *    entra en los puntos: nadie debería pelear con una foto que se le mueve
 *    mientras la mira.
 *  - Se pausa también con la pestaña en segundo plano (nada de temporizadores
 *    corriendo donde no se ven).
 *  - Con `prefers-reduced-motion` NO hay avance automático: se ve la primera
 *    foto y los puntos siguen sirviendo para cambiarla a mano.
 *
 * El marco lleva la máscara orgánica `.mask-pebble` (ver globals.css). Es una
 * de las dos únicas piezas irregulares del sitio, y por eso funciona.
 */

const INTERVAL_MS = 4500;

type Props = {
  images: GalleryImage[];
  /** Texto de respaldo cuando una foto viene sin descripción. */
  fallbackAlt: string;
};

export function AboutGallery({ images, fallbackAlt }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const touchPause = useRef<number | null>(null);

  /**
   * Índices que ya tienen su `<Image>` en el DOM.
   *
   * El HTML servido trae SOLO la primera foto. Si estuvieran las cinco, el
   * navegador —que sobre una conexión lenta anticipa mucho más allá del
   * pliegue— se pondría a bajarlas compitiendo por ancho de banda con la foto
   * de portada, que es la métrica LCP de la página. Cada foto se monta cuando
   * le toca (y la siguiente con ella, para que el fundido no llegue en
   * blanco), varios segundos después de que la página ya esté servida.
   */
  const [mounted, setMounted] = useState<number[]>([0]);

  useEffect(() => {
    if (images.length < 2) return;
    const next = (index + 1) % images.length;
    setMounted((current) =>
      current.includes(index) && current.includes(next)
        ? current
        : [...new Set([...current, index, next])],
    );
  }, [index, images.length]);

  // El autoplay se decide en el navegador (no en el HTML) para que respete la
  // preferencia real del sistema y siga los cambios en caliente.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setAutoplay(!query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!autoplay || paused || images.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % images.length),
      INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [autoplay, paused, images.length]);

  useEffect(
    () => () => {
      if (touchPause.current !== null) window.clearTimeout(touchPause.current);
    },
    [],
  );

  if (images.length === 0) return null;

  /** Tras soltar el dedo se deja un respiro antes de reanudar el avance. */
  function resumeAfterTouch() {
    if (touchPause.current !== null) window.clearTimeout(touchPause.current);
    touchPause.current = window.setTimeout(() => setPaused(false), 2500);
  }

  return (
    <div
      className="relative"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={resumeAfterTouch}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        role="group"
        aria-roledescription="carrusel"
        aria-label="Fotos de la reserva natural"
        /* `mask-pebble` es el guijarro asimétrico; `shadow-panel` lo despega
           del blanco de la sección sin dibujarle un borde. */
        className="mask-pebble relative aspect-[4/3] overflow-hidden bg-forest-100 shadow-panel sm:aspect-[5/4] lg:aspect-[4/5]"
      >
        {images.map((image, position) => {
          if (!mounted.includes(position)) return null;
          const active = position === index;
          return (
            <div
              key={`${image.url}-${position}`}
              aria-hidden={!active}
              className={`absolute inset-0 transition-[opacity,transform] duration-[900ms] ease-ios ${
                active ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"
              }`}
            >
              <Image
                src={image.url}
                alt={active ? image.alt || fallbackAlt : ""}
                fill
                sizes="(min-width: 1024px) 42vw, (min-width: 640px) 80vw, 100vw"
                className="object-cover"
              />
            </div>
          );
        })}
      </div>

      {images.length > 1 && (
        <div className="mt-5 flex items-center justify-center gap-1 lg:justify-start lg:pl-6">
          {images.map((image, position) => {
            const active = position === index;
            return (
              <button
                key={`dot-${image.url}-${position}`}
                type="button"
                onClick={() => setIndex(position)}
                aria-label={`Ver la foto ${position + 1} de ${images.length}`}
                aria-current={active ? "true" : undefined}
                /* Punto de 7 px dentro de un botón de 28 px: discreto a la
                   vista y con el área táctil que pide la WCAG 2.2. */
                className="group inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-200 hover:bg-black/[0.04]"
              >
                <span
                  className={`block rounded-full transition-[width,height,background-color] duration-300 ease-ios ${
                    active
                      ? "h-[7px] w-[18px] bg-forest-600"
                      : "h-[7px] w-[7px] bg-ink-muted/35 group-hover:bg-ink-muted/60"
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
