import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon, UsersIcon } from "../icons";
import { coverImage, type Accommodation } from "@/lib/content";
import { formatCOP, formatGuests } from "@/lib/format";
import { lowestRate } from "@/lib/pricing";

type Props = {
  accommodation: Accommodation;
  /** Posición en la lista: decide el lado de la foto y la carga diferida. */
  index: number;
};

/**
 * Fila de alojamiento en ZIGZAG para la portada.
 *
 * Sustituye a la rejilla escalonada de tarjetas. El patrón viene de
 * elbosquehotelboutique.com, que el cliente puso como referencia explícita:
 * filas alternadas de foto y texto, en vez de una parrilla.
 *
 * LO QUE HACE QUE FUNCIONE CON SEIS CABAÑAS (y no canse):
 *
 *  - La foto tiene ALTURA FIJA en escritorio (268 px), no proporción. Con
 *    `aspect-[16/10]` una foto a media página mediría 350 px y las seis filas
 *    sumarían más de dos mil píxeles de scroll; con altura fija, la fila entera
 *    mide poco más de 300 px y las seis se recorren de un tirón.
 *  - El texto es corto por contrato: nombre, una descripción de tres líneas
 *    como mucho, la tarifa "Desde" y los botones. Nada de listas de servicios,
 *    que es lo que engorda este patrón en otros sitios.
 *  - Las filas se separan con un filete de un píxel y aire simétrico, no con
 *    tarjetas: seis tarjetas con sombra, una debajo de otra, se leen como un
 *    listado administrativo. Un filete se lee como una revista.
 *
 * En móvil la alternancia desaparece —siempre foto arriba y texto debajo—
 * porque en una sola columna el zigzag no se percibe y solo conseguiría que la
 * mitad de las fotos llegaran después de su propio texto.
 */
export function AccommodationRow({ accommodation, index }: Props) {
  const cover = coverImage(
    accommodation.gallery,
    `${accommodation.name} en La Maima`,
  );

  // "Desde" = el tramo más barato de la tabla real de precios. Se calcula aquí
  // en vez de leer la columna para que no pueda quedarse atrás si el cliente
  // edita un precio desde el panel.
  const from = lowestRate(accommodation.tiers, accommodation.price_per_night_cop);
  const href = `/alojamientos/${accommodation.slug}`;

  // Las filas pares llevan la foto a la izquierda; las impares, a la derecha.
  const photoRight = index % 2 === 1;

  return (
    <article
      className={`grid items-center gap-6 py-8 sm:gap-8 lg:grid-cols-12 lg:gap-12 lg:py-10 ${
        index > 0 ? "border-t border-ink/[0.08]" : ""
      }`}
      data-reveal
    >
      {/* Foto: rectángulo puro, sin máscaras. */}
      <div
        className={`relative h-56 overflow-hidden rounded-card bg-brand-100 sm:h-64 lg:col-span-7 lg:h-[268px] ${
          photoRight ? "lg:order-2" : ""
        }`}
      >
        <Image
          src={cover.url}
          alt={cover.alt}
          fill
          /* Las dos primeras filas suelen quedar cerca del pliegue en
             escritorio; el resto entra bien entrado el scroll. Ninguna es el
             LCP (lo es la portada), así que todas van diferidas. */
          sizes="(min-width: 1024px) 640px, 100vw"
          quality={68}
          /* Ninguna de las seis es el LCP: prioridad baja explícita para que
             no compitan con la fotografía de portada. */
          fetchPriority="low"
          className="object-cover"
        />
      </div>

      {/* Texto */}
      <div className={`lg:col-span-5 ${photoRight ? "lg:order-1 lg:pr-4" : "lg:pl-4"}`}>
        <p className="eyebrow flex items-center gap-2 text-brand-700">
          <UsersIcon className="h-3.5 w-3.5" />
          Hasta {formatGuests(accommodation.capacity)}
        </p>

        <h3 className="mt-3 text-[1.625rem] leading-[1.15] text-ink sm:text-[1.875rem]">
          <Link
            href={href}
            className="transition-colors duration-200 hover:text-brand-700"
          >
            {accommodation.name}
          </Link>
        </h3>

        {accommodation.short_description && (
          /* Tres líneas como tope: con seis filas seguidas, una descripción de
             cinco líneas en una y de dos en otra descuadra el ritmo vertical
             de toda la sección. */
          <p className="mt-2.5 line-clamp-3 text-[0.9375rem] leading-relaxed text-ink-muted">
            {accommodation.short_description}
          </p>
        )}

        <p className="mt-4 flex items-baseline gap-1.5">
          <span className="eyebrow text-ink-muted">Desde</span>
          <span className="text-[1.375rem] font-semibold leading-none tracking-[-0.02em] text-brand-700">
            {formatCOP(from.amountCop)}
          </span>
          <span className="text-[0.8125rem] font-medium text-ink-muted">
            / noche
          </span>
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <Link
            href={`${href}#reservar`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-[0.9375rem] font-semibold text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-700 active:scale-[0.98]"
          >
            Reservar
          </Link>
          <Link
            href={href}
            className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[0.9375rem] font-semibold text-ink-soft transition-colors duration-200 ease-ios hover:bg-brand-600/[0.07] hover:text-brand-700"
          >
            Ver detalles
            <ArrowRightIcon className="h-[0.95rem] w-[0.95rem]" />
          </Link>
        </div>
      </div>
    </article>
  );
}
