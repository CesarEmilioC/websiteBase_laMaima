import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccommodationCard } from "@/components/accommodation-card";
import { BookingWidget } from "@/components/booking/booking-widget";
import { Gallery } from "@/components/gallery";
import { ArrowRightIcon, CheckIcon, UsersIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { LeafField } from "@/components/leaf-field";
import { RateNotes } from "@/components/rate-notes";
import { SpecialPlans } from "@/components/special-plans";
import { WhatsAppButton } from "@/components/whatsapp-button";
import {
  coverImage,
  getAccommodationBySlug,
  getAccommodations,
  getContactInfo,
  getRateConfig,
  type Accommodation,
} from "@/lib/content";
import { formatCOP, formatGuests } from "@/lib/format";
import { dict } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";
import { breakfastLabel, lowestRate, rateNotes, tierRows } from "@/lib/pricing";
import {
  accommodationTails,
  breadcrumbList,
  composeDescription,
  lodgingId,
  pageMetadata,
} from "@/lib/seo";
import { absoluteUrl, SITE } from "@/lib/site";
import { accommodationMessage } from "@/lib/whatsapp";

/** Prerenderiza en el build una página por alojamiento VISIBLE. */
export async function accommodationParams() {
  const accommodations = await getAccommodations();
  return accommodations.map((accommodation) => ({ slug: accommodation.slug }));
}

/**
 * Migas de la ficha: las mismas que se pintan y las mismas que se marcan.
 */
function crumbsFor(accommodation: Accommodation, locale: Locale) {
  const t = dict(locale);
  return [
    { name: t.nav.home, path: localePath(locale, "/") },
    { name: t.nav.accommodations, path: localePath(locale, "/alojamientos") },
    {
      name: accommodation.name,
      path: localePath(locale, `/alojamientos/${accommodation.slug}`),
    },
  ];
}

/**
 * Tarifa "desde" publicada, ya formateada, o `null` cuando el alojamiento aún
 * no tiene tabla de tarifas (hoy Casa Uba). En ese caso ni la descripción ni
 * el JSON-LD prometen un precio.
 */
function publishedPrice(accommodation: Accommodation): string | null {
  if (accommodation.tiers.length === 0) return null;
  return formatCOP(
    lowestRate(accommodation.tiers, accommodation.price_per_night_cop).amountCop,
  );
}

export async function accommodationDetailMetadata(
  slug: string,
  locale: Locale,
): Promise<Metadata> {
  const accommodation = await getAccommodationBySlug(slug, locale);
  const t = dict(locale);

  if (!accommodation) {
    return { title: t.detail.notFoundTitle, robots: { index: false } };
  }

  const guests = formatGuests(accommodation.capacity, locale);
  const base =
    accommodation.short_description ??
    (locale === "en"
      ? `${accommodation.name}: a house for ${guests}, with a kitchenette and a private bathroom.`
      : `${accommodation.name}: alojamiento para ${guests} con cocineta y baño privado.`);

  /* La descripción se compone: el texto del panel más dónde está y desde
     cuánto sale. Ver `composeDescription()`. */
  const description = composeDescription(
    base,
    accommodationTails(publishedPrice(accommodation), locale),
  );

  const cover = coverImage(accommodation.gallery, accommodation.name);

  return pageMetadata({
    /* Título único y descriptivo: el nombre solo ("Casa Maima · La Maima")
       no dice ni para cuántos es ni dónde queda, que es lo que se busca. */
    title:
      locale === "en"
        ? `${accommodation.name}, a house for ${guests} in Dapa`
        : `${accommodation.name}, alojamiento para ${guests} en Dapa`,
    description,
    path: `/alojamientos/${accommodation.slug}`,
    /* SU foto de portada, no la genérica del sitio: es lo que se ve al
       compartir la ficha por WhatsApp, que es como se comparte aquí. */
    image: { url: cover.url, alt: cover.alt },
    socialTitle: `${accommodation.name} · La Maima`,
    locale,
  });
}

export async function AccommodationDetailPage({
  slug,
  locale,
}: {
  slug: string;
  locale: Locale;
}) {
  const accommodation = await getAccommodationBySlug(slug, locale);

  if (!accommodation) notFound();

  const [all, contact, rates] = await Promise.all([
    getAccommodations(locale),
    getContactInfo(),
    getRateConfig(accommodation, locale),
  ]);

  const t = dict(locale);
  const others = all
    .filter((item) => item.slug !== accommodation.slug)
    .slice(0, 3);
  const cover = coverImage(accommodation.gallery, accommodation.name);
  const message = accommodationMessage(accommodation.name, locale);
  const listHref = localePath(locale, "/alojamientos");

  // La tarifa "Desde" sale de la tabla real de precios; la columna
  // price_per_night_cop solo entra cuando la cabaña aún no tiene tabla.
  const from = lowestRate(accommodation.tiers, accommodation.price_per_night_cop);
  const breakfast = breakfastLabel(rates, locale);
  /* Las condiciones de la tarifa, ya en puntos y derivadas de los campos
     (no del párrafo que escribe el cliente). Ver `rateNotes()`. */
  const notes = rateNotes(rates, locale);

  // Chips de la cabecera: lo que un huésped quiere saber antes de bajar a
  // leer la descripción entera.
  const chips = [
    `${t.common.upTo} ${formatGuests(accommodation.capacity, locale)}`,
    breakfast,
    t.detail.checkIn,
    t.detail.petFriendly,
  ].filter((chip): chip is string => Boolean(chip));

  /* -------------------------------------------------------------------------
   * Datos estructurados de la ficha
   * -----------------------------------------------------------------------
   * Dos nodos y una miga de pan:
   *
   *   · `Accommodation` + `Product` en el MISMO nodo. `Accommodation` es lo
   *     que la ficha describe de verdad (una casa, con su ocupación y sus
   *     comodidades) pero, al ser un `Place`, no admite `offers`; `Product`
   *     sí, y es el tipo que Google entiende cuando hay un precio.
   *
   *   · La oferta lleva el precio MÁS BAJO publicado en la tabla por
   *     ocupación —el mismo "Desde" que se lee en pantalla— y se omite entera
   *     cuando el alojamiento todavía no tiene tabla.
   *
   *   · `containedInPlace` apunta por `@id` al `LodgingBusiness` que emite el
   *     armazón público DEL MISMO IDIOMA, y ese a su vez lista esta ficha en
   *     `containsPlace`: el grafo de cada versión queda cerrado en los dos
   *     sentidos y no se mezcla con el de la otra.
   * ---------------------------------------------------------------------- */
  const url = absoluteUrl(
    localePath(locale, `/alojamientos/${accommodation.slug}`),
  );
  const price = accommodation.tiers.length > 0 ? from.amountCop : null;

  const accommodationNode = {
    "@type": ["Accommodation", "Product"],
    "@id": `${url}#accommodation`,
    name: accommodation.name,
    description:
      accommodation.short_description ?? accommodation.description ?? undefined,
    url,
    /* Toda la galería, no solo la portada: son fotos propias del cliente y
       alimentan la búsqueda de imágenes. */
    image: accommodation.gallery.length
      ? accommodation.gallery.map((photo) => absoluteUrl(photo.url))
      : [absoluteUrl(cover.url)],
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: accommodation.capacity,
      unitCode: "C62",
    },
    petsAllowed: SITE.stay.petsAllowed,
    smokingAllowed: SITE.stay.smokingAllowed,
    amenityFeature: accommodation.amenities.map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
    containedInPlace: { "@id": lodgingId(locale) },
    ...(price !== null
      ? {
          offers: {
            "@type": "Offer",
            url,
            price,
            priceCurrency: "COP",
            availability: "https://schema.org/InStock",
            /* "Desde": el precio es por noche y corresponde a la ocupación
               más baja de la tabla. `UnitPriceSpecification` es la manera de
               decirlo sin que se lea como una tarifa cerrada. */
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price,
              priceCurrency: "COP",
              unitCode: "DAY",
              unitText: locale === "en" ? "night" : "noche",
              ...(from.guests !== null
                ? {
                    eligibleQuantity: {
                      "@type": "QuantitativeValue",
                      value: from.guests,
                      unitCode: "C62",
                      unitText: locale === "en" ? "guests" : "huéspedes",
                    },
                  }
                : {}),
            },
            seller: { "@id": lodgingId(locale) },
          },
        }
      : {}),
  };

  return (
    <>
      {/* Banda de encabezado ------------------------------------------------ */}
      <section className="bg-shell pb-10 pt-28 sm:pb-12 sm:pt-32 lg:pt-36">
        <div className="container-page">
          <nav aria-label={t.nav.breadcrumb}>
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.8125rem] text-ink-muted">
              <li>
                <Link
                  href={localePath(locale, "/")}
                  className="transition-colors duration-200 hover:text-brand-600"
                >
                  {t.nav.home}
                </Link>
              </li>
              <li aria-hidden="true" className="text-ink-muted/50">
                ›
              </li>
              <li>
                <Link
                  href={listHref}
                  className="transition-colors duration-200 hover:text-brand-600"
                >
                  {t.nav.accommodations}
                </Link>
              </li>
              <li aria-hidden="true" className="text-ink-muted/50">
                ›
              </li>
              <li className="text-ink" aria-current="page">
                {accommodation.name}
              </li>
            </ol>
          </nav>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="tracking-display text-[2.375rem] leading-[1.05] text-ink sm:text-5xl lg:text-[3.5rem]">
                {accommodation.name}
              </h1>
              <ul className="mt-4 flex flex-wrap gap-2">
                {chips.map((chip, index) => (
                  <li
                    key={chip}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-600/10 px-3.5 py-1.5 text-[0.8125rem] font-semibold text-brand-700 ring-1 ring-inset ring-brand-600/15"
                  >
                    {index === 0 && <UsersIcon className="h-4 w-4" />}
                    {chip}
                  </li>
                ))}
              </ul>
              {/* Fuera del `<ul>` a propósito: dentro se leería como una
                  pastilla más y las pastillas son datos, no enlaces. */}
              <p className="mt-3 text-[0.8125rem] text-ink-muted">
                <Link
                  href={localePath(locale, "/legal/cancelacion")}
                  className="underline-offset-4 transition-colors duration-200 hover:text-brand-700 hover:underline"
                >
                  {t.detail.cancellationLink}
                </Link>
              </p>
            </div>

            <div className="sm:text-right">
              <p className="eyebrow text-ink-muted">{t.common.from}</p>
              <p className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.02em] text-brand-700">
                {formatCOP(from.amountCop)}
                <span className="ml-1.5 text-[0.875rem] font-medium tracking-normal text-ink-muted">
                  {t.common.copPerNight}
                </span>
              </p>
              {accommodation.price_note && (
                <p className="mt-2 text-[0.8125rem] text-ink-muted">
                  {accommodation.price_note}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Galería ------------------------------------------------------------ */}
      <section className="bg-shell">
        <div className="container-page">
          <Gallery
            images={accommodation.gallery}
            name={accommodation.name}
            locale={locale}
          />
        </div>
      </section>

      {/* Descripción + panel de reserva ------------------------------------- */}
      <section className="section-y bg-shell">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7" data-reveal>
              <h2 className="text-[1.75rem] text-ink sm:text-[2rem]">
                {t.detail.about(accommodation.name)}
              </h2>
              {accommodation.description && (
                <p className="mt-4 whitespace-pre-line text-[1.0625rem] leading-relaxed text-ink-muted">
                  {accommodation.description}
                </p>
              )}

              {accommodation.amenities.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-[1.5rem] text-ink">{t.detail.included}</h3>
                  {/* Lista estilo iOS: icono + texto + separador hairline */}
                  <ul className="mt-5 overflow-hidden rounded-panel bg-sand-soft sm:grid sm:grid-cols-2">
                    {accommodation.amenities.map((amenity, index) => (
                      <li
                        key={amenity}
                        className={`flex items-center gap-3.5 px-5 py-3.5 text-[0.9375rem] text-ink-soft ${
                          index > 0 ? "border-t border-ink/[0.07]" : ""
                        } ${
                          index % 2 === 1
                            ? "sm:border-l sm:border-l-ink/[0.08]"
                            : ""
                        } ${index === 1 ? "sm:border-t-0" : ""}`}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                          <CheckIcon className="h-3.5 w-3.5" />
                        </span>
                        {amenity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Panel lateral */}
            <div className="lg:col-span-5">
              <div className="rounded-panel bg-white p-7 shadow-panel ring-1 ring-inset ring-ink/[0.06] lg:sticky lg:top-28">
                <p className="eyebrow text-ink-muted">{t.detail.rateFrom}</p>
                <p className="mt-2 text-[2.25rem] font-semibold leading-none tracking-[-0.02em] text-brand-700">
                  {formatCOP(from.amountCop)}
                  <span className="ml-1.5 text-[0.875rem] font-medium tracking-normal text-ink-muted">
                    {t.common.copPerNight}
                  </span>
                </p>
                {accommodation.price_note && (
                  <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-muted">
                    {accommodation.price_note}
                  </p>
                )}

                {/* Tabla de precios por ocupación: es LA pregunta que hace todo
                    el que mira una cabaña, y aparece aquí sin tener que bajar
                    al calendario. */}
                {accommodation.tiers.length > 0 && (
                  <dl className="mt-6 overflow-hidden rounded-card bg-sand-soft text-[0.9375rem]">
                    {tierRows(accommodation.tiers, locale).map((row, index) => (
                      <div
                        key={row.key}
                        className={`flex items-center justify-between gap-4 px-4 py-3 ${
                          index > 0 ? "border-t border-ink/[0.07]" : ""
                        }`}
                      >
                        <dt className="text-ink-muted">{row.label}</dt>
                        <dd className="font-semibold tabular-nums text-ink">
                          {formatCOP(row.price)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}

                {/* Condiciones de la tarifa, un dato por línea, derivadas de
                    los CAMPOS y no de la prosa. Ver `rateNotes()`. */}
                {notes.length > 0 && (
                  <div className="mt-5 border-t border-ink/[0.07] pt-5">
                    <p className="eyebrow text-ink-muted">
                      {t.detail.rateConditions}
                    </p>
                    <RateNotes notes={notes} className="mt-3.5" />
                  </div>
                )}

                {/* Paquetes vigentes o próximos que el cliente crea en el panel
                    (/admin/tarifas). Si no hay ninguno, no se pinta nada. */}
                <SpecialPlans plans={rates.ratePlans} locale={locale} />

                <a
                  href="#reservar"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-4 text-[1.0625rem] font-semibold tracking-[-0.01em] text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-700 active:scale-[0.98]"
                >
                  {t.detail.book}
                  <ArrowRightIcon className="h-[1.05rem] w-[1.05rem]" />
                </a>

                <WhatsAppButton
                  message={message}
                  label={t.common.whatsappAsk}
                  ariaLabel={t.detail.askAbout(accommodation.name)}
                  variant="soft"
                  size="md"
                  className="mt-3 w-full py-3.5"
                />

                <p className="mt-5 text-center text-[0.8125rem] leading-relaxed text-ink-muted">
                  {t.detail.replyBy(contact.phoneDisplay)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Motor de reservas --------------------------------------------------- */}
      {/* La disponibilidad la carga el widget en el navegador: la página es
          estática (SSG + ISR de una hora) y el calendario tiene que ser fresco. */}
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
          <div className="text-center">
            <p className="eyebrow text-brand-400">{t.detail.bookingEyebrow}</p>
            <h2
              id="reservar-title"
              className="tracking-editorial mt-3 text-[2.125rem] leading-[1.08] text-white sm:text-[2.75rem]"
            >
              {t.detail.bookingTitle(accommodation.name)}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-sand-soft/70">
              {t.detail.bookingLead}
            </p>
          </div>

          <div className="mt-10">
            <BookingWidget
              slug={accommodation.slug}
              name={accommodation.name}
              locale={locale}
              capacity={accommodation.capacity}
              rates={rates}
              priceNote={accommodation.price_note}
              whatsapp={contact.whatsapp}
              phoneDisplay={contact.phoneDisplay}
              phoneHref={contact.phoneHref}
            />
          </div>
        </div>
      </section>

      {/* Otros alojamientos -------------------------------------------------- */}
      {others.length > 0 && (
        <section className="section-y bg-sand-soft" aria-labelledby="otros-title">
          <div className="container-page">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2
                id="otros-title"
                className="tracking-editorial text-[2rem] text-ink sm:text-[2.375rem]"
              >
                {t.detail.others}
              </h2>
              <Link
                href={listHref}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[0.9375rem] font-semibold text-brand-700 shadow-card transition-[background-color,color,transform] duration-200 ease-ios hover:bg-brand-600 hover:text-white active:scale-[0.98]"
              >
                {/* Lleva al listado completo, así que cuenta TODOS los
                    visibles (no solo los tres que se ven en esta fila). */}
                {t.detail.othersCta(all.length)}
                <ArrowRightIcon className="h-[1.05rem] w-[1.05rem]" />
              </Link>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-7">
              {others.map((item) => (
                <AccommodationCard
                  key={item.id}
                  accommodation={item}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <JsonLd
        graph={[
          accommodationNode,
          breadcrumbList(crumbsFor(accommodation, locale)),
        ]}
      />
    </>
  );
}
