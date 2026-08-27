import Image from "next/image";

import { ClockIcon } from "./icons";
import { WhatsAppButton } from "./whatsapp-button";
import { coverImage, type Experience } from "@/lib/content";
import { experienceMessage } from "@/lib/whatsapp";

type Props = {
  experience: Experience;
  /**
   * "compact" para el carrusel de la portada, "full" para la página de
   * experiencias.
   */
  variant?: "compact" | "full";
};

/**
 * La foto va siempre diferida: en las dos páginas donde aparece esta tarjeta,
 * la imagen prioritaria es la banda de encabezado. Ver la nota de
 * `AccommodationCard`.
 */
export function ExperienceCard({ experience, variant = "compact" }: Props) {
  const cover = coverImage(experience.gallery, `${experience.name} en La Maima`);
  const full = variant === "full";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card bg-white shadow-card transition-[box-shadow,transform] duration-300 ease-ios hover:-translate-y-0.5 hover:shadow-lift">
      <div
        className={`relative overflow-hidden bg-forest-100 ${full ? "aspect-[16/10]" : "aspect-[4/3]"}`}
      >
        <Image
          src={cover.url}
          alt={cover.alt}
          fill
          /* "full": dos columnas desde `md`. "compact": las medidas del
             carrusel de la portada (80 % del ancho en móvil, 46 % desde `sm`
             y 30,5 % desde `lg`). */
          sizes={
            full
              ? "(min-width: 1280px) 600px, (min-width: 768px) 46vw, 100vw"
              : "(min-width: 1280px) 372px, (min-width: 1024px) 29vw, (min-width: 640px) 44vw, 80vw"
          }
          className="object-cover transition-transform duration-[600ms] ease-ios group-hover:scale-[1.03]"
        />
        {experience.price_note && (
          <>
            {/* Fundido corto en el borde superior: separa el chip de precio de
                las fotos con cielo claro sin apagar el resto de la imagen. */}
            <div
              aria-hidden="true"
              className="photo-scrim-chip pointer-events-none absolute inset-x-0 top-0 h-1/2"
            />
            <span className="glass absolute left-3.5 top-3.5 rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold text-ink ring-1 ring-inset ring-white/40">
              {experience.price_note}
            </span>
          </>
        )}
      </div>

      <div className={`flex flex-1 flex-col ${full ? "p-7 sm:p-8" : "p-6"}`}>
        {/* En la rejilla compacta (4 columnas) unos títulos ocupan una línea y
            otros dos; reservar el alto de dos líneas alinea los chips y los
            textos de todas las tarjetas de la fila. */}
        <h3
          className={`leading-tight tracking-[-0.025em] text-ink ${full ? "text-[1.75rem]" : "min-h-[2.5em] text-[1.375rem]"}`}
        >
          {experience.name}
        </h3>

        {/* El chip va SIEMPRE en su propia línea: con títulos de largo distinto,
            ponerlo al lado del titular hacía que unas tarjetas lo mostraran
            inline y otras saltando de línea. */}
        {experience.duration && (
          <p className="mt-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-600/10 px-2.5 py-1 text-[0.75rem] font-semibold text-forest-700">
              <ClockIcon className="h-3.5 w-3.5" />
              {experience.duration}
            </span>
          </p>
        )}

        <p
          className={`mt-3 flex-1 leading-relaxed text-ink-muted ${full ? "text-[0.9375rem] sm:text-base" : "text-[0.9375rem]"}`}
        >
          {full
            ? (experience.description ?? experience.short_description)
            : experience.short_description}
        </p>

        <div className="mt-6">
          <WhatsAppButton
            message={experienceMessage(experience.name)}
            label="Consultar por WhatsApp"
            ariaLabel={`Consultar por WhatsApp sobre la experiencia ${experience.name}`}
            variant="soft"
            size="sm"
          />
        </div>
      </div>
    </article>
  );
}
