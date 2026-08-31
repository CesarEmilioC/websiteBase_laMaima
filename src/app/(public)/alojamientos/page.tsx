import type { Metadata } from "next";

import { AccommodationCard } from "@/components/accommodation-card";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getAccommodations, getListingHeroes } from "@/lib/content";
import { breadcrumbList, pageMetadata } from "@/lib/seo";
import { GENERAL_MESSAGE } from "@/lib/whatsapp";

/** Migas visibles y marcado estructurado salen de esta misma lista. */
const CRUMBS = [
  { name: "Inicio", path: "/" },
  { name: "Alojamientos", path: "/alojamientos" },
];

export const revalidate = 3600;

/**
 * La foto de la banda de encabezado se edita en `/admin/contenido`
 * (`site_content.listing_heroes.alojamientos`, ver `getListingHeroes()`), así
 * que los metadatos —que también la usan como imagen social— pasan a
 * `generateMetadata()` para poder leerla antes de responder.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { alojamientos: hero } = await getListingHeroes();

  return pageMetadata({
    title: "Alojamientos: casas y cabañas en Dapa",
    description:
      "Seis casas y cabañas independientes en Dapa (Yumbo): Casa Maima, Mirador, Casa Loma, Casa Uba, Dos Casitas y Tres Casitas. Con cocineta y baño privado.",
    path: "/alojamientos",
    image: { url: hero.image, alt: hero.image_alt },
    socialTitle: "Alojamientos · La Maima",
    socialDescription:
      "Seis casas y cabañas independientes entre el bosque de Dapa, todas con cocineta y baño privado.",
  });
}

export default async function AccommodationsPage() {
  const [accommodations, { alojamientos: hero }] = await Promise.all([
    getAccommodations(),
    getListingHeroes(),
  ]);

  return (
    <>
      <PageHero
        /* El rótulo es el antetítulo del `h1` (ver `page-hero.tsx`), así que
           es donde entran de forma natural el tipo de alojamiento y el lugar
           que el titular, por tono, no nombra. */
        eyebrow="Casas y cabañas en Dapa"
        title="Dormir dentro de"
        titleAccent="la reserva"
        description="Seis alojamientos independientes repartidos por la ladera. Cada uno con su entrada, su terraza y su vista. Todos con cocineta equipada y baño privado."
        image={hero.image}
        imageAlt={hero.image_alt}
        breadcrumbs={CRUMBS.map((crumb) => ({
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
                <p className="eyebrow text-brand-700">Dónde dormir</p>
                <h2 className="tracking-editorial mt-4 text-[2rem] leading-[1.1] text-ink sm:text-[2.5rem]">
                  Seis casas y cabañas
                </h2>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-muted">
                  Cada alojamiento tiene su propia tarifa según el número de
                  huéspedes, y las noches de lunes a jueves cuestan menos. Entra
                  a la ficha para ver la tabla completa y calcular tu estadía
                  con fechas reales.
                </p>
              </div>

              {/* Rejilla alineada: sin escalonados en diagonal. Las seis fichas
                  son equivalentes y la retícula lo dice. */}
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-7">
                {accommodations.map((accommodation) => (
                  <div key={accommodation.id} data-reveal>
                    <AccommodationCard accommodation={accommodation} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-2xl rounded-panel bg-white p-8 text-center shadow-card ring-1 ring-inset ring-ink/[0.04] sm:p-10">
              <h2 className="text-[1.5rem] tracking-editorial text-ink">
                Estamos actualizando esta sección
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink-muted">
                Mientras tanto, escríbenos por WhatsApp y te contamos qué
                alojamientos tenemos disponibles.
              </p>
              <div className="mt-6 flex justify-center">
                <WhatsAppButton message={GENERAL_MESSAGE} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* La miga de pan que se ve arriba, en formato legible por máquina. */}
      <JsonLd graph={[breadcrumbList(CRUMBS)]} />
    </>
  );
}
