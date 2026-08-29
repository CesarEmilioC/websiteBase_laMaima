import type { Metadata } from "next";
import Link from "next/link";

import { ExperienceCard } from "@/components/experience-card";
import { CalendarIcon } from "@/components/icons";
import { LeafField } from "@/components/leaf-field";
import { PageHero } from "@/components/page-hero";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getExperiences } from "@/lib/content";
import { media } from "@/lib/site";
import { GENERAL_MESSAGE } from "@/lib/whatsapp";

/** Foto de la banda de encabezado (bucket "gallery" de Supabase Storage). */
const HERO_IMAGE = media("sitio/senderos.jpg");

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Experiencias",
  description:
    "Senderos por bosque primario, secundario y terciario, piscina natural de río, fogata y avistamiento de flora y fauna en la reserva La Maima, Dapa (Yumbo).",
  alternates: { canonical: "/experiencias" },
  openGraph: {
    title: "Experiencias · La Maima",
    description:
      "Senderos, piscina de río, fogata y avistamiento de aves dentro de la reserva natural de La Maima.",
    url: "/experiencias",
    images: [{ url: HERO_IMAGE }],
  },
};

export default async function ExperiencesPage() {
  const experiences = await getExperiences();

  return (
    <>
      <PageHero
        eyebrow="Qué hacer en la reserva"
        title="Experiencias entre el bosque"
        titleAccent="y el agua"
        description="La Maima no es solo dónde dormir. Treinta años de rehabilitación dejaron senderos, una quebrada con pozos naturales y un bosque al que volvieron las aves."
        image={HERO_IMAGE}
        imageAlt="Sendero con escalones de madera entre guaduas y árboles del bosque de La Maima, con una banca de guadua a un lado"
        breadcrumbs={[
          { href: "/", label: "Inicio" },
          { href: "/experiencias", label: "Experiencias" },
        ]}
      />

      <section className="section-y bg-shell">
        <div className="container-page">
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
              <span className="italic text-brand-300">tu plan</span>?
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
    </>
  );
}
