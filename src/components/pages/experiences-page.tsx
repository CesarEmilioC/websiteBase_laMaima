import type { Metadata } from "next";
import Link from "next/link";

import { ExperienceCard } from "@/components/experience-card";
import { CalendarIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { LeafField } from "@/components/leaf-field";
import { PageHero } from "@/components/page-hero";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getExperiences, getListingHeroes } from "@/lib/content";
import { dict } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";
import { breadcrumbList, pageMetadata } from "@/lib/seo";
import { generalMessage } from "@/lib/whatsapp";

function crumbs(locale: Locale) {
  const t = dict(locale);
  return [
    { name: t.nav.home, path: localePath(locale, "/") },
    { name: t.nav.experiences, path: localePath(locale, "/experiencias") },
  ];
}

/**
 * La foto de la banda de encabezado se edita en `/admin/contenido`
 * (`site_content.listing_heroes.experiencias`, ver `getListingHeroes()`), así
 * que los metadatos —que también la usan como imagen social— pasan a
 * `generateMetadata()` para poder leerla antes de responder.
 */
export async function experiencesMetadata(locale: Locale): Promise<Metadata> {
  const { experiencias: hero } = await getListingHeroes(locale);
  const english = locale === "en";

  return pageMetadata({
    title: english
      ? "Experiences at the nature reserve"
      : "Experiencias en la reserva natural",
    description: english
      ? "Day pass with lunch, yoga class, the trail to the Arroyohondo river, natural pool, fire pit and birdwatching at the La Maima reserve, Dapa (Yumbo)."
      : "Pasadía con almuerzo, clase de yoga, sendero al río Arroyohondo, pileta natural, fogata y avistamiento de aves en la reserva La Maima, Dapa (Yumbo).",
    path: "/experiencias",
    image: { url: hero.image, alt: hero.image_alt },
    socialTitle: english
      ? "Experiences · La Maima"
      : "Experiencias · La Maima",
    socialDescription: english
      ? "Day pass, yoga, the river trail, a natural pool, the fire pit and farm-style home cooking inside the La Maima nature reserve."
      : "Pasadía, yoga, sendero al río, pileta natural, fogata y cocina casera de campo dentro de la reserva natural de La Maima.",
    locale,
  });
}

export async function ExperiencesPage({ locale }: { locale: Locale }) {
  const [experiences, { experiencias: hero }] = await Promise.all([
    getExperiences(locale),
    getListingHeroes(locale),
  ]);

  const t = dict(locale);
  const list = crumbs(locale);

  return (
    <>
      <PageHero
        locale={locale}
        eyebrow={t.experiences.heroEyebrow}
        title={t.experiences.heroTitle}
        titleAccent={t.experiences.heroTitleAccent}
        description={t.experiences.heroDescription}
        image={hero.image}
        imageAlt={hero.image_alt}
        breadcrumbs={list.map((crumb) => ({
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
            {t.experiences.listHeading}
          </h2>

          {experiences.length > 0 ? (
            /* Rejilla alineada de dos columnas: sin desfases verticales. */
            <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
              {experiences.map((experience) => (
                <div key={experience.id} data-reveal>
                  <ExperienceCard
                    experience={experience}
                    locale={locale}
                    variant="full"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl rounded-panel bg-white p-8 text-center shadow-card ring-1 ring-inset ring-ink/[0.04] sm:p-10">
              <h2 className="text-[1.5rem] tracking-editorial text-ink">
                {t.common.updatingSection}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink-muted">
                {t.experiences.emptyHelp}
              </p>
              <div className="mt-6 flex justify-center">
                <WhatsAppButton
                  message={generalMessage(locale)}
                  label={t.common.whatsapp}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Cierre en azul marino CLARO (`navy-soft`): el pie va en `navy`, y con
          el mismo tono los dos bloques se leerían como una sola mancha oscura
          de media pantalla. */}
      <section className="section-y relative isolate overflow-hidden bg-navy-soft">
        <LeafField tone="light" className="-z-10" />

        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center" data-reveal>
            <h2 className="tracking-editorial text-[2.125rem] leading-[1.08] text-white sm:text-[2.75rem]">
              {t.experiences.planTitle}{" "}
              <span className="text-brand-300">
                {t.experiences.planTitleAccent}
              </span>
              {t.experiences.planTitleTail}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-sand-soft/80">
              {t.experiences.planLead}
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={localePath(locale, "/alojamientos")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-[1.0625rem] font-semibold tracking-[-0.01em] text-brand-700 shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-50 active:scale-[0.98]"
              >
                <CalendarIcon className="h-[1.05rem] w-[1.05rem]" />
                {t.experiences.planCta}
              </Link>
              <WhatsAppButton
                message={generalMessage(locale)}
                label={t.common.talkToUs}
                variant="onDark"
                size="lg"
              />
            </div>
          </div>
        </div>
      </section>

      <JsonLd graph={[breadcrumbList(list)]} />
    </>
  );
}
