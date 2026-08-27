import type { Metadata } from "next";
import Link from "next/link";

import { ExperienceCard } from "@/components/experience-card";
import { CalendarIcon } from "@/components/icons";
import { PageHero } from "@/components/page-hero";
import { SectionCurve } from "@/components/section-curve";
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
        title="Experiencias entre el bosque y el agua"
        description="La Maima no es solo dónde dormir. Treinta años de rehabilitación dejaron senderos, una quebrada con pozos naturales y un bosque al que volvieron las aves."
        image={HERO_IMAGE}
        imageAlt="Sendero con escalones de madera entre guaduas y árboles del bosque de La Maima, con una banca de guadua a un lado"
        breadcrumbs={[
          { href: "/", label: "Inicio" },
          { href: "/experiencias", label: "Experiencias" },
        ]}
      />

      <section className="bg-cream pb-16 pt-12 sm:pb-20 sm:pt-14 lg:pb-24 lg:pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          {experiences.length > 0 ? (
            /* Dos columnas desfasadas en vertical: el par de tarjetas deja de
               leerse como una tabla de 2×2 y la página respira en diagonal. */
            <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
              {experiences.map((experience, index) => (
                <div
                  key={experience.id}
                  data-reveal
                  className={index % 2 === 1 ? "md:mt-14" : ""}
                >
                  <ExperienceCard experience={experience} variant="full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-panel bg-white p-8 text-center shadow-card sm:p-10">
              <h2 className="text-[1.5rem] tracking-[-0.025em] text-ink">
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

      {/* Verde más claro que el footer para que no se fundan en un solo bloque.
          Sube hacia la sección anterior con un arco, no con una línea recta. */}
      <section className="relative bg-forest-800 pb-16 pt-14 sm:pb-20 sm:pt-16">
        <SectionCurve variant="arco" fill="fill-forest-800" />

        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6" data-reveal>
          <h2 className="tracking-editorial text-[2.125rem] leading-[1.08] text-white sm:text-[2.75rem]">
            ¿Quieres armar{" "}
            <span className="font-normal text-forest-300">tu plan?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-cream/75">
            Cuéntanos cuántos vienen y qué fechas tienen en mente, y te ayudamos
            a combinar alojamiento y experiencias.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/alojamientos"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-[1.0625rem] font-semibold text-forest-800 shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-forest-50 active:scale-[0.98]"
            >
              <CalendarIcon className="h-[1.05rem] w-[1.05rem]" />
              Ver alojamientos y fechas
            </Link>
            <WhatsAppButton
              message={GENERAL_MESSAGE}
              label="Hablar con nosotros"
              size="lg"
            />
          </div>
        </div>
      </section>
    </>
  );
}
