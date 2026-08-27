import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AccommodationCard } from "@/components/accommodation-card";
import { ExperienceCard } from "@/components/experience-card";
import { AboutGallery } from "@/components/home/about-gallery";
import { ExperiencesCarousel } from "@/components/home/experiences-carousel";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChevronRightIcon,
  FacebookIcon,
  InstagramIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { SectionCurve } from "@/components/section-curve";
import {
  aboutImages,
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

/**
 * Titular con jerarquía asimétrica.
 *
 * Las dos últimas palabras bajan a su propia línea, con menos peso y
 * desplazadas a la derecha: el titular deja de ser un bloque centrado y pasa a
 * leerse como un texto compuesto a mano. Funciona con cualquier contenido —los
 * titulares los edita el cliente desde el panel—, así que por debajo de cuatro
 * palabras se renderiza tal cual: partir "La naturaleza" en dos líneas sería
 * peor que no partir nada.
 */
function SplitTitle({ text, tailClassName }: { text: string; tailClassName: string }) {
  const words = text.trim().split(/\s+/);
  if (words.length < 4) return <>{text}</>;

  return (
    <>
      <span className="block">{words.slice(0, -2).join(" ")}</span>
      <span className={`block ${tailClassName}`}>{words.slice(-2).join(" ")}</span>
    </>
  );
}

export default async function HomePage() {
  const [hero, about, contact, accommodations, experiences] = await Promise.all([
    getHomeHero(),
    getHomeAbout(),
    getContactInfo(),
    getAccommodations(),
    getExperiences(),
  ]);

  const gallery = aboutImages(about);
  const whatsappHref = whatsappUrl(GENERAL_MESSAGE, contact.whatsapp);

  return (
    <>
      {/* ================================================================== */}
      {/* Portada                                                             */}
      {/* ================================================================== */}
      {/* El relleno inferior es generoso a propósito: la curva blanca de la
          sección siguiente se monta sobre esta foto hasta ~96 px y no puede
          tapar los botones. */}
      <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden">
        <Image
          src={hero.image}
          alt={hero.image_alt}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div aria-hidden="true" className="photo-scrim absolute inset-0 -z-10" />

        <div className="on-photo mx-auto w-full max-w-7xl px-4 pb-32 pt-32 sm:px-6 sm:pb-36 lg:px-10 lg:pb-48">
          <p className="eyebrow mb-6 inline-flex items-center rounded-full bg-white/22 px-3.5 py-1.5 text-white ring-1 ring-inset ring-white/30 backdrop-blur-md">
            {hero.eyebrow}
          </p>

          <h1 className="tracking-display max-w-4xl text-[2.75rem] leading-[1.02] text-white sm:text-6xl lg:text-[4.5rem]">
            <SplitTitle
              text={hero.title}
              tailClassName="font-normal text-white/85 sm:pl-[1.1em]"
            />
          </h1>

          {/* Subtítulo desplazado del eje del titular y colgado de un filete:
              rompe la columna única sin inventar una retícula nueva. */}
          <p className="mt-8 max-w-xl border-l border-white/30 pl-5 text-[1.0625rem] leading-relaxed text-white/90 sm:ml-[10%] sm:text-xl lg:ml-[16%]">
            {hero.subtitle}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:ml-[10%] sm:flex-row sm:items-center lg:ml-[16%]">
            <Link
              href={hero.cta_href}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-white/90 active:scale-[0.98]"
            >
              {hero.cta_label}
              <ArrowRightIcon className="h-[1.05rem] w-[1.05rem]" />
            </Link>
            <a
              href={whatsappHref}
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
        className="relative bg-white pb-20 pt-14 sm:pb-24 sm:pt-16 lg:pb-32 lg:pt-20"
        aria-labelledby="about-title"
      >
        <SectionCurve variant="loma" fill="fill-white" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Texto: siete columnas de doce, no la mitad exacta. */}
            <div className="lg:col-span-7 lg:pr-6" data-reveal>
              <p className="eyebrow text-forest-600">{about.eyebrow}</p>
              <h2
                id="about-title"
                className="tracking-editorial mt-3 text-[2.125rem] leading-[1.06] text-ink sm:text-[2.75rem] lg:text-[3.25rem]"
              >
                <SplitTitle
                  text={about.title}
                  tailClassName="font-normal text-ink-muted sm:pl-[0.9em]"
                />
              </h2>

              <div className="mt-7 max-w-xl space-y-4 text-[1.0625rem] leading-relaxed text-ink-muted">
                {about.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {about.stats.length > 0 && (
                /* Cascada diagonal: cada cifra baja un poco más que la
                   anterior. Es el mismo dato de siempre, sin la rejilla
                   perfectamente alineada de todos los sitios. */
                <dl className="mt-10 grid grid-cols-3 gap-4 sm:gap-8">
                  {about.stats.map((stat, index) => (
                    <div
                      key={stat.label}
                      className={
                        index === 1 ? "sm:mt-5" : index === 2 ? "sm:mt-10" : ""
                      }
                    >
                      <dt className="sr-only">{stat.label}</dt>
                      <dd>
                        <span className="block h-px w-8 bg-forest-600/40" />
                        <span className="mt-4 block text-[2.5rem] font-semibold leading-none tracking-[-0.045em] text-forest-600 sm:text-[3rem]">
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

              <Link
                href="/alojamientos"
                className="mt-11 inline-flex items-center gap-2 rounded-full bg-forest-600 px-6 py-3.5 text-[0.9375rem] font-semibold text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-forest-700 active:scale-[0.98]"
              >
                Ver alojamientos y fechas
                <ArrowRightIcon className="h-[1.05rem] w-[1.05rem]" />
              </Link>
            </div>

            {/* Galería automática con máscara de guijarro. En móvil va primero
                (es lo que invita a seguir bajando); en escritorio, a la derecha
                y levantada respecto al texto. */}
            <div
              className="order-first lg:order-none lg:col-span-5 lg:-mt-10"
              data-reveal
            >
              <AboutGallery
                images={gallery}
                fallbackAlt={`${SITE.name}, reserva natural en Dapa`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Alojamientos                                                        */}
      {/* ================================================================== */}
      <section
        id="alojamientos"
        className="relative bg-cream pb-20 pt-14 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20"
        aria-labelledby="alojamientos-title"
      >
        <SectionCurve variant="onda" fill="fill-cream" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          {/* Encabezado editorial: el titular ocupa siete columnas y el texto
              de apoyo se descuelga a la derecha, alineado abajo. */}
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-12">
            <div className="lg:col-span-7" data-reveal>
              <p className="eyebrow text-forest-600">Dónde dormir</p>
              <h2
                id="alojamientos-title"
                className="tracking-editorial mt-3 text-[2.125rem] leading-[1.06] text-ink sm:text-[2.75rem] lg:text-[3.25rem]"
              >
                Seis casas y cabañas, cada una con su propio{" "}
                <span className="font-normal text-ink-muted">
                  pedazo de montaña
                </span>
              </h2>
            </div>
            <p
              className="text-[1.0625rem] leading-relaxed text-ink-muted lg:col-span-4 lg:col-start-9 lg:pb-2"
              data-reveal
            >
              Todas son independientes y cuentan con cocineta equipada y baño
              privado. Elige la que mejor se acomode a tu grupo y calcula tu
              estadía con fechas reales.
            </p>
          </div>

          {accommodations.length > 0 ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-7">
              {accommodations.map((accommodation, index) => (
                <div
                  key={accommodation.id}
                  data-reveal
                  /* Escalonado en diagonal: la rejilla deja de leerse como una
                     tabla y las tarjetas parecen colocadas, no calculadas. */
                  className={
                    index % 3 === 1
                      ? "lg:mt-8"
                      : index % 3 === 2
                        ? "lg:mt-16"
                        : ""
                  }
                >
                  <AccommodationCard accommodation={accommodation} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-12 text-[0.9375rem] text-ink-muted">
              Estamos actualizando la información de nuestros alojamientos.
              Escríbenos por WhatsApp y te contamos la disponibilidad.
            </p>
          )}

          <div className="mt-14 flex justify-center lg:mt-10">
            <Link
              href="/alojamientos"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-[1.0625rem] font-semibold text-forest-700 shadow-card transition-[background-color,box-shadow,color,transform] duration-200 ease-ios hover:bg-forest-600 hover:text-white hover:shadow-lift active:scale-[0.98]"
            >
              <CalendarIcon className="h-[1.05rem] w-[1.05rem]" />
              Ver los seis y reservar
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
          className="relative bg-forest-950 pb-20 pt-14 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20"
          aria-labelledby="experiencias-title"
        >
          <SectionCurve variant="arco" fill="fill-forest-950" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-12">
              <div className="lg:col-span-6" data-reveal>
                <p className="eyebrow text-forest-400">Qué hacer</p>
                <h2
                  id="experiencias-title"
                  className="tracking-editorial mt-3 text-[2.125rem] leading-[1.06] text-white sm:text-[2.75rem] lg:text-[3.25rem]"
                >
                  El bosque también es{" "}
                  <span className="font-normal text-forest-300">
                    parte del plan
                  </span>
                </h2>
              </div>
              <p
                className="text-[1.0625rem] leading-relaxed text-cream/70 lg:col-span-4 lg:col-start-9 lg:pb-2"
                data-reveal
              >
                Senderos, agua fría de quebrada, fogata al anochecer y aves que
                volvieron después de treinta años de rehabilitación.
              </p>
            </div>

            <div className="mt-10 lg:mt-12" data-reveal>
              <ExperiencesCarousel label="Experiencias de La Maima">
                {experiences.map((experience) => (
                  <li
                    key={experience.id}
                    className="w-[80%] shrink-0 snap-start sm:w-[46%] lg:w-[30.5%]"
                  >
                    <ExperienceCard experience={experience} />
                  </li>
                ))}
              </ExperiencesCarousel>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/alojamientos"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-[1.0625rem] font-semibold text-forest-800 shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-forest-50 active:scale-[0.98]"
              >
                <CalendarIcon className="h-[1.05rem] w-[1.05rem]" />
                Reservar tu estadía
              </Link>
              <Link
                href="/experiencias"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-6 py-4 text-[1.0625rem] font-semibold text-white ring-1 ring-inset ring-white/15 transition-[background-color,transform] duration-200 ease-ios hover:bg-white/20 active:scale-[0.98]"
              >
                Ver todas las experiencias
                <ArrowRightIcon className="h-[1.05rem] w-[1.05rem]" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* Ubicación y contacto                                                */}
      {/* ================================================================== */}
      <section
        id="contacto"
        className="relative bg-white pb-20 pt-14 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20"
        aria-labelledby="contacto-title"
      >
        <SectionCurve variant="loma" fill="fill-white" flip />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5" data-reveal>
              <p className="eyebrow text-forest-600">Cómo llegar</p>
              <h2
                id="contacto-title"
                className="tracking-editorial mt-3 text-[2.125rem] leading-[1.06] text-ink sm:text-[2.75rem]"
              >
                A 12 kilómetros de la vía a Dapa,{" "}
                <span className="font-normal text-ink-muted">
                  a menos de una hora de Cali
                </span>
              </h2>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-muted">
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
                    Elige tus fechas en línea.
                  </strong>{" "}
                  Cada alojamiento tiene su calendario con la disponibilidad
                  real y el cálculo de tu estadía. La solicitud se confirma por
                  WhatsApp el mismo día.
                </p>
                {/* Desde `lg` esta columna es la estrecha (cinco de doce) y
                    los dos botones ya no caben en una línea sin partir sus
                    etiquetas: ahí vuelven a apilarse. `whitespace-nowrap` es
                    la garantía de que ninguna etiqueta se rompa nunca. */}
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
                  <Link
                    href="/alojamientos"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-forest-600 px-6 py-3.5 text-[0.9375rem] font-semibold text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-forest-700 active:scale-[0.98]"
                  >
                    <CalendarIcon className="h-[1.05rem] w-[1.05rem]" />
                    Ver disponibilidad
                  </Link>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-white px-6 py-3.5 text-[0.9375rem] font-semibold text-forest-700 shadow-card transition-[background-color,transform] duration-200 ease-ios hover:bg-forest-50 active:scale-[0.98]"
                  >
                    <WhatsAppIcon className="h-[1.15rem] w-[1.15rem]" />
                    Escribir por WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* El mapa lleva la segunda (y última) máscara orgánica del sitio:
                dos esquinas opuestas muy abiertas, en forma de portal. */}
            <div
              className="mask-arch overflow-hidden bg-forest-100 shadow-panel lg:col-span-7"
              data-reveal
            >
              <iframe
                src={contact.maps.embedUrl}
                title="Ubicación de La Maima en Google Maps"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[380px] w-full border-0 sm:h-[480px] lg:h-full lg:min-h-[620px]"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
