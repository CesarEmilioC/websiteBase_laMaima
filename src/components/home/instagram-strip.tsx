import Image from "next/image";

import { ArrowRightIcon, InstagramIcon } from "../icons";
import type { GalleryImage } from "@/lib/content";

/**
 * Franja de Instagram, justo antes del pie.
 *
 * Nace de una frase literal del cliente sobre americantradehotel.com: le gusta
 * que ahí aparezcan "fotos del IG en vez de solo el logo". Es también la última
 * imagen que se lleva quien baja la portada entera, así que la selección
 * importa: seis cuadrados que cuentan seis cosas distintas —el valle, un
 * interior, la fauna, una terraza, el agua y la arquitectura— en vez de seis
 * fachadas parecidas.
 *
 * NO es un embebido de Instagram y no lo será: un widget de terceros añadiría
 * un iframe, cookies de seguimiento y varios cientos de kilobytes de
 * JavaScript a la página más visitada del sitio, y encima se rompe cada vez que
 * Instagram cambia su API. Estas son fotos del bucket propio que enlazan al
 * perfil.
 *
 * Las fotos se editan en `/admin/contenido` (`site_content.instagram_strip`,
 * ver `getInstagramGallery()` en `@/lib/content`), con el mismo `GalleryEditor`
 * que la galería de "Sobre la reserva". Con la galería vacía se cae con
 * elegancia a la selección original de seis fotos.
 */

type Props = {
  /** Fotos del bucket "gallery", editables desde el panel (`getInstagramGallery`). */
  photos: GalleryImage[];
  /** Enlace al perfil, editable desde el panel (`getContactInfo`). */
  href: string;
  handle: string;
};

export function InstagramStrip({ photos, href, handle }: Props) {
  return (
    <section
      className="section-y-sm bg-sand-soft"
      aria-labelledby="instagram-title"
    >
      <div className="container-page">
        {/* Encabezado centrado: la franja es un cierre, no una sección de
            contenido, y un encabezado a la izquierda pediría una columna de
            apoyo a la derecha que aquí no hay. */}
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow text-brand-700">{handle}</p>
          <h2
            id="instagram-title"
            className="tracking-editorial mt-3 text-[1.75rem] leading-[1.15] text-ink sm:text-[2.125rem]"
          >
            El día a día de la reserva
          </h2>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-muted">
            Amaneceres sobre el valle, las aves que volvieron al bosque y las
            casas por dentro.
          </p>
        </div>

        {/* Rejilla de cuadrados perfectos: tres columnas en móvil (dos filas de
            tres) y seis en escritorio (una sola fila). Nunca quedan huecos. */}
        <ul className="mt-10 grid grid-cols-3 gap-2.5 sm:gap-3 lg:grid-cols-6">
          {photos.map((photo) => (
            <li key={photo.url}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden rounded-card bg-brand-100"
              >
                <Image
                  src={photo.url}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 200px, 32vw"
                  quality={68}
                  /* Última franja de la portada: nunca compite por el ancho de
                     banda del primer pintado. */
                  fetchPriority="low"
                  className="object-cover transition-transform duration-[600ms] ease-ios group-hover:scale-[1.04]"
                />
                {/* Velo azul que solo aparece al pasar el cursor, con el icono
                    de Instagram encima: confirma que el cuadrado es un enlace
                    sin ensuciar la foto en reposo. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center bg-navy/45 opacity-0 transition-opacity duration-300 ease-ios group-hover:opacity-100"
                >
                  <InstagramIcon className="h-6 w-6 text-white" />
                </span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-9 flex justify-center">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full bg-brand-600 px-6 py-3.5 text-[0.9375rem] font-semibold text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-700 active:scale-[0.98]"
          >
            <InstagramIcon className="h-[1.15rem] w-[1.15rem]" />
            Síguenos en Instagram
            <ArrowRightIcon className="h-[0.95rem] w-[0.95rem]" />
          </a>
        </div>
      </div>
    </section>
  );
}
