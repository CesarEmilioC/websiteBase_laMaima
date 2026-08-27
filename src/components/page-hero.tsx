import Image from "next/image";
import Link from "next/link";

import { SectionCurve } from "./section-curve";

type Crumb = {
  href: string;
  label: string;
};

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  image: string;
  imageAlt: string;
  breadcrumbs?: Crumb[];
  /**
   * Color de la sección que viene DEBAJO, como clase de Tailwind. La banda
   * cierra con una curva orgánica de ese color para que la foto no termine en
   * una línea recta. `null` la desactiva.
   */
  nextFill?: string | null;
  children?: React.ReactNode;
};

/**
 * Banda de encabezado con foto a sangre para las páginas internas.
 *
 * Titular sans grande estilo Apple sobre un degradado limpio concentrado en la
 * parte baja, para que la foto respire arriba (donde va el header de vidrio).
 * El borde inferior no es recto: lo cierra una curva asimétrica del color de
 * la sección siguiente (ver `SectionCurve`), igual que en la portada.
 *
 * El titular baja sus dos últimas palabras a una línea propia, más ligera y
 * desplazada: la misma jerarquía asimétrica que usa la portada.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  breadcrumbs,
  nextFill = "fill-cream",
  children,
}: Props) {
  const words = title.trim().split(/\s+/);
  const split = words.length >= 4;

  return (
    <section className="relative isolate flex min-h-[58vh] items-end overflow-hidden pt-24 sm:min-h-[64vh]">
      <Image
        src={image}
        alt={imageAlt}
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div aria-hidden="true" className="photo-scrim absolute inset-0 -z-10" />

      {/* El relleno inferior deja sitio a la curva (hasta ~96 px) para que no
          se coma la descripción. */}
      <div className="on-photo mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24 lg:px-10 lg:pb-32">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Ruta de navegación" className="mb-5">
            {/* La miga de pan es lo más alto de la banda: ahí el degradado casi
                no llega y puede caer sobre cielo o nubes. Va más opaca que el
                resto del texto secundario a propósito. */}
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.8125rem] text-white/90">
              {breadcrumbs.map((crumb, index) => {
                const last = index === breadcrumbs.length - 1;
                return (
                  <li key={crumb.href} className="flex items-center gap-1.5">
                    {index > 0 && (
                      <span aria-hidden="true" className="text-white/60">
                        ›
                      </span>
                    )}
                    {last ? (
                      <span aria-current="page" className="text-white/85">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="transition-colors duration-200 hover:text-white"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        {eyebrow && (
          <p className="eyebrow mb-4 inline-flex items-center rounded-full bg-white/22 px-3.5 py-1.5 text-white ring-1 ring-inset ring-white/30 backdrop-blur-md">
            {eyebrow}
          </p>
        )}

        <h1 className="tracking-display max-w-3xl text-[2.375rem] leading-[1.03] text-white sm:text-5xl lg:text-[4rem]">
          {split ? (
            <>
              <span className="block">{words.slice(0, -2).join(" ")}</span>
              <span className="block font-normal text-white/85 sm:pl-[1.1em]">
                {words.slice(-2).join(" ")}
              </span>
            </>
          ) : (
            title
          )}
        </h1>

        {description && (
          <p className="mt-6 max-w-2xl border-l border-white/30 pl-5 text-[1.0625rem] leading-relaxed text-white/90 sm:ml-[8%] sm:text-lg">
            {description}
          </p>
        )}

        {children && <div className="mt-8">{children}</div>}
      </div>

      {nextFill && (
        <SectionCurve variant="onda" fill={nextFill} at="abajo" flip />
      )}
    </section>
  );
}
