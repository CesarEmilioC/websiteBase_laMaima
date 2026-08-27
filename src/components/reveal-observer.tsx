"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Entradas al hacer scroll, sin librerías de animación.
 *
 * Un único componente montado en el layout público observa TODOS los
 * elementos que lleven `data-reveal` y les añade `is-revealed` cuando entran
 * en pantalla. Los componentes de servidor solo tienen que escribir el
 * atributo: no hay un wrapper de cliente por cada tarjeta, así que el coste en
 * JavaScript es este archivo y nada más.
 *
 * Dos decisiones que conviene no perder de vista:
 *
 *  1. El estado oculto vive en CSS bajo `html.reveal-ready` y esa clase la
 *     pone ESTE componente al montar. Sin JavaScript la regla nunca aplica y
 *     la página se ve completa desde el primer pintado — nada de titulares
 *     invisibles si el bundle falla.
 *  2. Si el sistema pide menos movimiento (`prefers-reduced-motion`) no se
 *     hace nada en absoluto: ni clase, ni observador.
 *
 * Se vuelve a escanear al cambiar de ruta porque la navegación del App Router
 * reemplaza el árbol sin desmontar el layout.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const root = document.documentElement;
    root.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          // Una sola vez: nada se vuelve a ocultar al subir.
          observer.unobserve(entry.target);
        }
      },
      // El margen inferior negativo hace que la transición arranque cuando el
      // elemento ya asomó de verdad (no en el píxel exacto del borde) y el
      // margen superior generoso evita que lo que queda por encima del pliegue
      // al cargar se quede esperando.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
    for (const target of targets) {
      // Lo que ya está en pantalla al cargar (el hero) se muestra sin esperar
      // al observador: evita un parpadeo en la primera pintura.
      const rect = target.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) {
        target.classList.add("is-revealed");
        continue;
      }
      observer.observe(target);
    }

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
