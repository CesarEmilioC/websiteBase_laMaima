"use client";

import { useEffect, useRef, useState } from "react";

import { MapPinIcon } from "./icons";

type Props = {
  /** URL del iframe embebido de Google Maps. */
  src: string;
  title: string;
  className?: string;
};

/**
 * Mapa de "Cómo llegar", montado solo cuando se acerca a la pantalla.
 *
 * EL PROBLEMA QUE RESUELVE
 * El iframe de Google Maps ya llevaba `loading="lazy"`, pero el atributo no
 * sirvió de nada: Chrome lo daba por "cerca del viewport" y lo cargaba con el
 * resto de la portada. Medido con Lighthouse en móvil, eso son **434 kB en
 * quince peticiones a googleapis.com y gstatic.com** peleándose por el ancho
 * de banda con la fotografía de portada y con las fuentes justo mientras se
 * decide el LCP. Retirarlo de la carga inicial subió la puntuación de
 * rendimiento de 89 a más de 90 sin quitarle el mapa a nadie.
 *
 * CÓMO
 * Un IntersectionObserver con 400 px de margen: el iframe se monta cuando el
 * visitante todavía está a media pantalla de distancia, así que para cuando
 * llega a la sección el mapa ya está pintado. Una vez montado se queda (el
 * observador se desconecta): no tiene sentido descargarlo y volverlo a pedir.
 *
 * SIN JAVASCRIPT
 * El `<noscript>` sirve el iframe tal cual, así que la sección funciona igual
 * para quien navegue sin JS y para los rastreadores que no lo ejecutan.
 *
 * SIN SALTO DE MAQUETA
 * El hueco lo define el contenedor de fuera (que fija el alto), y el marcador
 * de posición lo llena por completo. El iframe entra encima del mismo hueco,
 * así que el CLS sigue siendo cero.
 */
export function MapEmbed({ src, title, className = "" }: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const node = holder.current;
    if (!node) return;

    // Si el navegador no trae IntersectionObserver, se muestra sin más: es
    // preferible cargar el mapa de inmediato que dejar un hueco vacío.
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShow(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={holder} className={`relative h-full w-full ${className}`}>
      {show ? (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full border-0"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center bg-sand-soft"
        >
          <MapPinIcon className="h-8 w-8 text-brand-600/30" />
        </div>
      )}

      <noscript>
        <iframe
          src={src}
          title={title}
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0"
        />
      </noscript>
    </div>
  );
}
