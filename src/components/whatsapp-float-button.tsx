"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { WhatsAppIcon } from "./icons";

/**
 * Parte cliente del botón flotante de WhatsApp: la pastilla en sí y la única
 * pizca de comportamiento que necesita.
 *
 * EL PROBLEMA
 * En móvil el flotante vive fijo abajo a la derecha, y en las páginas de
 * alojamiento la sección `#reservar` termina en esa misma esquina con el
 * botón "Solicitar reserva por WhatsApp" del widget. Los dos se pisaban: el
 * flotante tapaba una esquina del panel y ofrecía, encima, la misma acción
 * que el botón que estaba tapando.
 *
 * LA SOLUCIÓN
 * Un IntersectionObserver sobre `#reservar`: mientras esa sección esté en
 * pantalla, el flotante se funde y se retira. Cuando se sale de ella, vuelve.
 * No se desmonta —se anima la opacidad— para que la vuelta sea un fundido y
 * no un parpadeo.
 *
 * Detalles que importan:
 *   - Sin `rootMargin`: en cuanto la sección asoma por el borde inferior ya
 *     está debajo del botón, que es justo donde molesta.
 *   - Se vuelve a buscar el ancla en cada cambio de ruta (`usePathname`): el
 *     layout público no se desmonta al navegar, así que el efecto tiene que
 *     re-suscribirse al `#reservar` de la página nueva (o dejar el botón
 *     visible si esa página no tiene ninguno).
 *   - Oculto también significa oculto para el teclado y para el lector de
 *     pantalla (`aria-hidden` + `tabIndex={-1}`), no solo transparente.
 *   - El estado inicial es "visible" en servidor y en cliente: la hidratación
 *     coincide y el observador corrige en el primer fotograma si hace falta.
 */

/** Ancla de la sección del motor de reservas, en `alojamientos/[slug]`. */
const BOOKING_SECTION_ID = "reservar";

type Props = {
  href: string;
};

export function WhatsAppFloatButton({ href }: Props) {
  const pathname = usePathname();
  const [overBooking, setOverBooking] = useState(false);

  useEffect(() => {
    const target = document.getElementById(BOOKING_SECTION_ID);

    if (!target) {
      // Página sin motor de reservas: el flotante no estorba a nadie.
      setOverBooking(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setOverBooking(entry.isIntersecting),
      { threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      aria-hidden={overBooking}
      tabIndex={overBooking ? -1 : undefined}
      className={`fixed bottom-5 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-forest-600 text-white shadow-float transition-[background-color,opacity,transform] duration-300 ease-ios hover:bg-forest-700 focus-visible:outline-offset-4 sm:bottom-6 sm:right-6 sm:h-[3.75rem] sm:w-[3.75rem] lg:hidden ${
        overBooking
          ? "pointer-events-none scale-90 opacity-0"
          : "scale-100 opacity-100 hover:scale-[1.04] active:scale-95"
      }`}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
