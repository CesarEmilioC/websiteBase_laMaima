import type { Metadata } from "next";
import Link from "next/link";

import {
  AccommodationPicker,
  AccommodationSwitcher,
} from "@/components/booking/accommodation-picker";
import { BookingWidget } from "@/components/booking/booking-widget";
import { AlertIcon, ArrowRightIcon, UsersIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { LeafField } from "@/components/leaf-field";
import { PageHero } from "@/components/page-hero";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { readStayParam, selectStay } from "@/lib/booking/select";
import {
  getAccommodations,
  getContactInfo,
  getListingHeroes,
  getRateConfig,
} from "@/lib/content";
import { formatGuests } from "@/lib/format";
import { dict } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";
import { breadcrumbList, pageMetadata } from "@/lib/seo";
import { generalMessage } from "@/lib/whatsapp";

/**
 * `/reservar` — LA PUERTA DEL MOTOR DE RESERVAS.
 *
 * ===========================================================================
 * QUÉ PROBLEMA RESUELVE
 * ===========================================================================
 * El motor de reservas existe desde hace tiempo, pero solo vivía dentro de la
 * ficha de cada casa. Para llegar a él había que: pulsar "Reservar" en el
 * menú, aterrizar en el listado, entrar a una ficha y bajar hasta el
 * calendario. Cuatro pasos, y el primero ya mentía: el botón decía "Reservar"
 * y llevaba a un catálogo.
 *
 * Esta página convierte ese recorrido en lo que siempre debió ser: una
 * pregunta ("¿cuál?") y el calendario. Y admite las dos maneras de llegar:
 *
 *   · `/reservar` — sin nada elegido. Se enseña el SELECTOR: las casas
 *     visibles con foto, aforo y tarifa "Desde". Es el camino de quien pulsa
 *     el botón del menú.
 *   · `/reservar?cabana=<slug>` — con la casa ya elegida. El calendario está
 *     listo, y encima queda una fila de miniaturas para cambiar de opinión sin
 *     volver atrás. Es el camino de los botones "Reservar" de cada
 *     alojamiento (zigzag de la portada, tarjetas del listado) y el de un
 *     enlace compartido por WhatsApp.
 *
 * ===========================================================================
 * NO SE DUPLICA NADA
 * ===========================================================================
 * El calendario, la cotización, el formulario del huésped y el registro de la
 * solicitud son EXACTAMENTE los mismos de la ficha: se monta el `BookingWidget`
 * ya existente con las mismas props. Esta página no sabe reservar; sabe elegir
 * a quién preguntarle. Si mañana cambia el motor, cambia en un sitio.
 *
 * ===========================================================================
 * INDEXABLE, Y POR QUÉ
 * ===========================================================================
 * Se decidió que SÍ se indexa, con `title` "Reservar":
 *
 *   · "reservar la maima", "reservar cabaña dapa" son búsquedas con intención
 *     de compra, y hasta hoy no había ninguna página del sitio que las
 *     respondiera: caían en el listado, que responde a "qué hay".
 *   · Tiene contenido propio y estable (las casas publicadas, sus tarifas
 *     "Desde", las condiciones de la reserva), no es una pantalla de tránsito.
 *   · No genera duplicados: `pageMetadata()` declara la canónica en
 *     `/reservar` SIEMPRE, así que las variantes con `?cabana=` consolidan en
 *     ella, y ninguna de esas variantes entra en el sitemap.
 *
 * Un `noindex` de "página de embudo" habría tirado la única página del sitio
 * que responde a la búsqueda que más vale.
 */

/** Migas visibles y marcado estructurado salen de esta misma lista. */
function crumbs(locale: Locale) {
  const t = dict(locale);
  return [
    { name: t.nav.home, path: localePath(locale, "/") },
    { name: t.bookingHub.metaTitle, path: localePath(locale, "/reservar") },
  ];
}

export async function bookingHubMetadata(locale: Locale): Promise<Metadata> {
  const [{ alojamientos: hero }, accommodations] = await Promise.all([
    getListingHeroes(locale),
    getAccommodations(locale),
  ]);
  const t = dict(locale);

  return pageMetadata({
    title: t.bookingHub.metaTitle,
    /* La descripción nombra cuántas casas hay, y ese número sale de la base:
       con Casa Uba oculta dice "cinco" sin que nadie toque nada. */
    description: t.bookingHub.metaDescription(accommodations.length),
    /* SIEMPRE `/reservar`, también cuando la dirección trae `?cabana=`: las
       variantes son la misma página con una casa preseleccionada, no páginas
       distintas. Es lo que evita cinco duplicados en el índice. */
    path: "/reservar",
    image: { url: hero.image, alt: hero.image_alt },
    socialTitle: `${t.bookingHub.metaTitle} · La Maima`,
    socialDescription: t.bookingHub.socialDescription,
    locale,
  });
}

export async function BookingHubPage({
  locale,
  cabana,
}: {
  locale: Locale;
  /** Valor crudo del parámetro de la dirección, tal como llega de Next. */
  cabana: string | string[] | undefined;
}) {
  const [accommodations, { alojamientos: hero }, contact] = await Promise.all([
    getAccommodations(locale),
    getListingHeroes(locale),
    getContactInfo(),
  ]);

  const t = dict(locale);
  const list = crumbs(locale);

  /* La lista ya viene filtrada por `visible = true`, así que un alojamiento
     oculto no se puede preseleccionar ni por dirección: cae al selector con
     su aviso. Ver `@/lib/booking/select`. */
  const { stay, unavailable } = selectStay(
    accommodations,
    readStayParam(cabana),
  );

  /* Las tarifas solo se piden para la casa elegida: traerlas de las cinco para
     enseñar una sería cuatro consultas de más en cada carga del selector. */
  const rates = stay ? await getRateConfig(stay, locale) : null;

  return (
    <>
      <PageHero
        locale={locale}
        eyebrow={t.bookingHub.heroEyebrow}
        title={t.bookingHub.heroTitle}
        titleAccent={t.bookingHub.heroTitleAccent}
        description={t.bookingHub.heroDescription}
        image={hero.image}
        imageAlt={hero.image_alt}
        breadcrumbs={list.map((crumb) => ({
          href: crumb.path,
          label: crumb.name,
        }))}
      />

      {/* La sala de reservas: el mismo azul marino y la misma capa de hojas
          que la sección `#reservar` de la ficha, para que llegar aquí desde un
          botón "Reservar" se sienta como el mismo sitio. */}
      <section
        id="reservar"
        className="section-y relative isolate overflow-hidden bg-navy"
        aria-labelledby="reservar-title"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(80%_100%_at_50%_0%,rgb(52_95_198/0.3),transparent_70%)]"
        />
        <LeafField tone="light" className="-z-10" />

        <div className="container-page max-w-6xl">
          {accommodations.length === 0 ? (
            /* Sin nada publicado no se puede reservar, pero tampoco se deja al
               visitante sin salida: el mismo bloque de "estamos actualizando"
               del listado, con el atajo al chat. */
            <div className="mx-auto max-w-2xl rounded-panel bg-white p-8 text-center shadow-panel sm:p-10">
              <h2
                id="reservar-title"
                className="tracking-editorial text-[1.5rem] text-ink"
              >
                {t.common.updatingSection}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink-muted">
                {t.accommodations.emptyHelp}
              </p>
              <div className="mt-6 flex justify-center">
                <WhatsAppButton
                  message={generalMessage(locale)}
                  label={t.common.whatsapp}
                />
              </div>
            </div>
          ) : stay && rates ? (
            /* ---------------------------------------------------------------
             * Con alojamiento elegido
             * ------------------------------------------------------------- */
            <>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="eyebrow text-brand-400">
                    {t.bookingHub.selectedEyebrow}
                  </p>
                  <h2
                    id="reservar-title"
                    className="tracking-editorial mt-3 text-[2.125rem] leading-[1.08] text-white sm:text-[2.75rem]"
                  >
                    {stay.name}
                  </h2>
                  <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.9375rem] text-sand-soft/70">
                    <span className="inline-flex items-center gap-2">
                      <UsersIcon className="h-4 w-4" />
                      {t.common.upTo} {formatGuests(stay.capacity, locale)}
                    </span>
                    {/* La ficha completa sigue a un toque: aquí solo está el
                        calendario, y quien dude de la casa necesita las fotos,
                        la descripción y la tabla de tarifas enteras. */}
                    <Link
                      href={localePath(
                        locale,
                        `/alojamientos/${stay.slug}`,
                      )}
                      aria-label={t.bookingHub.seeDetailsAria(stay.name)}
                      className="inline-flex items-center gap-1.5 font-semibold text-brand-300 underline-offset-4 transition-colors duration-200 hover:text-white hover:underline"
                    >
                      {t.common.seeDetails}
                      <ArrowRightIcon className="h-[0.95rem] w-[0.95rem]" />
                    </Link>
                  </p>
                </div>

                {/* "Cambiar de alojamiento" es un enlace a `/reservar` a
                    secas: vuelve al selector limpiando el parámetro. Va
                    visible y arriba, no escondido bajo el calendario, porque
                    equivocarse de casa es lo más probable que pase en esta
                    pantalla. */}
                <Link
                  href={localePath(locale, "/reservar")}
                  className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-white/10 px-5 py-3 text-[0.9375rem] font-semibold text-white ring-1 ring-inset ring-white/20 transition-[background-color,transform] duration-200 ease-ios hover:bg-white/20 active:scale-[0.98] lg:self-auto"
                >
                  {t.bookingHub.change}
                </Link>
              </div>

              {accommodations.length > 1 && (
                <div className="mt-7">
                  <AccommodationSwitcher
                    accommodations={accommodations}
                    locale={locale}
                    current={stay.slug}
                  />
                </div>
              )}

              <div className="mt-8">
                {/* EL MISMO widget de la ficha, con las mismas props. La `key`
                    es el slug: al cambiar de casa, React monta una instancia
                    nueva en vez de reutilizar la anterior, y así no quedan
                    fechas de la cabaña anterior seleccionadas sobre un
                    calendario que ya es de otra. */}
                <BookingWidget
                  key={stay.slug}
                  slug={stay.slug}
                  name={stay.name}
                  locale={locale}
                  capacity={stay.capacity}
                  rates={rates}
                  priceNote={stay.price_note}
                  whatsapp={contact.whatsapp}
                  phoneDisplay={contact.phoneDisplay}
                  phoneHref={contact.phoneHref}
                />
              </div>
            </>
          ) : (
            /* ---------------------------------------------------------------
             * Sin alojamiento elegido: el selector
             * ------------------------------------------------------------- */
            <>
              {unavailable && (
                /* Se pidió una casa que ya no se publica (Casa Uba, hoy). No
                   es un 404 —la página de reservas existe y funciona—, así que
                   se explica y se sigue: el visitante venía a reservar. */
                <p
                  role="status"
                  className="mx-auto mb-8 flex max-w-2xl items-start gap-2.5 rounded-card bg-white/10 px-4 py-3 text-[0.9375rem] leading-relaxed text-white ring-1 ring-inset ring-white/20"
                >
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  {t.bookingHub.unknown}
                </p>
              )}

              <div className="mx-auto max-w-2xl text-center">
                <p className="eyebrow text-brand-400">
                  {t.bookingHub.chooseEyebrow}
                </p>
                <h2
                  id="reservar-title"
                  className="tracking-editorial mt-3 text-[2.125rem] leading-[1.08] text-white sm:text-[2.75rem]"
                >
                  {t.bookingHub.chooseTitle(accommodations.length)}
                </h2>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-sand-soft/70">
                  {t.bookingHub.chooseLead}
                </p>
              </div>

              <div className="mt-10 lg:mt-12">
                <AccommodationPicker
                  accommodations={accommodations}
                  locale={locale}
                />
              </div>
            </>
          )}
        </div>
      </section>

      <JsonLd graph={[breadcrumbList(list)]} />
    </>
  );
}
