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
} from "@/lib/content";
import { SITE } from "@/lib/site";
import { GENERAL_MESSAGE, whatsappUrl } from "@/lib/whatsapp";

/** Revalidación cada hora: el contenido lo edita el cliente, no cambia por minuto. */
export const revalidate = 3600;

/**
 * `title.absolute` y no una cadena suelta: la plantilla del layout raíz
 * (`%s · La Maima`) se aplica a cualquier `title` que sea texto, y la portada
 * estaba publicando "La Maima — Hotel campestre… · La Maima", con la marca
 * repetida y 76 caracteres, o sea recortada en resultados.
 *
 * OpenGraph y Twitter se heredan enteros del layout raíz, que describe
 * exactamente esta página: no hace falta repetirlos.
 */
export const metadata: Metadata = {
  title: {
    absolute: `${SITE.name} — Hotel campestre y reserva natural en Dapa, Yumbo`,
  },
  description: SITE.description,
  alternates: { canonical: "/" },
};

/**
 * Titular con las dos últimas palabras destacadas EN COLOR.
 *
 * El diseño anterior partía el titular en dos líneas y desplazaba la segunda
 * hacia la derecha. Ese gesto asimétrico pertenecía al lenguaje "orgánico" que
 * el rediseño retira: la referencia que eligió el cliente
 * (americantradehotel.com) compone en bloques rectos y alineados.
 *
 * v2.1 — El énfasis lo hacía la itálica de la serifa de display; al volver a la
 * sans, la itálica de una neogrotesca es una inclinación mecánica que no aporta
 * jerarquía (y en algunos sistemas ni siquiera existe como corte real: el
 * navegador la falsea). El recurso pasa a ser el COLOR: la cola del titular en
 * azul de marca sobre fondo claro, en azul claro sobre fondo oscuro. Se lee
 * antes y de más lejos que una cursiva.
 *
 * Funciona con cualquier contenido —los titulares los edita el cliente desde el
 * panel—, así que por debajo de cuatro palabras se renderiza tal cual: destacar
 * "naturaleza" sola sería peor que no hacer nada.
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

export default async function HomePage() {
  const [hero, about, contact, accommodations, experiences, instagramPhotos] =
    await Promise.all([
      getHomeHero(),
      getHomeAbout(),
      getContactInfo(),
      getAccommodations(),
      getExperiences(),
      getInstagramGallery(),
    ]);

  const gallery = aboutImages(about);
  const whatsappHref = whatsappUrl(GENERAL_MESSAGE, contact.whatsapp);

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
          {/* El rótulo va DENTRO del `h1`, como antetítulo.
              -------------------------------------------------------------
              El titular de la portada es el eslogan de la marca ("La
              naturaleza a tu alcance"), que es lo que el cliente aprobó y lo
              que la administradora edita desde el panel. Como eslogan no dice
              qué es este sitio: un buscador leía un `h1` sin una sola de las
              palabras por las que se busca el hotel.

              El rótulo de encima —"Reserva natural y hotel campestre"— sí lo
              dice, y tipográficamente ya funciona como antetítulo del
              titular. Meterlo dentro del `h1` no cambia un píxel (`.eyebrow`
              fija su propio cuerpo, familia y espaciado, y `flex w-fit`
              reproduce el `inline-flex` que tenía como párrafo suelto) y
              convierte el encabezado en la frase completa que se quería leer,
              sin añadir palabras clave que nadie ve. */}
          <h1 className="tracking-display max-w-3xl text-[2.75rem] leading-[1.06] text-white sm:text-6xl lg:text-[4.25rem]">
            <span className="eyebrow eyebrow-chip mb-6 flex w-fit items-center rounded-full bg-white/20 py-1.5 pl-3.5 text-white ring-1 ring-inset ring-white/30 backdrop-blur-md">
              {hero.eyebrow}
            </span>
            {/* Sobre foto el azul de marca se apagaría: el acento va en el
                azul CLARO de la paleta (#bccef5), que sobre el fundido oscuro
                mantiene un contraste muy holgado y sigue leyéndose como azul. */}
            <AccentTail text={hero.title} className="text-brand-200" />
          </h1>

          {/* Todo cuelga del mismo eje izquierdo que el titular: sin sangrías
              porcentuales, que era el gesto del diseño anterior. */}
          <p className="mt-7 max-w-xl border-l border-white/30 pl-5 text-[1.0625rem] leading-relaxed text-white/90 sm:text-xl">
            {hero.subtitle}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={hero.cta_href}
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
                /* Alineadas sobre una misma línea de base. La cascada diagonal
                   del diseño anterior (cada cifra un poco más abajo que la
                   anterior) desaparece: el cliente pidió que todo quede bien
                   alineado. */
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
                href="/alojamientos"
                className="mt-10 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 text-[0.9375rem] font-semibold text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-700 active:scale-[0.98]"
              >
                Ver alojamientos y fechas
                <ArrowRightIcon className="h-[1.05rem] w-[1.05rem]" />
              </Link>
            </div>

            {/* Galería automática. En móvil va primero (es lo que invita a
                seguir bajando); en escritorio, a la derecha. Ya no lleva
                desplazamiento vertical (`-mt-10`): las dos columnas se centran
                una respecto a la otra. */}
            <div className="order-first lg:order-none lg:col-span-5" data-reveal>
              <AboutGallery
                images={gallery}
                fallbackAlt={`${SITE.name}, reserva natural en Dapa`}
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
            <p className="eyebrow text-brand-700">Dónde dormir</p>
            <h2
              id="alojamientos-title"
              className="tracking-editorial mt-4 text-[2.125rem] leading-[1.12] text-ink sm:text-[2.625rem] lg:text-[3rem]"
            >
              {/* Espacio duro entre "cada" y "una": el equilibrado automático
                  de líneas partía justo ahí y dejaba "cada" solo al final de
                  la primera línea. */}
              Seis casas y cabañas, cada&nbsp;una con su{" "}
              <span className="text-brand-700">pedazo de montaña</span>
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-muted">
              Todas independientes, con cocineta equipada y baño privado. Elige
              la que mejor se acomode a tu grupo y calcula tu estadía con fechas
              reales.
            </p>
          </div>

          {accommodations.length > 0 ? (
            <div className="mt-12 lg:mt-16">
              {accommodations.map((accommodation, index) => (
                <AccommodationRow
                  key={accommodation.id}
                  accommodation={accommodation}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <p className="mt-12 text-center text-[0.9375rem] text-ink-muted">
              Estamos actualizando la información de nuestros alojamientos.
              Escríbenos por WhatsApp y te contamos la disponibilidad.
            </p>
          )}

          <div className="mt-10 flex justify-center border-t border-ink/[0.08] pt-12">
            <Link
              href="/alojamientos"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-[1.0625rem] font-semibold text-brand-700 shadow-card ring-1 ring-inset ring-brand-600/15 transition-[background-color,box-shadow,color,transform] duration-200 ease-ios hover:bg-brand-600 hover:text-white hover:shadow-lift active:scale-[0.98]"
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
          className="section-y relative isolate overflow-hidden bg-navy"
          aria-labelledby="experiencias-title"
        >
          {/* Transición CALMADA hacia la banda oscura: en vez de una curva
              recortada, una veladura de luz azul en el borde superior. Es una
              capa de transparencia —lo que pidió el cliente— y no una forma. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(80%_100%_at_50%_0%,rgb(52_95_198/0.3),transparent_70%)]"
          />
          <LeafField tone="light" className="-z-10" />

          <div className="container-page">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-12">
              <div className="lg:col-span-7" data-reveal>
                <p className="eyebrow text-brand-300">Qué hacer</p>
                <h2
                  id="experiencias-title"
                  className="tracking-editorial mt-4 text-[2.125rem] leading-[1.12] text-white sm:text-[2.625rem] lg:text-[3rem]"
                >
                  El bosque también es{" "}
                  <span className="text-brand-300">parte del plan</span>
                </h2>
              </div>
              <p
                className="text-[1.0625rem] leading-relaxed text-sand-soft/70 lg:col-span-4 lg:col-start-9 lg:pb-2"
                data-reveal
              >
                Senderos, agua fría de quebrada, fogata al anochecer y aves que
                volvieron después de treinta años de rehabilitación.
              </p>
            </div>

            <div className="mt-12" data-reveal>
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

            <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/alojamientos"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-[1.0625rem] font-semibold text-brand-700 shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-50 active:scale-[0.98]"
              >
                <CalendarIcon className="h-[1.05rem] w-[1.05rem]" />
                Reservar tu estadía
              </Link>
              <Link
                href="/experiencias"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-6 py-4 text-[1.0625rem] font-semibold text-white ring-1 ring-inset ring-white/20 transition-[background-color,transform] duration-200 ease-ios hover:bg-white/20 active:scale-[0.98]"
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
      {/* Al cliente le gusta esta sección, pero pedía que ocupara MENOS alto
          (v2.1). Dos cambios, ningún dato fuera:

            · El mapa deja de ser una columna a toda altura (620 px mínimos en
              escritorio) y pasa a una banda contenida de 340 px. Un mapa
              embebido no gana nada por ser alto: lo que se mira es el punto y
              el nombre de las vías de alrededor, y eso cabe de sobra.
            · La nota "Elige tus fechas en línea" baja de la columna izquierda
              a DEBAJO del mapa. Ahí gana ancho, así que sus dos botones caben
              en una sola línea (en la columna estrecha se apilaban), y la
              columna de datos se queda solo con lo que es información de
              contacto.

          El resultado es una sección equilibrada —dos columnas de alto
          parecido— en vez de una columna larguísima al lado de un mapa
          estirado para acompañarla. */}
      <section
        id="contacto"
        className="section-y bg-shell"
        aria-labelledby="contacto-title"
      >
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5" data-reveal>
              <p className="eyebrow text-brand-700">Cómo llegar</p>
              <h2
                id="contacto-title"
                className="tracking-editorial mt-4 text-[2.125rem] leading-[1.12] text-ink sm:text-[2.5rem]"
              >
                A 12 kilómetros de la vía a Dapa,{" "}
                <span className="text-brand-700">
                  a menos de una hora de Cali
                </span>
              </h2>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-muted">
                La subida es por carretera pavimentada y el último tramo está
                señalizado. Si vienes por primera vez, escríbenos y te enviamos
                la ubicación exacta y las recomendaciones del camino.
              </p>

              {/* Lista de datos: icono en tile, texto y filete. */}
              <ul className="mt-8 overflow-hidden rounded-panel bg-white shadow-card">
                <li className="flex items-start gap-4 p-5 sm:px-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-tile bg-brand-600 text-white">
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
                      className="mt-2 inline-flex items-center gap-1 text-[0.9375rem] font-semibold text-brand-700 transition-colors duration-200 hover:text-brand-600"
                    >
                      Abrir en Google Maps
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
                      Teléfono y WhatsApp
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
                      Redes sociales
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

            {/* Columna del mapa: mapa arriba, nota debajo. */}
            <div className="lg:col-span-7" data-reveal>
              {/* El mapa es un rectángulo (se retiró la máscara de portal del
                  diseño orgánico) y ahora una BANDA de alto contenido. El alto
                  lo fija ESTE contenedor —no el iframe— para que el hueco
                  exista desde el primer pintado y el mapa diferido no provoque
                  salto de maqueta. */}
              {/* El alto de escritorio está MEDIDO, no elegido a ojo: en 1280
                  la columna de datos mide 657 px y la del mapa sumaba 529
                  (340 + 20 de separación + 169 de la nota), así que sobraban
                  128 px de aire al pie de esta columna y la sección se veía
                  descuadrada. 468 px cierra la cuenta —468 + 20 + 169 = 657—
                  sin tocar el alto total de la sección, que lo sigue marcando
                  la columna izquierda. */}
              <div className="h-[260px] overflow-hidden rounded-panel bg-sand-soft shadow-panel sm:h-[300px] lg:h-[468px]">
                <MapEmbed
                  src={contact.maps.embedUrl}
                  title="Ubicación de La Maima en Google Maps"
                />
              </div>

              {/* Nota "Elige tus fechas en línea": al cliente le gustan estas
                  notas del preview. Es un panel de vidrio arena, no un bloque
                  de color plano.

                  Aquí, en la columna ancha, los dos botones caben en una sola
                  fila desde `sm` y ya no hay que volver a apilarlos en `lg`
                  (que es lo que hacía falta cuando la nota vivía en la columna
                  estrecha). `whitespace-nowrap` sigue garantizando que ninguna
                  etiqueta se parta. */}
              <div className="glass-sand mt-5 rounded-panel p-6 ring-1 ring-inset ring-brand-600/10 sm:flex sm:items-center sm:gap-7 sm:p-7">
                <p className="text-[0.9375rem] leading-relaxed text-ink-soft sm:flex-1">
                  <strong className="font-semibold text-ink">
                    Elige tus fechas en línea.
                  </strong>{" "}
                  Cada alojamiento tiene su calendario con la disponibilidad
                  real y el cálculo de tu estadía. La solicitud se confirma por
                  WhatsApp el mismo día.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:mt-0 sm:shrink-0">
                  <Link
                    href="/alojamientos"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand-600 px-6 py-3.5 text-[0.9375rem] font-semibold text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-700 active:scale-[0.98]"
                  >
                    <CalendarIcon className="h-[1.05rem] w-[1.05rem]" />
                    Ver disponibilidad
                  </Link>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-white px-6 py-3.5 text-[0.9375rem] font-semibold text-brand-700 shadow-card transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-50 active:scale-[0.98]"
                  >
                    <WhatsAppIcon className="h-[1.15rem] w-[1.15rem]" />
                    Escribir por WhatsApp
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
      />
    </>
  );
}
