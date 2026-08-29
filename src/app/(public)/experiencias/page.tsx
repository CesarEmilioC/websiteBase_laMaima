import type { Metadata } from "next";
import Link from "next/link";

import { ExperienceCard } from "@/components/experience-card";
import { CalendarIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { LeafField } from "@/components/leaf-field";
import { PageHero } from "@/components/page-hero";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getExperiences } from "@/lib/content";
import { breadcrumbList, pageMetadata } from "@/lib/seo";
import { media } from "@/lib/site";
import { GENERAL_MESSAGE } from "@/lib/whatsapp";

/** Foto de la banda de encabezado (bucket "gallery" de Supabase Storage). */
const HERO_IMAGE = media("sitio/senderos.jpg");
const HERO_ALT =
  "Sendero con escalones de madera entre guaduas y árboles del bosque de La Maima, con una banca de guadua a un lado";

const CRUMBS = [
  { name: "Inicio", path: "/" },
  { name: "Experiencias", path: "/experiencias" },
];

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Experiencias en la reserva natural",
  description:
    "Senderos por bosque primario, secundario y terciario, piscina natural de río, fogata y avistamiento de aves en la reserva La Maima, Dapa (Yumbo).",
  path: "/experiencias",
  image: { url: HERO_IMAGE, alt: HERO_ALT },
  socialTitle: "Experiencias · La Maima",
  socialDescription:
    "Senderos, piscina de río, fogata y avistamiento de aves dentro de la reserva natural de La Maima.",
});

export default async function ExperiencesPage() {
  const experiences = await getExperiences();

  return (
    <>
      <PageHero
        eyebrow="Qué hacer en la reserva de Dapa"
        title="Experiencias entre el bosque"
        titleAccent="y el agua"
        description="La Maima no es solo dónde dormir. Treinta años de rehabilitación dejaron senderos, una quebrada con pozos naturales y un bosque al que volvieron las aves."
        image={HERO_IMAGE}
        imageAlt={HERO_ALT}
        breadcrumbs={CRUMBS.map((crumb) => ({
          href: crumb.path,
          label: crumb.name,
        }))}
      />

      <section
        className="section-y bg-shell"
        aria-labelledby="listado-experiencias"
      >
        <div className="container-page">
          {/* Encabezado de la rejilla. No se pinta —el titular de la banda de
              arriba ya presenta la página y el cliente aprobó ese ritmo— pero
              tiene que existir: sin él la página saltaba del `h1` a los `h3`
              de las tarjetas, y un salto de nivel rompe tanto el árbol de
              encabezados que lee un lector de pantalla como el esquema que
              deduce el buscador. */}
          <h2 id="listado-experiencias" className="sr-only">
            Experiencias incluidas en la estadía
          </h2>

          {experiences.length > 0 ? (
            /* Rejilla alineada de dos columnas: sin desfases verticales. Las
               tarjetas son grandes y la retícula recta las deja respirar sin
               dibujar diagonales. */
            <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
              {experiences.map((experience) => (
                <div key={experience.id} data-reveal>
                  <ExperienceCard experience={experience} variant="full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl rounded-panel bg-white p-8 text-center shadow-card ring-1 ring-inset ring-ink/[0.04] sm:p-10">
              <h2 className="text-[1.5rem] tracking-editorial text-ink">
                Estamos actualizando esta sección
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink-muted">
                Escríbenos por WhatsApp y te contamos qué experiencias tenemos
                disponibles para tu visita.
              </p>
              <div className="mt-6 flex justify-center">
                <WhatsAppButton message={GENERAL_MESSAGE} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Cierre en azul marino CLARO (`navy-soft`): el pie va en `navy`, y con
          el mismo tono los dos bloques se leerían como una sola mancha oscura
          de media pantalla. El borde superior es recto; lo que separa esta
          banda de la anterior es el aire, no un recorte. */}
      <section className="section-y relative isolate overflow-hidden bg-navy-soft">
        <LeafField tone="light" className="-z-10" />

        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center" data-reveal>
            <h2 className="tracking-editorial text-[2.125rem] leading-[1.08] text-white sm:text-[2.75rem]">
              ¿Quieres armar{" "}
              <span className="text-brand-300">tu plan</span>?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-sand-soft/80">
              Cuéntanos cuántos vienen y qué fechas tienen en mente, y te
              ayudamos a combinar alojamiento y experiencias.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/alojamientos"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-[1.0625rem] font-semibold tracking-[-0.01em] text-brand-700 shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-50 active:scale-[0.98]"
              >
                <CalendarIcon className="h-[1.05rem] w-[1.05rem]" />
                Ver alojamientos y fechas
              </Link>
              <WhatsAppButton
                message={GENERAL_MESSAGE}
                label="Hablar con nosotros"
                variant="onDark"
                size="lg"
              />
            </div>
          </div>
        </div>
      </section>

      <JsonLd graph={[breadcrumbList(CRUMBS)]} />
    </>
  );
}
