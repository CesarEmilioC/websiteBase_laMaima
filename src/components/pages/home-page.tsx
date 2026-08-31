import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ExperienceCard } from "@/components/experience-card";
import { AboutGallery } from "@/components/home/about-gallery";
import { AccommodationRow } from "@/components/home/accommodation-row";
import { ExperiencesCarousel } from "@/components/home/experiences-carousel";
import { InstagramStrip } from "@/components/home/instagram-strip";
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
import { LeafField } from "@/components/leaf-field";
import { MapEmbed } from "@/components/map-embed";
import {
  aboutImages,
  getAccommodations,
  getContactInfo,
  getExperiences,
  getHomeAbout,
  getHomeHero,
  getInstagramGallery,
  getOgImage,
} from "@/lib/content";
import { dict } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { generalMessage, whatsappUrl } from "@/lib/whatsapp";

/**
 * Portada, compartida por los dos árboles del sitio.
 *
 * Las rutas (`app/(es)/page.tsx` y `app/en/page.tsx`) son dos archivos de tres
 * líneas que llaman aquí con su idioma: el maquetado, las consultas y el SEO
 * existen UNA sola vez. Duplicar la página por idioma es el error clásico de
 * los sitios bilingües —a los dos meses una de las dos copias va por detrás—, y
 * aquí no hay copia que se quede atrás.
 */

export async function homeMetadata(locale: Locale): Promise<Metadata> {
  const ogImage = await getOgImage(locale);
  const english = locale === "en";

  return pageMetadata({
    /* Título absoluto: ya lleva la marca, así que la plantilla del layout
       (`%s · La Maima`) no debe volver a añadirla. */
    title: english
      ? `${SITE.name} — Country hotel and nature reserve in Dapa, Colombia`
      : `${SITE.name} — Hotel campestre y reserva natural en Dapa, Yumbo`,
    absoluteTitle: true,
    description: english ? SITE.descriptionEn : SITE.description,
    path: "/",
    image: { url: ogImage.url, alt: ogImage.alt },
    socialTitle: `${SITE.name} — ${english ? SITE.taglineEn : SITE.tagline}`,
    locale,
  });
}

/**
 * Titular con las dos últimas palabras destacadas EN COLOR.
 *
 * El énfasis lo hace el COLOR y no una itálica: la cola del titular en azul de
 * marca sobre fondo claro, en azul claro sobre fondo oscuro. Se lee antes y de
 * más lejos que una cursiva, y no depende de que la tipografía tenga un corte
 * itálico real.
 *
 * Funciona con cualquier contenido —los titulares los edita el cliente desde el
 * panel, en los dos idiomas—, así que por debajo de cuatro palabras se renderiza
 * tal cual: destacar "naturaleza" sola sería peor que no hacer nada.
 */
function AccentTail({ text, className }: { text: string; className: string }) {
  const words = text.trim().split(/\s+/);
  if (words.length < 4) return <>{text}</>;

  return (
    <>
      {words.slice(0, -2).join(" ")}{" "}
      <span className={className}>{words.slice(-2).join(" ")}</span>
    </>
  );
}

export async function HomePage({ locale }: { locale: Locale }) {
  const [hero, about, contact, accommodations, experiences, instagramPhotos] =
    await Promise.all([
      getHomeHero(locale),
      getHomeAbout(locale),
      getContactInfo(),
      getAccommodations(locale),
      getExperiences(locale),
      getInstagramGallery(locale),
    ]);

  const t = dict(locale);
  const gallery = aboutImages(about);
  const whatsappHref = whatsappUrl(generalMessage(locale), contact.whatsapp);
  const accommodationsHref = localePath(locale, "/alojamientos");
  const experiencesHref = localePath(locale, "/experiencias");
  /* El CTA de la portada lo edita el panel y guarda la ruta canónica en
     español; se traduce al árbol que toque como cualquier otra. */
  const heroCta = localePath(locale, hero.cta_href);

  return (
    <>
      {/* ================================================================== */}
      {/* Portada                                                             */}
      {/* ================================================================== */}
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
        {/* Hojas flotando sobre la fotografía: la capa está por encima del
            fundido pero por debajo del texto, así que nunca compite con el
            titular. */}
        <LeafField tone="light" className="-z-[5]" />

        <div className="on-photo container-page pb-24 pt-32 sm:pb-28 lg:pb-36">
          {/* El rótulo va DENTRO del `h1`, como antetítulo: el titular es el
              eslogan de la marca y, por sí solo, no dice qué es este sitio. El
              rótulo de encima sí, y tipográficamente ya funciona como
              antetítulo. */}
          <h1 className="tracking-display max-w-3xl text-[2.75rem] leading-[1.06] text-white sm:text-6xl lg:text-[4.25rem]">
            <span className="eyebrow eyebrow-chip mb-6 flex w-fit items-center rounded-full bg-white/20 py-1.5 pl-3.5 text-white ring-1 ring-inset ring-white/30 backdrop-blur-md">
              {hero.eyebrow}
            </span>
            {/* Sobre foto el azul de marca se apagaría: el acento va en el
                azul CLARO de la paleta (#bccef5), que sobre el fundido oscuro
                mantiene un contraste muy holgado y sigue leyéndose como azul. */}
            <AccentTail text={hero.title} className="text-brand-200" />
          </h1>

          <p className="mt-7 max-w-xl border-l border-white/30 pl-5 text-[1.0625rem] leading-relaxed text-white/90 sm:text-xl">
            {hero.subtitle}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={heroCta}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-[1.0625rem] font-semibold tracking-[-0.01em] text-brand-700 shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-50 active:scale-[0.98]"
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
              {t.common.whatsappCheck}
            </a>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Sobre la reserva                                                    */}
      {/* ================================================================== */}
      <section
        id="reserva-natural"
        className="section-y bg-shell"
        aria-labelledby="about-title"
      >
        <div className="container-page">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Texto: siete columnas de doce. */}
            <div className="lg:col-span-7 lg:pr-6" data-reveal>
              <p className="eyebrow text-brand-700">{about.eyebrow}</p>
              <h2
                id="about-title"
                className="tracking-editorial mt-4 text-[2.125rem] leading-[1.12] text-ink sm:text-[2.625rem] lg:text-[3rem]"
              >
                <AccentTail text={about.title} className="text-brand-700" />
              </h2>

              <div className="mt-6 max-w-xl space-y-4 text-[1.0625rem] leading-relaxed text-ink-muted">
                {about.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {about.stats.length > 0 && (
                <dl className="mt-10 grid grid-cols-3 gap-5 sm:gap-8">
                  {about.stats.map((stat) => (
                    <div key={stat.label}>
                      <dt className="sr-only">{stat.label}</dt>
                      <dd>
                        <span aria-hidden="true" className="rule-brand" />
                        <span className="mt-4 block text-[2.25rem] font-semibold leading-none tracking-[-0.03em] text-brand-600 sm:text-[2.75rem]">
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
                href={accommodationsHref}
                className="mt-10 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 text-[0.9375rem] font-semibold text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-700 active:scale-[0.98]"
              >
                {t.home.about.cta}
                <ArrowRightIcon className="h-[1.05rem] w-[1.05rem]" />
              </Link>
            </div>

            {/* Galería automática. En móvil va primero (es lo que invita a
                seguir bajando); en escritorio, a la derecha. */}
            <div className="order-first lg:order-none lg:col-span-5" data-reveal>
              <AboutGallery
                images={gallery}
                locale={locale}
                fallbackAlt={t.gallery.fallbackAlt(SITE.name)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Alojamientos — zigzag                                               */}
      {/* ================================================================== */}
      <section
        id="alojamientos"
        className="section-y bg-white"
        aria-labelledby="alojamientos-title"
      >
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-brand-700">
              {t.home.accommodations.eyebrow}
            </p>
            <h2
              id="alojamientos-title"
              className="tracking-editorial mt-4 text-[2.125rem] leading-[1.12] text-ink sm:text-[2.625rem] lg:text-[3rem]"
            >
              {t.home.accommodations.title}{" "}
              <span className="text-brand-700">
                {t.home.accommodations.titleAccent}
              </span>
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-muted">
              {t.home.accommodations.lead}
            </p>
          </div>

          {accommodations.length > 0 ? (
            <div className="mt-12 lg:mt-16">
              {accommodations.map((accommodation, index) => (
                <AccommodationRow
                  key={accommodation.id}
                  accommodation={accommodation}
                  locale={locale}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <p className="mt-12 text-center text-[0.9375rem] text-ink-muted">
              {t.home.accommodations.empty}
            </p>
          )}

          <div className="mt-10 flex justify-center border-t border-ink/[0.08] pt-12">
            <Link
              href={accommodationsHref}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-[1.0625rem] font-semibold text-brand-700 shadow-card ring-1 ring-inset ring-brand-600/15 transition-[background-color,box-shadow,color,transform] duration-200 ease-ios hover:bg-brand-600 hover:text-white hover:shadow-lift active:scale-[0.98]"
            >
              <CalendarIcon className="h-[1.05rem] w-[1.05rem]" />
              {t.home.accommodations.cta}
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
          className="section-y relative isolate overflow-hidden bg-navy"
          aria-labelledby="experiencias-title"
        >
          {/* Transición CALMADA hacia la banda oscura: en vez de una curva
              recortada, una veladura de luz azul en el borde superior. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(80%_100%_at_50%_0%,rgb(52_95_198/0.3),transparent_70%)]"
          />
          <LeafField tone="light" className="-z-10" />

          <div className="container-page">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-12">
              <div className="lg:col-span-7" data-reveal>
                <p className="eyebrow text-brand-300">
                  {t.home.experiences.eyebrow}
                </p>
                <h2
                  id="experiencias-title"
                  className="tracking-editorial mt-4 text-[2.125rem] leading-[1.12] text-white sm:text-[2.625rem] lg:text-[3rem]"
                >
                  {t.home.experiences.title}{" "}
                  <span className="text-brand-300">
                    {t.home.experiences.titleAccent}
                  </span>
                </h2>
              </div>
              <p
                className="text-[1.0625rem] leading-relaxed text-sand-soft/70 lg:col-span-4 lg:col-start-9 lg:pb-2"
                data-reveal
              >
                {t.home.experiences.lead}
              </p>
            </div>

            <div className="mt-12" data-reveal>
              <ExperiencesCarousel
                label={t.home.experiences.carouselLabel}
                prevLabel={t.home.experiences.prev}
                nextLabel={t.home.experiences.next}
              >
                {experiences.map((experience) => (
                  <li
                    key={experience.id}
                    className="w-[80%] shrink-0 snap-start sm:w-[46%] lg:w-[30.5%]"
                  >
                    <ExperienceCard experience={experience} locale={locale} />
                  </li>
                ))}
              </ExperiencesCarousel>
            </div>

            <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={accommodationsHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-[1.0625rem] font-semibold text-brand-700 shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-50 active:scale-[0.98]"
              >
                <CalendarIcon className="h-[1.05rem] w-[1.05rem]" />
                {t.home.experiences.ctaBook}
              </Link>
              <Link
                href={experiencesHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-6 py-4 text-[1.0625rem] font-semibold text-white ring-1 ring-inset ring-white/20 transition-[background-color,transform] duration-200 ease-ios hover:bg-white/20 active:scale-[0.98]"
              >
                {t.home.experiences.ctaAll}
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
        className="section-y bg-shell"
        aria-labelledby="contacto-title"
      >
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5" data-reveal>
              <p className="eyebrow text-brand-700">{t.home.contact.eyebrow}</p>
              <h2
                id="contacto-title"
                className="tracking-editorial mt-4 text-[2.125rem] leading-[1.12] text-ink sm:text-[2.5rem]"
              >
                {t.home.contact.title}{" "}
                <span className="text-brand-700">
                  {t.home.contact.titleAccent}
                </span>
              </h2>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-muted">
                {t.home.contact.lead}
              </p>

              {/* Lista de datos: icono en tile, texto y filete. */}
              <ul className="mt-8 overflow-hidden rounded-panel bg-white shadow-card">
                <li className="flex items-start gap-4 p-5 sm:px-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-tile bg-brand-600 text-white">
                    <MapPinIcon className="h-[1.35rem] w-[1.35rem]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-semibold text-ink">
                      {t.home.contact.addressLabel}
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
                      className="mt-2 inline-flex items-center gap-1 text-[0.9375rem] font-semibold text-brand-700 transition-colors duration-200 hover:text-brand-600"
                    >
                      {t.home.contact.openInMaps}
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4 border-t border-ink/[0.07] p-5 sm:px-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-tile bg-brand-600 text-white">
                    <PhoneIcon className="h-[1.35rem] w-[1.35rem]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-semibold text-ink">
                      {t.home.contact.phoneLabel}
                    </p>
                    <a
                      href={contact.phoneHref}
                      className="mt-1 block text-[0.9375rem] text-ink-muted transition-colors duration-200 hover:text-brand-700"
                    >
                      {contact.phoneDisplay}
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4 border-t border-ink/[0.07] p-5 sm:px-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-tile bg-brand-600 text-white">
                    <InstagramIcon className="h-[1.35rem] w-[1.35rem]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-semibold text-ink">
                      {t.home.contact.socialLabel}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.9375rem]">
                      <a
                        href={contact.social.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-ink-muted transition-colors duration-200 hover:text-brand-700"
                      >
                        <InstagramIcon className="h-4 w-4" />
                        {contact.social.instagramHandle}
                      </a>
                      <a
                        href={contact.social.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-ink-muted transition-colors duration-200 hover:text-brand-700"
                      >
                        <FacebookIcon className="h-4 w-4" />
                        {contact.social.facebookHandle}
                      </a>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            {/* Columna del mapa: mapa arriba, nota debajo. El alto de escritorio
                está MEDIDO contra la columna de datos (657 px en 1280), no
                elegido a ojo: 468 + 20 de separación + 169 de la nota. */}
            <div className="lg:col-span-7" data-reveal>
              <div className="h-[260px] overflow-hidden rounded-panel bg-sand-soft shadow-panel sm:h-[300px] lg:h-[468px]">
                <MapEmbed
                  src={contact.maps.embedUrl}
                  title={t.home.contact.mapTitle}
                />
              </div>

              {/* Nota "Elige tus fechas en línea": al cliente le gustan estas
                  notas del preview. Es un panel de vidrio arena, no un bloque
                  de color plano. */}
              <div className="glass-sand mt-5 rounded-panel p-6 ring-1 ring-inset ring-brand-600/10 sm:flex sm:items-center sm:gap-7 sm:p-7">
                <p className="text-[0.9375rem] leading-relaxed text-ink-soft sm:flex-1">
                  <strong className="font-semibold text-ink">
                    {t.home.contact.noteStrong}
                  </strong>{" "}
                  {t.home.contact.noteBody}
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:mt-0 sm:shrink-0">
                  <Link
                    href={accommodationsHref}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand-600 px-6 py-3.5 text-[0.9375rem] font-semibold text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-700 active:scale-[0.98]"
                  >
                    <CalendarIcon className="h-[1.05rem] w-[1.05rem]" />
                    {t.common.viewAvailability}
                  </Link>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-white px-6 py-3.5 text-[0.9375rem] font-semibold text-brand-700 shadow-card transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-50 active:scale-[0.98]"
                  >
                    <WhatsAppIcon className="h-[1.15rem] w-[1.15rem]" />
                    {t.common.whatsapp}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Instagram                                                           */}
      {/* ================================================================== */}
      <InstagramStrip
        photos={instagramPhotos}
        href={contact.social.instagram}
        handle={contact.social.instagramHandle}
        locale={locale}
      />
    </>
  );
}
