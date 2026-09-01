import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon, CheckIcon, UsersIcon } from "@/components/icons";
import { bookingPath } from "@/lib/booking/select";
import { coverImage, type Accommodation } from "@/lib/content";
import { formatCOP, formatGuests } from "@/lib/format";
import { dict } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";
import { lowestRate } from "@/lib/pricing";

/**
 * Las dos formas de elegir alojamiento dentro de `/reservar`.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ SON DOS COMPONENTES Y NO UNO CON UNA BANDERA
 * ---------------------------------------------------------------------------
 * Antes y después de elegir, la pregunta que responde la pantalla es distinta:
 *
 *   · `AccommodationPicker` — todavía no hay nada elegido. La pregunta es
 *     "¿cuál me sirve?", así que cada casa necesita su fotografía, su aforo y
 *     su tarifa: es una comparación, y una comparación se hace mirando.
 *   · `AccommodationSwitcher` — ya hay una elegida y debajo está su
 *     calendario. La pregunta pasa a ser "¿y si mejor la otra?", que es un
 *     cambio de opinión, no una comparación: ahí seis fotografías grandes
 *     empujarían el calendario fuera de la pantalla justo cuando es lo único
 *     que importa. Una fila de miniaturas con el nombre ocupa 72 px y hace el
 *     mismo trabajo.
 *
 * Las dos son componentes de SERVIDOR y navegan por enlace, sin estado de
 * cliente: la elección vive en la dirección (`?cabana=<slug>`), así que se
 * puede compartir por WhatsApp, guardar en favoritos y volver atrás con el
 * botón del navegador. Un selector con `useState` habría perdido las tres
 * cosas a cambio de nada.
 *
 * Los dos se pintan sobre el azul marino de la sección de reservas: las
 * superficies son blancas y el texto secundario, arena.
 */

type PickerProps = {
  accommodations: Accommodation[];
  locale: Locale;
};

/* ---------------------------------------------------------------------------
 * Selector: sin alojamiento elegido
 * ------------------------------------------------------------------------- */

export function AccommodationPicker({ accommodations, locale }: PickerProps) {
  const t = dict(locale);

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {accommodations.map((accommodation) => {
        const cover = coverImage(
          accommodation.gallery,
          t.gallery.fallbackAlt(accommodation.name),
        );
        const from = lowestRate(
          accommodation.tiers,
          accommodation.price_per_night_cop,
        );

        return (
          <li key={accommodation.id} data-reveal>
            {/* La tarjeta ENTERA es el enlace. Aquí no hay dos destinos que
                repartir —esta pantalla sirve para una sola cosa—, así que un
                `<Link>` envolviendo todo da el objetivo táctil más grande
                posible y evita la trampa clásica de la tarjeta con botón: dar
                al 90 % de su superficie y que no pase nada. */}
            <Link
              href={localePath(locale, bookingPath(accommodation.slug))}
              aria-label={t.bookingHub.chooseAria(accommodation.name)}
              className="group flex h-full flex-col overflow-hidden rounded-card bg-white shadow-card outline-none ring-brand-300 ring-offset-2 ring-offset-navy transition-[box-shadow,transform] duration-300 ease-ios hover:-translate-y-0.5 hover:shadow-lift focus-visible:ring-2 active:scale-[0.995]"
            >
              {/* 16/10 y no 4/3: aquí caben hasta seis tarjetas en pantalla y
                  la fotografía es para reconocer la casa, no para admirarla
                  (para eso está su ficha). Un recorte más apaisado deja las
                  tres filas de una rejilla dentro del alto de la ventana. */}
              <div className="relative aspect-[16/10] overflow-hidden bg-brand-100">
                <Image
                  src={cover.url}
                  alt={cover.alt}
                  fill
                  sizes="(min-width: 1024px) 380px, (min-width: 640px) 46vw, 100vw"
                  quality={68}
                  className="object-cover transition-transform duration-[600ms] ease-ios group-hover:scale-[1.03]"
                />
                <div
                  aria-hidden="true"
                  className="photo-scrim-chip pointer-events-none absolute inset-x-0 top-0 h-1/2"
                />
                <span className="glass eyebrow eyebrow-chip absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-ink ring-1 ring-inset ring-white/50">
                  <UsersIcon className="h-3.5 w-3.5" />
                  {formatGuests(accommodation.capacity, locale)}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3 className="text-[1.25rem] leading-tight text-ink">
                  {accommodation.name}
                </h3>

                <p className="mt-2 flex items-baseline gap-1.5">
                  <span className="eyebrow text-ink-muted">{t.common.from}</span>
                  <span className="text-[1.25rem] font-semibold leading-none tracking-[-0.02em] text-brand-700">
                    {formatCOP(from.amountCop)}
                  </span>
                  <span className="text-[0.8125rem] font-medium text-ink-muted">
                    {t.common.perNight}
                  </span>
                </p>

                {/* Pastilla y no botón: dentro de un enlace, un `<button>`
                    sería HTML inválido. Se pinta como acción porque lo es —el
                    enlace que la envuelve—, y el `group-hover` la enciende
                    cuando el puntero está en cualquier punto de la tarjeta. */}
                <span className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600/10 px-5 py-3 text-[0.9375rem] font-semibold text-brand-700 transition-[background-color,color] duration-200 ease-ios group-hover:bg-brand-600 group-hover:text-white">
                  {t.bookingHub.chooseCta}
                  <ArrowRightIcon className="h-[0.95rem] w-[0.95rem] shrink-0" />
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------------------------------------------------------------------
 * Conmutador: con alojamiento elegido
 * ------------------------------------------------------------------------- */

type SwitcherProps = PickerProps & {
  /** Slug del alojamiento que se está reservando ahora mismo. */
  current: string;
};

export function AccommodationSwitcher({
  accommodations,
  locale,
  current,
}: SwitcherProps) {
  const t = dict(locale);

  return (
    <ul
      aria-label={t.bookingHub.switcherLabel}
      /* Se desplaza en horizontal en móvil, donde cinco pastillas no caben en
         390 px. `-mx-5 px-5` hace que el carril sangre hasta el borde de la
         pantalla: sin eso, la última pastilla se corta contra el margen del
         contenedor y no se ve que hay más a la derecha. */
      className="-mx-5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {accommodations.map((accommodation) => {
        const active = accommodation.slug === current;
        const cover = coverImage(
          accommodation.gallery,
          t.gallery.fallbackAlt(accommodation.name),
        );

        return (
          <li key={accommodation.id} className="shrink-0 snap-start">
            <Link
              href={localePath(locale, bookingPath(accommodation.slug))}
              aria-current={active ? "true" : undefined}
              /* El nombre accesible del activo es solo el nombre de la casa
                 (el texto visible); el de los demás dice qué pasa al pulsar,
                 porque un lector de pantalla que anuncia cinco enlaces con
                 solo el nombre no dice cuál es el destino. */
              aria-label={
                active ? undefined : t.bookingHub.switchTo(accommodation.name)
              }
              className={`flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-[0.875rem] font-semibold outline-none ring-brand-300 ring-offset-2 ring-offset-navy transition-[background-color,color] duration-200 ease-ios focus-visible:ring-2 ${
                active
                  ? "bg-white text-brand-700 shadow-pill"
                  : "bg-white/10 text-white/80 ring-1 ring-inset ring-white/15 hover:bg-white/20 hover:text-white"
              }`}
            >
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-brand-100">
                <Image
                  src={cover.url}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="36px"
                  quality={68}
                  className="object-cover"
                />
              </span>
              <span className="whitespace-nowrap">{accommodation.name}</span>
              {/* Los iconos de este proyecto ya son `aria-hidden`: la marca es
                  redundancia visual del `aria-current`, no información nueva. */}
              {active && <CheckIcon className="h-4 w-4 shrink-0 text-brand-600" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
