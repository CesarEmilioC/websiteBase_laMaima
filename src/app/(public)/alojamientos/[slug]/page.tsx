import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccommodationCard } from "@/components/accommodation-card";
import { Gallery } from "@/components/gallery";
import { ArrowRightIcon, CheckIcon, UsersIcon } from "@/components/icons";
import { WhatsAppButton } from "@/components/whatsapp-button";
import {
  coverImage,
  getAccommodationBySlug,
  getAccommodations,
  getContactInfo,
} from "@/lib/content";
import { formatCOP, formatGuests } from "@/lib/format";
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

  const [all, contact] = await Promise.all([
    getAccommodations(),
    getContactInfo(),
  ]);
  const others = all.filter((item) => item.slug !== accommodation.slug).slice(0, 3);
  const cover = coverImage(accommodation.gallery, accommodation.name);
  const message = accommodationMessage(accommodation.name);

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
      <section className="bg-white pb-8 pt-28 sm:pb-10 sm:pt-32 lg:pt-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <nav aria-label="Ruta de navegación">
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.8125rem] text-ink-muted">
              <li>
                <Link
                  href="/"
                  className="transition-colors duration-200 hover:text-forest-600"
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
                  className="transition-colors duration-200 hover:text-forest-600"
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
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-forest-600/10 px-3.5 py-1.5 text-[0.875rem] font-semibold text-forest-700">
                <UsersIcon className="h-4 w-4" />
                Hasta {formatGuests(accommodation.capacity)}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-[0.8125rem] font-medium text-ink-muted">
                Desde
              </p>
              <p className="mt-1 text-[2rem] font-semibold leading-none tracking-[-0.035em] text-forest-700">
                {formatCOP(accommodation.price_per_night_cop)}
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
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <Gallery images={accommodation.gallery} name={accommodation.name} />
        </div>
      </section>

      {/* Descripción + panel de reserva ------------------------------------- */}
      <section className="bg-white py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <h2 className="text-[1.75rem] tracking-[-0.03em] text-ink sm:text-[2rem]">
                Sobre {accommodation.name}
              </h2>
              {accommodation.description && (
                <p className="mt-4 whitespace-pre-line text-[1.0625rem] leading-relaxed text-ink-muted">
                  {accommodation.description}
                </p>
              )}

              {accommodation.amenities.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-[1.5rem] tracking-[-0.03em] text-ink">
                    Qué incluye
                  </h3>
                  {/* Lista estilo iOS: icono + texto + separador hairline */}
                  <ul className="mt-5 overflow-hidden rounded-panel bg-cream sm:grid sm:grid-cols-2">
                    {accommodation.amenities.map((amenity, index) => (
                      <li
                        key={amenity}
                        className={`flex items-center gap-3.5 px-5 py-3.5 text-[0.9375rem] text-ink-soft ${
                          index > 0 ? "border-t border-black/[0.07]" : ""
                        } ${
                          index % 2 === 1
                            ? "sm:border-l sm:border-l-black/[0.07]"
                            : ""
                        } ${index === 1 ? "sm:border-t-0" : ""}`}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest-600 text-white">
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
              <div className="rounded-panel bg-white p-7 shadow-panel ring-1 ring-black/[0.05] lg:sticky lg:top-28">
                <p className="text-[0.8125rem] font-medium text-ink-muted">
                  Tarifa de referencia
                </p>
                <p className="mt-1.5 text-[2.25rem] font-semibold leading-none tracking-[-0.04em] text-forest-700">
                  {formatCOP(accommodation.price_per_night_cop)}
                  <span className="ml-1.5 text-[0.875rem] font-medium tracking-normal text-ink-muted">
                    COP / noche
                  </span>
                </p>
                {accommodation.price_note && (
                  <p className="mt-2 text-[0.8125rem] text-ink-muted">
                    {accommodation.price_note}
                  </p>
                )}

                <dl className="mt-6 overflow-hidden rounded-card bg-cream text-[0.9375rem]">
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <dt className="text-ink-muted">Capacidad</dt>
                    <dd className="font-semibold text-ink">
                      Hasta {formatGuests(accommodation.capacity)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-black/[0.07] px-4 py-3">
                    <dt className="text-ink-muted">Cocineta</dt>
                    <dd className="font-semibold text-ink">Equipada</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-black/[0.07] px-4 py-3">
                    <dt className="text-ink-muted">Baño</dt>
                    <dd className="font-semibold text-ink">Privado</dd>
                  </div>
                </dl>

                <a
                  href="#reservar"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-forest-600 px-6 py-4 text-[1.0625rem] font-semibold tracking-[-0.01em] text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-forest-700 active:scale-[0.98]"
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

      {/* Bloque de reserva -------------------------------------------------- */}
      <section
        id="reservar"
        className="bg-forest-950 py-16 sm:py-20 lg:py-24"
        aria-labelledby="reservar-title"
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="eyebrow text-forest-400">Reservas</p>
          <h2
            id="reservar-title"
            className="mt-3 text-[2rem] leading-[1.1] tracking-[-0.03em] text-white sm:text-[2.5rem]"
          >
            Reserva por WhatsApp mientras habilitamos el pago en línea
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-cream/70">
            Estamos terminando el calendario de disponibilidad en tiempo real y
            el pago con tarjeta, PSE y Nequi. Por ahora confirmamos fechas,
            tarifa exacta y forma de pago directamente por WhatsApp: te
            respondemos el mismo día.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <WhatsAppButton
              message={message}
              label={`Reservar ${accommodation.name}`}
              ariaLabel={`Reservar ${accommodation.name} por WhatsApp`}
              size="lg"
            />
            <a
              href={contact.phoneHref}
              className="inline-flex items-center justify-center rounded-full bg-white/12 px-7 py-4 text-[1.0625rem] font-semibold tracking-[-0.01em] text-white ring-1 ring-inset ring-white/20 backdrop-blur-md transition-[background-color,transform] duration-200 ease-ios hover:bg-white/22 active:scale-[0.98]"
            >
              Llamar al {contact.phoneDisplay}
            </a>
          </div>
        </div>
      </section>

      {/* Otros alojamientos -------------------------------------------------- */}
      {others.length > 0 && (
        <section
          className="bg-cream py-16 sm:py-20 lg:py-24"
          aria-labelledby="otros-title"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2
                id="otros-title"
                className="text-[2rem] tracking-[-0.03em] text-ink sm:text-[2.25rem]"
              >
                Otros alojamientos
              </h2>
              <Link
                href="/alojamientos"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[0.9375rem] font-semibold text-forest-700 shadow-card transition-[background-color,color,transform] duration-200 ease-ios hover:bg-forest-600 hover:text-white active:scale-[0.98]"
              >
                Ver los seis
                <ArrowRightIcon className="h-[1.05rem] w-[1.05rem]" />
              </Link>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
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
