import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccommodationCard } from "@/components/accommodation-card";
import { BookingWidget } from "@/components/booking/booking-widget";
import { Gallery } from "@/components/gallery";
import { ArrowRightIcon, CheckIcon, UsersIcon } from "@/components/icons";
import { LeafField } from "@/components/leaf-field";
import { SpecialPlans } from "@/components/special-plans";
import { WhatsAppButton } from "@/components/whatsapp-button";
import {
  coverImage,
  getAccommodationBySlug,
  getAccommodations,
  getContactInfo,
  getRateConfig,
} from "@/lib/content";
import { formatCOP, formatGuests } from "@/lib/format";
import {
  breakfastLabel,
  lowestRate,
  minStaySummary,
  tierRows,
} from "@/lib/pricing";
import { absoluteUrl, SITE } from "@/lib/site";
import { accommodationMessage } from "@/lib/whatsapp";

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

/** Prerenderiza las seis páginas de detalle en el build. */
export async function generateStaticParams() {
  const accommodations = await getAccommodations();
  return accommodations.map((accommodation) => ({ slug: accommodation.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const accommodation = await getAccommodationBySlug(slug);

  if (!accommodation) {
    return { title: "Alojamiento no encontrado" };
  }

  const description =
    accommodation.short_description ??
    `${accommodation.name} en La Maima: alojamiento para ${formatGuests(accommodation.capacity)} con cocineta y baño privado, en la reserva natural de Dapa (Yumbo).`;

  const cover = coverImage(accommodation.gallery, accommodation.name);

  return {
    title: accommodation.name,
    description,
    alternates: { canonical: `/alojamientos/${accommodation.slug}` },
    openGraph: {
      title: `${accommodation.name} · La Maima`,
      description,
      url: `/alojamientos/${accommodation.slug}`,
      images: [{ url: cover.url, alt: cover.alt }],
    },
  };
}

export default async function AccommodationDetailPage({ params }: Props) {
  const { slug } = await params;
  const accommodation = await getAccommodationBySlug(slug);

  if (!accommodation) notFound();

  const [all, contact, rates] = await Promise.all([
    getAccommodations(),
    getContactInfo(),
    getRateConfig(accommodation),
  ]);
  const others = all.filter((item) => item.slug !== accommodation.slug).slice(0, 3);
  const cover = coverImage(accommodation.gallery, accommodation.name);
  const message = accommodationMessage(accommodation.name);

  // La tarifa "Desde" sale de la tabla real de precios; la columna
  // price_per_night_cop solo entra cuando la cabaña aún no tiene tabla.
  const from = lowestRate(accommodation.tiers, accommodation.price_per_night_cop);
  const breakfast = breakfastLabel(rates);
  const minStays = minStaySummary(rates.minStayRules);

  // Chips de la cabecera: lo que un huésped quiere saber antes de bajar a
  // leer la descripción entera.
  const chips = [
    `Hasta ${formatGuests(accommodation.capacity)}`,
    breakfast,
    "Check-in 3:00 p. m.",
    "Pet friendly",
  ].filter((chip): chip is string => Boolean(chip));

  const roomJsonLd = {
    "@context": "https://schema.org",
    "@type": "HotelRoom",
    name: accommodation.name,
    description: accommodation.short_description ?? accommodation.description,
    url: `${SITE.url}/alojamientos/${accommodation.slug}`,
    image: absoluteUrl(cover.url),
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: accommodation.capacity,
      unitCode: "C62",
    },
    amenityFeature: accommodation.amenities.map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
    containedInPlace: {
      "@type": "LodgingBusiness",
      "@id": `${SITE.url}/#lodging`,
      name: SITE.legalName,
    },
  };

  return (
    <>
      {/* Banda de encabezado ------------------------------------------------ */}
      <section className="bg-shell pb-10 pt-28 sm:pb-12 sm:pt-32 lg:pt-36">
        <div className="container-page">
          <nav aria-label="Ruta de navegación">
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.8125rem] text-ink-muted">
              <li>
                <Link
                  href="/"
                  className="transition-colors duration-200 hover:text-brand-600"
                >
                  Inicio
                </Link>
              </li>
              <li aria-hidden="true" className="text-ink-muted/50">
                ›
              </li>
              <li>
                <Link
                  href="/alojamientos"
                  className="transition-colors duration-200 hover:text-brand-600"
                >
                  Alojamientos
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
            </div>

            <div className="sm:text-right">
              <p className="eyebrow text-ink-muted">Desde</p>
              <p className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.02em] text-brand-700">
                {formatCOP(from.amountCop)}
                <span className="ml-1.5 text-[0.875rem] font-medium tracking-normal text-ink-muted">
                  COP / noche
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
          <Gallery images={accommodation.gallery} name={accommodation.name} />
        </div>
      </section>

      {/* Descripción + panel de reserva ------------------------------------- */}
      {/* Ritmo simétrico: al desaparecer la curva que se montaba sobre la
          sección siguiente, el relleno inferior ya no tiene que ser más alto
          que el superior. */}
      <section className="section-y bg-shell">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7" data-reveal>
              <h2 className="text-[1.75rem] text-ink sm:text-[2rem]">
                Sobre {accommodation.name}
              </h2>
              {accommodation.description && (
                <p className="mt-4 whitespace-pre-line text-[1.0625rem] leading-relaxed text-ink-muted">
                  {accommodation.description}
                </p>
              )}

              {accommodation.amenities.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-[1.5rem] text-ink">
                    Qué incluye
                  </h3>
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
                <p className="eyebrow text-ink-muted">Tarifa desde</p>
                <p className="mt-2 text-[2.25rem] font-semibold leading-none tracking-[-0.02em] text-brand-700">
                  {formatCOP(from.amountCop)}
                  <span className="ml-1.5 text-[0.875rem] font-medium tracking-normal text-ink-muted">
                    COP / noche
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
                    {tierRows(accommodation.tiers).map((row, index) => (
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

                {accommodation.rate_note && (
                  <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-muted">
                    {accommodation.rate_note}
                  </p>
                )}

                {minStays.length > 0 && (
                  <div className="mt-4 rounded-card bg-sand-soft px-4 py-3">
                    <p className="text-[0.8125rem] font-semibold text-ink">
                      Estancia mínima
                    </p>
                    <ul className="mt-1.5 space-y-1 text-[0.8125rem] text-ink-muted">
                      {minStays.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Paquetes vigentes o próximos que el cliente crea en el panel
                    (/admin/tarifas). Si no hay ninguno, no se pinta nada. */}
                <SpecialPlans plans={rates.ratePlans} />

                <a
                  href="#reservar"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-4 text-[1.0625rem] font-semibold tracking-[-0.01em] text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-700 active:scale-[0.98]"
                >
                  Reservar
                  <ArrowRightIcon className="h-[1.05rem] w-[1.05rem]" />
                </a>

                <WhatsAppButton
                  message={message}
                  label="Preguntar por WhatsApp"
                  ariaLabel={`Preguntar por WhatsApp sobre ${accommodation.name}`}
                  variant="soft"
                  size="md"
                  className="mt-3 w-full py-3.5"
                />

                <p className="mt-5 text-center text-[0.8125rem] leading-relaxed text-ink-muted">
                  Respondemos por WhatsApp al {contact.phoneDisplay}
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
        {/* El motor de reservas es la sección más importante de la ficha y
            tiene que destacarse, pero ya no con una curva recortada: ahora lo
            hacen una veladura de luz azul en el borde superior —una capa de
            transparencia, que es lo que pidió el cliente— y las hojas
            flotando de fondo. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(80%_100%_at_50%_0%,rgb(52_95_198/0.3),transparent_70%)]"
        />
        <LeafField tone="light" className="-z-10" />

        <div className="container-page max-w-6xl">
          <div className="text-center">
            <p className="eyebrow text-brand-400">Reservas</p>
            <h2
              id="reservar-title"
              className="tracking-editorial mt-3 text-[2.125rem] leading-[1.08] text-white sm:text-[2.75rem]"
            >
              Elige tus fechas en {accommodation.name}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-sand-soft/70">
              El calendario muestra la disponibilidad real, incluidas las
              reservas que llegan por Airbnb y Booking. Arma tu estadía y
              envíanos la solicitud: confirmamos fechas y forma de pago el mismo
              día.
            </p>
          </div>

          <div className="mt-10">
            <BookingWidget
              slug={accommodation.slug}
              name={accommodation.name}
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
                Otros alojamientos
              </h2>
              <Link
                href="/alojamientos"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[0.9375rem] font-semibold text-brand-700 shadow-card transition-[background-color,color,transform] duration-200 ease-ios hover:bg-brand-600 hover:text-white active:scale-[0.98]"
              >
                Ver los seis
                <ArrowRightIcon className="h-[1.05rem] w-[1.05rem]" />
              </Link>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7 lg:mt-12">
              {others.map((item) => (
                <AccommodationCard key={item.id} accommodation={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(roomJsonLd) }}
      />
    </>
  );
}
