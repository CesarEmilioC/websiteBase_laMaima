import type { Metadata } from "next";

import { AccommodationCard } from "@/components/accommodation-card";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getAccommodations, getListingHeroes } from "@/lib/content";
import { dict } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";
import { breadcrumbList, pageMetadata } from "@/lib/seo";
import { generalMessage } from "@/lib/whatsapp";

/** Migas visibles y marcado estructurado salen de esta misma lista. */
function crumbs(locale: Locale) {
  const t = dict(locale);
  return [
    { name: t.nav.home, path: localePath(locale, "/") },
    { name: t.nav.accommodations, path: localePath(locale, "/alojamientos") },
  ];
}

/**
 * La foto de la banda de encabezado se edita en `/admin/contenido`
 * (`site_content.listing_heroes.alojamientos`, ver `getListingHeroes()`), así
 * que los metadatos —que también la usan como imagen social— pasan a
 * `generateMetadata()` para poder leerla antes de responder.
 */
export async function accommodationsMetadata(
  locale: Locale,
): Promise<Metadata> {
  const { alojamientos: hero } = await getListingHeroes(locale);
  const english = locale === "en";

  return pageMetadata({
    title: english
      ? "Stays: houses and cabins in Dapa"
      : "Alojamientos: casas y cabañas en Dapa",
    description: english
      ? "Six independent houses and cabins in Dapa (Yumbo, Colombia): Casa Maima, Mirador, Casa Loma, Casa Uba, Dos Casitas and Tres Casitas. Kitchenette and private bathroom."
      : "Seis casas y cabañas independientes en Dapa (Yumbo): Casa Maima, Mirador, Casa Loma, Casa Uba, Dos Casitas y Tres Casitas. Con cocineta y baño privado.",
    path: "/alojamientos",
    image: { url: hero.image, alt: hero.image_alt },
    socialTitle: english ? "Stays · La Maima" : "Alojamientos · La Maima",
    socialDescription: english
      ? "Six independent houses and cabins in the forest of Dapa, all with a kitchenette and a private bathroom."
      : "Seis casas y cabañas independientes entre el bosque de Dapa, todas con cocineta y baño privado.",
    locale,
  });
}

export async function AccommodationsPage({ locale }: { locale: Locale }) {
  const [accommodations, { alojamientos: hero }] = await Promise.all([
    getAccommodations(locale),
    getListingHeroes(locale),
  ]);

  const t = dict(locale);
  const list = crumbs(locale);

  return (
    <>
      <PageHero
        locale={locale}
        /* El rótulo es el antetítulo del `h1` (ver `page-hero.tsx`), así que
           es donde entran de forma natural el tipo de alojamiento y el lugar
           que el titular, por tono, no nombra. */
        eyebrow={t.accommodations.heroEyebrow}
        title={t.accommodations.heroTitle}
        titleAccent={t.accommodations.heroTitleAccent}
        description={t.accommodations.heroDescription}
        image={hero.image}
        imageAlt={hero.image_alt}
        breadcrumbs={list.map((crumb) => ({
          href: crumb.path,
          label: crumb.name,
        }))}
      />

      {/* Fondo `shell` (no arena): las tarjetas son blancas y necesitan el
          lienzo cálido para recortarse. */}
      <section className="section-y bg-shell">
        <div className="container-page">
          {accommodations.length > 0 ? (
            <>
              {/* Encabezado de sección en el MISMO eje izquierdo que el titular
                  de la banda de arriba. La tarifa depende de cuántos vengan y
                  de qué noches sean: decirlo aquí evita la decepción de entrar
                  a una ficha y ver un número distinto al "Desde" de la
                  tarjeta. */}
              <div className="max-w-2xl" data-reveal>
                <p className="eyebrow text-brand-700">
                  {t.accommodations.sectionEyebrow}
                </p>
                <h2 className="tracking-editorial mt-4 text-[2rem] leading-[1.1] text-ink sm:text-[2.5rem]">
                  {t.accommodations.sectionTitle}
                </h2>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-muted">
                  {t.accommodations.sectionLead}
                </p>
              </div>

              {/* Rejilla alineada: sin escalonados en diagonal. Las seis fichas
                  son equivalentes y la retícula lo dice. */}
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-7">
                {accommodations.map((accommodation) => (
                  <div key={accommodation.id} data-reveal>
                    <AccommodationCard
                      accommodation={accommodation}
                      locale={locale}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-2xl rounded-panel bg-white p-8 text-center shadow-card ring-1 ring-inset ring-ink/[0.04] sm:p-10">
              <h2 className="text-[1.5rem] tracking-editorial text-ink">
                {t.common.updatingSection}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink-muted">
                {t.accommodations.emptyHelp}
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

      {/* La miga de pan que se ve arriba, en formato legible por máquina. */}
      <JsonLd graph={[breadcrumbList(list)]} />
    </>
  );
}
