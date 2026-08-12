import type { Metadata } from "next";

import { ExperienceCard } from "@/components/experience-card";
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
        title="Experiencias entre el bosque y el agua"
        description="La Maima no es solo dónde dormir. Treinta años de rehabilitación dejaron senderos, una quebrada con pozos naturales y un bosque al que volvieron las aves."
        image={HERO_IMAGE}
        imageAlt="Senderos y jardines de La Maima con vista al Valle del Cauca"
        breadcrumbs={[
          { href: "/", label: "Inicio" },
          { href: "/experiencias", label: "Experiencias" },
        ]}
      />

      <section className="bg-cream py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          {experiences.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
              {experiences.map((experience, index) => (
                <ExperienceCard
                  key={experience.id}
                  experience={experience}
                  variant="full"
                  priority={index < 2}
                />
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

      {/* Verde más claro que el footer para que no se fundan en un solo bloque. */}
      <section className="bg-forest-800 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-[2rem] leading-[1.1] tracking-[-0.03em] text-white sm:text-[2.5rem]">
            ¿Quieres armar tu plan?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-cream/75">
            Cuéntanos cuántos vienen y qué fechas tienen en mente, y te ayudamos
            a combinar alojamiento y experiencias.
          </p>
          <div className="mt-8 flex justify-center">
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
