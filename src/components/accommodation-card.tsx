import Image from "next/image";
import Link from "next/link";

import { ChevronRightIcon, UsersIcon } from "./icons";
import { coverImage, type Accommodation } from "@/lib/content";
import { formatCOP, formatGuests } from "@/lib/format";
import { lowestRate } from "@/lib/pricing";

type Props = {
  accommodation: Accommodation;
};

/**
 * Tarjeta de alojamiento: foto grande arriba, metadatos limpios abajo.
 * Sin bordes duros — solo radio grande, sombra difusa y una elevación muy
 * sutil al pasar el cursor (estilo tarjeta de iOS).
 *
 * La foto va SIEMPRE en carga diferida: en todas las páginas donde aparece
 * esta tarjeta (portada, listado, "otros alojamientos") queda por debajo del
 * pliegue, y marcarla como prioritaria le robaba ancho de banda a la imagen
 * que sí es el LCP —la banda de encabezado— empeorando la métrica.
 */
export function AccommodationCard({ accommodation }: Props) {
  const cover = coverImage(
    accommodation.gallery,
    `${accommodation.name} en La Maima`,
  );

  // "Desde" = el tramo más barato de la tabla real de precios. Se calcula aquí
  // en vez de leer la columna para que no pueda quedarse atrás si el cliente
  // edita un precio desde el panel.
  const from = lowestRate(accommodation.tiers, accommodation.price_per_night_cop);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card bg-white shadow-card transition-[box-shadow,transform] duration-300 ease-ios hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden bg-forest-100">
        <Image
          src={cover.url}
          alt={cover.alt}
          fill
          /* Tres columnas desde `lg`, dos desde `sm`, una en móvil: cada
             tramo pide su ancho real para no descargar píxeles de más. */
          sizes="(min-width: 1280px) 384px, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw"
          className="object-cover transition-transform duration-[600ms] ease-ios group-hover:scale-[1.03]"
        />
        {/* Fundido corto en el borde superior: separa el chip de capacidad de
            las fotos con cielo claro sin apagar el resto de la imagen. */}
        <div
          aria-hidden="true"
          className="photo-scrim-chip pointer-events-none absolute inset-x-0 top-0 h-1/2"
        />
        <span className="glass absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold text-ink ring-1 ring-inset ring-white/40">
          <UsersIcon className="h-3.5 w-3.5" />
          {formatGuests(accommodation.capacity)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-[1.375rem] leading-tight tracking-[-0.025em] text-ink">
          {/* El enlace cubre toda la tarjeta (stretched link) */}
          <Link
            href={`/alojamientos/${accommodation.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {accommodation.name}
          </Link>
        </h3>

        {accommodation.short_description && (
          <p className="mt-2.5 flex-1 text-[0.9375rem] leading-relaxed text-ink-muted">
            {accommodation.short_description}
          </p>
        )}

        <div className="mt-6 flex items-end justify-between gap-4 border-t border-black/[0.07] pt-5">
          <div>
            <p className="text-[0.8125rem] font-medium text-ink-muted">Desde</p>
            <p className="mt-0.5 text-[1.5rem] font-semibold leading-none tracking-[-0.03em] text-forest-700">
              {formatCOP(from.amountCop)}
              <span className="ml-1.5 text-[0.8125rem] font-medium tracking-normal text-ink-muted">
                / noche
              </span>
            </p>
            {accommodation.price_note && (
              <p className="mt-1.5 text-[0.75rem] text-ink-muted">
                {accommodation.price_note}
              </p>
            )}
          </div>

          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-600/10 text-forest-700 transition-[background-color,color,transform] duration-200 ease-ios group-hover:bg-forest-600 group-hover:text-white">
            <ChevronRightIcon className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
