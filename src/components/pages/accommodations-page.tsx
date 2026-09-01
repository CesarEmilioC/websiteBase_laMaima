import type { Metadata } from "next";

import { AccommodationCard } from "@/components/accommodation-card";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { listNamesWithin, numberWordCapitalized } from "@/lib/counts";
import { getAccommodations, getListingHeroes, getStayNames } from "@/lib/content";
import { dict } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";
import { breadcrumbList, DESCRIPTION_LIMIT, pageMetadata } from "@/lib/seo";
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
/**
 * Descripción de buscador del listado.
 *
 * ---------------------------------------------------------------------------
 * ERA EL TEXTO MÁS DESACTUALIZABLE DEL SITIO
 * ---------------------------------------------------------------------------
 * Decía, literalmente: "Seis casas y cabañas independientes en Dapa (Yumbo):
 * Casa Maima, Mirador, Casa Loma, Casa Uba, Dos Casitas y Tres Casitas". Un
 * número Y una lista de nombres, los dos a mano. El día que el cliente ocultó
 * Casa Uba desde el panel, esa frase pasó a anunciar en Google una casa que la
 * página ya no muestra —y a contar una de más—, sin que nada avisara.
 *
 * Ahora el número sale del conteo real y los nombres, de la base, en el mismo
 * orden en que se publican. La lista se recorta a lo que quepa dentro del
 * límite de Google cerrando con "y más" (`listNamesWithin`), porque el número
 * de casas puede crecer y una descripción cortada a mitad de un nombre propio
 * es peor que una lista honesta e incompleta.
 */
function listingDescription(
  stays: number,
  names: string[],
  locale: Locale,
): string {
  const english = locale === "en";

  if (stays === 0) {
    return english
      ? "Independent houses and cabins in Dapa (Yumbo, Colombia), inside a nature reserve. Kitchenette and private bathroom in every one."
      : "Casas y cabañas independientes en Dapa (Yumbo), dentro de una reserva natural. Todas con cocineta y baño privado.";
  }

  const head = english
    ? stays === 1
      ? "One independent house in Dapa (Yumbo, Colombia)"
      : `${numberWordCapitalized(stays, "en")} independent houses and cabins in Dapa (Yumbo, Colombia)`
    : stays === 1
      ? "Una casa independiente en Dapa (Yumbo)"
      : `${numberWordCapitalized(stays, "es")} casas y cabañas independientes en Dapa (Yumbo)`;

  const tail = english
    ? "Kitchenette and private bathroom."
    : "Con cocineta y baño privado.";

  /* Lo que queda para los nombres, descontando el encabezado, el cierre y los
     dos signos de puntuación que los separan. */
  const room = DESCRIPTION_LIMIT - head.length - tail.length - 3;
  const list = listNamesWithin(names, locale, Math.max(room, 0));

  return list ? `${head}: ${list}. ${tail}` : `${head}. ${tail}`;
}

export async function accommodationsMetadata(
  locale: Locale,
): Promise<Metadata> {
  const [{ alojamientos: hero }, names] = await Promise.all([
    getListingHeroes(locale),
    getStayNames(locale),
  ]);
  const english = locale === "en";
  const stays = names.length;

  return pageMetadata({
    title: english
      ? "Stays: houses and cabins in Dapa"
      : "Alojamientos: casas y cabañas en Dapa",
    description: listingDescription(stays, names, locale),
    path: "/alojamientos",
    image: { url: hero.image, alt: hero.image_alt },
    socialTitle: english ? "Stays · La Maima" : "Alojamientos · La Maima",
    /* En redes no hay listado de nombres: el espacio útil es la mitad y ahí
       manda la promesa, no el inventario. */
    socialDescription: listingSocialDescription(stays, locale),
    locale,
  });
}

/** La misma frase, sin nombres, para la tarjeta de WhatsApp y de X. */
function listingSocialDescription(stays: number, locale: Locale): string {
  const english = locale === "en";

  if (english) {
    const units =
      stays === 0
        ? "Independent houses and cabins"
        : stays === 1
          ? "One independent house"
          : `${numberWordCapitalized(stays, "en")} independent houses and cabins`;
    return `${units} in the forest of Dapa, all with a kitchenette and a private bathroom.`;
  }

  const units =
    stays === 0
      ? "Casas y cabañas independientes"
      : stays === 1
        ? "Una casa independiente"
        : `${numberWordCapitalized(stays, "es")} casas y cabañas independientes`;
  return `${units} entre el bosque de Dapa, todas con cocineta y baño privado.`;
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
        description={t.accommodations.heroDescription(accommodations.length)}
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
                  {t.accommodations.sectionTitle(accommodations.length)}
                </h2>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-muted">
                  {t.accommodations.sectionLead}
                </p>
              </div>

              {/* Rejilla alineada: sin escalonados en diagonal. Las fichas son
                  equivalentes entre sí y la retícula lo dice. */}
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
