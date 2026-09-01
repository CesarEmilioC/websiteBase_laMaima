import Image from "next/image";
import Link from "next/link";

import { UsersIcon } from "./icons";
import { bookingPath } from "@/lib/booking/select";
import { coverImage, type Accommodation } from "@/lib/content";
import { formatCOP, formatGuests } from "@/lib/format";
import { dict } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";
import { lowestRate } from "@/lib/pricing";

type Props = {
  accommodation: Accommodation;
  locale: Locale;
};

/**
 * Tarjeta de alojamiento: foto rectangular arriba, metadatos limpios abajo.
 *
 * Vive en el LISTADO (`/alojamientos`) y en "otros alojamientos" de la ficha.
 * La portada ya no la usa: allí las cabañas se presentan en zigzag (ver
 * `home/accommodation-row.tsx`). Se conservan las dos piezas porque resuelven
 * problemas distintos —el zigzag las cuenta en un recorrido, la tarjeta las
 * compara en una rejilla— y mezclarlas empeoraría las dos.
 *
 * DOS ACCIONES, como el zigzag: la tarjeta entera abre la ficha y el botón de
 * abajo a la derecha va a la página de reservas con esta casa preseleccionada.
 * Ver la nota junto al botón para el detalle del "stretched link".
 *
 * La foto va SIEMPRE en carga diferida: en las dos páginas donde aparece esta
 * tarjeta queda por debajo del pliegue, y marcarla como prioritaria le robaba
 * ancho de banda a la imagen que sí es el LCP (la banda de encabezado),
 * empeorando la métrica.
 */
export function AccommodationCard({ accommodation, locale }: Props) {
  const t = dict(locale);
  const cover = coverImage(
    accommodation.gallery,
    t.gallery.fallbackAlt(accommodation.name),
  );

  // "Desde" = el tramo más barato de la tabla real de precios. Se calcula aquí
  // en vez de leer la columna para que no pueda quedarse atrás si el cliente
  // edita un precio desde el panel.
  const from = lowestRate(accommodation.tiers, accommodation.price_per_night_cop);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card bg-white shadow-card transition-[box-shadow,transform] duration-300 ease-ios hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-100">
        <Image
          src={cover.url}
          alt={cover.alt}
          fill
          /* Tres columnas desde `lg`, dos desde `sm`, una en móvil: cada
             tramo pide su ancho real para no descargar píxeles de más. */
          sizes="(min-width: 1280px) 384px, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw"
          quality={68}
          /* Prioridad baja explícita: en `/alojamientos` todas las tarjetas
             caen dentro del margen con el que Chrome adelanta las imágenes
             diferidas y salían a la red junto con la banda de encabezado, que
             es la que marca el LCP. */
          fetchPriority="low"
          className="object-cover transition-transform duration-[600ms] ease-ios group-hover:scale-[1.03]"
        />
        {/* Fundido corto en el borde superior: separa el chip de capacidad de
            las fotos con cielo claro sin apagar el resto de la imagen. */}
        <div
          aria-hidden="true"
          className="photo-scrim-chip pointer-events-none absolute inset-x-0 top-0 h-1/2"
        />
        <span className="glass eyebrow eyebrow-chip absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-ink ring-1 ring-inset ring-white/50">
          <UsersIcon className="h-3.5 w-3.5" />
          {formatGuests(accommodation.capacity, locale)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-[1.375rem] leading-tight text-ink">
          {/* El enlace cubre toda la tarjeta (stretched link) */}
          <Link
            href={localePath(locale, `/alojamientos/${accommodation.slug}`)}
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

        <div className="mt-6 flex items-end justify-between gap-4 border-t border-ink/[0.08] pt-5">
          <div>
            <p className="eyebrow text-ink-muted">{t.common.from}</p>
            <p className="mt-1.5 text-[1.5rem] font-semibold leading-none tracking-[-0.02em] text-brand-700">
              {formatCOP(from.amountCop)}
              <span className="ml-1.5 text-[0.8125rem] font-medium tracking-normal text-ink-muted">
                {t.common.perNight}
              </span>
            </p>
            {accommodation.price_note && (
              <p className="mt-1.5 text-[0.75rem] text-ink-muted">
                {accommodation.price_note}
              </p>
            )}
          </div>

          {/* RESERVAR: la segunda acción de la tarjeta.
              --------------------------------------------------------------
              Aquí había una pastilla con una flecha, que era decoración: solo
              repetía el destino del enlace que ya cubre la tarjeta entera. En
              su lugar va el botón que faltaba, con su propio destino —la
              página de reservas con ESTA casa elegida—, de modo que desde el
              listado se puede ir al calendario sin pasar por la ficha.

              `relative z-10` es imprescindible: el título de arriba es un
              "stretched link" (`after:absolute after:inset-0`) que tapa toda
              la tarjeta, y sin elevar este enlace por encima de esa capa, el
              botón sería invisible al ratón. Al no estar ANIDADO dentro del
              otro enlace, el HTML sigue siendo válido y el teclado recorre los
              dos por separado. */}
          <Link
            href={localePath(locale, bookingPath(accommodation.slug))}
            className="relative z-10 inline-flex shrink-0 items-center justify-center rounded-full bg-brand-600/10 px-5 py-2.5 text-[0.9375rem] font-semibold text-brand-700 transition-[background-color,color,transform] duration-200 ease-ios hover:bg-brand-600 hover:text-white active:scale-[0.97]"
          >
            {t.nav.book}
          </Link>
        </div>
      </div>
    </article>
  );
}
