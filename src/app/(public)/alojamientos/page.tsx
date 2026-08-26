import type { Metadata } from "next";

import { AccommodationCard } from "@/components/accommodation-card";
import { PageHero } from "@/components/page-hero";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getAccommodations } from "@/lib/content";
import { media } from "@/lib/site";
import { GENERAL_MESSAGE } from "@/lib/whatsapp";

/** Foto de la banda de encabezado (bucket "gallery" de Supabase Storage). */
const HERO_IMAGE = media("alojamientos/casa-maima/1.jpg");

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Alojamientos",
  description:
    "Seis casas y cabañas independientes en La Maima, Dapa (Yumbo): Casa Maima, Mirador, Casa Loma, Casa Uba, Dos Casitas y Tres Casitas. Todas con cocineta y baño privado.",
  alternates: { canonical: "/alojamientos" },
  openGraph: {
    title: "Alojamientos · La Maima",
    description:
      "Seis casas y cabañas independientes entre el bosque de Dapa, todas con cocineta y baño privado.",
    url: "/alojamientos",
    images: [{ url: HERO_IMAGE }],
  },
};

export default async function AccommodationsPage() {
  const accommodations = await getAccommodations();

  return (
    <>
      <PageHero
        eyebrow="Casas y cabañas"
        title="Dormir dentro de la reserva"
        description="Seis alojamientos independientes repartidos por la ladera. Cada uno con su entrada, su terraza y su vista. Todos con cocineta equipada y baño privado."
        image={HERO_IMAGE}
        imageAlt="Casa Maima vista desde el jardín, con base en piedra y grandes ventanales"
        breadcrumbs={[
          { href: "/", label: "Inicio" },
          { href: "/alojamientos", label: "Alojamientos" },
        ]}
      />

      <section className="bg-cream py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          {accommodations.length > 0 ? (
            <>
              {/* La tarifa depende de cuántos vengan y de qué noches sean:
                  decirlo aquí evita la decepción de entrar a una ficha y ver
                  un número distinto al del "Desde" de la tarjeta. */}
              <p className="max-w-2xl text-[1.0625rem] leading-relaxed text-ink-muted">
                Cada alojamiento tiene su propia tarifa según el número de
                huéspedes, y las noches de lunes a jueves cuestan menos. Entra a
                la ficha para ver la tabla completa y calcular tu estadía con
                fechas reales.
              </p>

              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-7">
                {accommodations.map((accommodation, index) => (
                  <AccommodationCard
                    key={accommodation.id}
                    accommodation={accommodation}
                    priority={index < 3}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-panel bg-white p-8 text-center shadow-card sm:p-10">
              <h2 className="text-[1.5rem] tracking-[-0.025em] text-ink">
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
    </>
  );
}
