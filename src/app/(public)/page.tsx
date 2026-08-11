import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AccommodationCard } from "@/components/accommodation-card";
import { ExperienceCard } from "@/components/experience-card";
import {
  ArrowRightIcon,
  ChevronRightIcon,
  FacebookIcon,
  InstagramIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsAppIcon,
} from "@/components/icons";
import {
  getAccommodations,
  getContactInfo,
  getExperiences,
  getHomeAbout,
  getHomeHero,
} from "@/lib/content";
import { SITE } from "@/lib/site";
import { GENERAL_MESSAGE, whatsappUrl } from "@/lib/whatsapp";

/** Revalidación cada hora: el contenido lo edita el cliente, no cambia por minuto. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: `${SITE.name} — Hotel campestre y reserva natural en Dapa, Yumbo`,
  description: SITE.description,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [hero, about, contact, accommodations, experiences] = await Promise.all([
    getHomeHero(),
    getHomeAbout(),
    getContactInfo(),
    getAccommodations(),
    getExperiences(),
  ]);

  return (
    <>
      {/* ================================================================== */}
      {/* Hero                                                                */}
      {/* ================================================================== */}
      <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden">
        <Image
          src={hero.image}
          alt={hero.image_alt}
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div aria-hidden="true" className="photo-scrim absolute inset-0 -z-10" />

        <div className="on-photo mx-auto w-full max-w-7xl px-4 pb-20 pt-32 sm:px-6 sm:pb-24 lg:px-10 lg:pb-28">
          <p className="eyebrow mb-6 inline-flex items-center rounded-full bg-white/22 px-3.5 py-1.5 text-white ring-1 ring-inset ring-white/30 backdrop-blur-md">
            {hero.eyebrow}
          </p>

          <h1 className="tracking-display max-w-4xl text-[2.75rem] leading-[1.02] text-white sm:text-6xl lg:text-7xl">
            {hero.title}
          </h1>

          <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-white/85 sm:text-xl">
            {hero.subtitle}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={hero.cta_href}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-white/90 active:scale-[0.98]"
            >
              {hero.cta_label}
              <ArrowRightIcon className="h-[1.05rem] w-[1.05rem]" />
            </Link>
            <a
              href={whatsappUrl(GENERAL_MESSAGE, contact.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-full bg-white/12 px-7 py-4 text-[1.0625rem] font-semibold tracking-[-0.01em] text-white ring-1 ring-inset ring-white/25 backdrop-blur-md transition-[background-color,transform] duration-200 ease-ios hover:bg-white/22 active:scale-[0.98]"
            >
              <WhatsAppIcon className="h-[1.15rem] w-[1.15rem]" />
              Consultar disponibilidad
            </a>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Sobre la reserva                                                    */}
      {/* ================================================================== */}
      <section
        id="reserva-natural"
        className="bg-white py-20 sm:py-24 lg:py-32"
        aria-labelledby="about-title"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="relative aspect-[4/3] overflow-hidden rounded-panel bg-forest-100 shadow-panel lg:aspect-[5/4]">
              <Image
                src={about.image}
                alt={about.image_alt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            <div>
              <p className="eyebrow text-forest-600">{about.eyebrow}</p>
              <h2
                id="about-title"
                className="mt-3 text-[2rem] leading-[1.08] tracking-[-0.03em] text-ink sm:text-[2.5rem]"
              >
                {about.title}
              </h2>

              <div className="mt-6 space-y-4 text-[1.0625rem] leading-relaxed text-ink-muted">
                {about.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {about.stats.length > 0 && (
                <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-black/[0.08] pt-8 sm:gap-6">
                  {about.stats.map((stat) => (
                    <div key={stat.label}>
                      <dt className="sr-only">{stat.label}</dt>
                      <dd>
                        <span className="block text-[2.25rem] font-semibold leading-none tracking-[-0.04em] text-forest-600 sm:text-[2.75rem]">
                          {stat.value}
                        </span>
                        <span className="mt-2.5 block text-[0.8125rem] leading-snug text-ink-muted sm:text-sm">
                          {stat.label}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Alojamientos                                                        */}
      {/* ================================================================== */}
      <section
        id="alojamientos"
        className="bg-cream py-20 sm:py-24 lg:py-32"
        aria-labelledby="alojamientos-title"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl">
            <p className="eyebrow text-forest-600">Dónde dormir</p>
            <h2
              id="alojamientos-title"
              className="mt-3 text-[2rem] leading-[1.08] tracking-[-0.03em] text-ink sm:text-[2.5rem]"
            >
              Seis casas y cabañas, cada una con su propio pedazo de montaña
            </h2>
            <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink-muted">
              Todas son independientes y cuentan con cocineta equipada y baño
              privado. Elige la que mejor se acomode a tu grupo.
            </p>
          </div>

          {accommodations.length > 0 ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-7">
              {accommodations.map((accommodation, index) => (
                <AccommodationCard
                  key={accommodation.id}
                  accommodation={accommodation}
                  priority={index < 3}
                />
              ))}
            </div>
          ) : (
            <p className="mt-12 text-[0.9375rem] text-ink-muted">
              Estamos actualizando la información de nuestros alojamientos.
              Escríbenos por WhatsApp y te contamos la disponibilidad.
            </p>
          )}

          <div className="mt-12 flex justify-center">
            <Link
              href="/alojamientos"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[0.9375rem] font-semibold text-forest-700 shadow-card transition-[background-color,box-shadow,transform] duration-200 ease-ios hover:bg-forest-600 hover:text-white hover:shadow-lift active:scale-[0.98]"
            >
              Ver todos los alojamientos
              <ArrowRightIcon className="h-[1.05rem] w-[1.05rem]" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Experiencias                                                        */}
      {/* ================================================================== */}
      {experiences.length > 0 && (
        <section
          id="experiencias"
          className="bg-forest-950 py-20 sm:py-24 lg:py-32"
          aria-labelledby="experiencias-title"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="eyebrow text-forest-400">Qué hacer</p>
                <h2
                  id="experiencias-title"
                  className="mt-3 text-[2rem] leading-[1.08] tracking-[-0.03em] text-white sm:text-[2.5rem]"
                >
                  El bosque también es parte del plan
                </h2>
                <p className="mt-4 text-[1.0625rem] leading-relaxed text-cream/70">
                  Senderos, agua fría de quebrada, fogata al anochecer y aves que
                  volvieron después de treinta años de rehabilitación.
                </p>
              </div>

              <Link
                href="/experiencias"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-[0.9375rem] font-semibold text-white ring-1 ring-inset ring-white/15 transition-[background-color,transform] duration-200 ease-ios hover:bg-white/20 active:scale-[0.98]"
              >
                Ver todas las experiencias
                <ArrowRightIcon className="h-[1.05rem] w-[1.05rem]" />
              </Link>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
              {experiences.map((experience) => (
                <ExperienceCard key={experience.id} experience={experience} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* Ubicación y contacto                                                */}
      {/* ================================================================== */}
      <section
        id="contacto"
        className="bg-white py-20 sm:py-24 lg:py-32"
        aria-labelledby="contacto-title"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="eyebrow text-forest-600">Cómo llegar</p>
              <h2
                id="contacto-title"
                className="mt-3 text-[2rem] leading-[1.08] tracking-[-0.03em] text-ink sm:text-[2.5rem]"
              >
                A 12 kilómetros de la vía a Dapa, a menos de una hora de Cali
              </h2>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink-muted">
                La subida es por carretera pavimentada y el último tramo está
                señalizado. Si vienes por primera vez, escríbenos y te enviamos
                la ubicación exacta y las recomendaciones del camino.
              </p>

              {/* Lista estilo iOS: icono en tile redondeada, texto y hairline */}
              <ul className="mt-9 overflow-hidden rounded-panel bg-cream">
                <li className="flex items-start gap-4 p-5 sm:px-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-tile bg-forest-600 text-white">
                    <MapPinIcon className="h-[1.35rem] w-[1.35rem]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-semibold text-ink">
                      Dirección
                    </p>
                    <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-muted">
                      {contact.street}
                      <br />
                      {contact.locality}, {contact.region}, {contact.country}
                    </p>
                    <a
                      href={contact.maps.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[0.9375rem] font-semibold text-forest-600 transition-colors duration-200 hover:text-forest-700"
                    >
                      Abrir en Google Maps
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4 border-t border-black/[0.07] p-5 sm:px-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-tile bg-forest-600 text-white">
                    <PhoneIcon className="h-[1.35rem] w-[1.35rem]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-semibold text-ink">
                      Teléfono y WhatsApp
                    </p>
                    <a
                      href={contact.phoneHref}
                      className="mt-1 block text-[0.9375rem] text-ink-muted transition-colors duration-200 hover:text-forest-600"
                    >
                      {contact.phoneDisplay}
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4 border-t border-black/[0.07] p-5 sm:px-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-tile bg-forest-600 text-white">
                    <InstagramIcon className="h-[1.35rem] w-[1.35rem]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-semibold text-ink">
                      Redes sociales
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.9375rem]">
                      <a
                        href={contact.social.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-ink-muted transition-colors duration-200 hover:text-forest-600"
                      >
                        <InstagramIcon className="h-4 w-4" />
                        {contact.social.instagramHandle}
                      </a>
                      <a
                        href={contact.social.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-ink-muted transition-colors duration-200 hover:text-forest-600"
                      >
                        <FacebookIcon className="h-4 w-4" />
                        {contact.social.facebookHandle}
                      </a>
                    </div>
                  </div>
                </li>
              </ul>

              <div className="mt-6 rounded-panel bg-forest-50 p-6 sm:p-7">
                <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
                  <strong className="font-semibold text-ink">
                    Reservas por WhatsApp.
                  </strong>{" "}
                  Estamos habilitando el pago en línea con calendario en tiempo
                  real. Mientras tanto, confirmamos disponibilidad y tarifas por
                  WhatsApp.
                </p>
                <a
                  href={whatsappUrl(GENERAL_MESSAGE, contact.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-whatsapp px-6 py-3.5 text-[0.9375rem] font-semibold text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-whatsapp-dark active:scale-[0.98]"
                >
                  <WhatsAppIcon className="h-[1.15rem] w-[1.15rem]" />
                  Escribir por WhatsApp
                </a>
              </div>
            </div>

            <div className="overflow-hidden rounded-panel bg-forest-100 shadow-panel">
              <iframe
                src={contact.maps.embedUrl}
                title="Ubicación de La Maima en Google Maps"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[380px] w-full border-0 sm:h-[480px] lg:h-full lg:min-h-[560px]"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
