import Image from "next/image";
import Link from "next/link";

import { LeafField } from "@/components/leaf-field";

type Crumb = {
  href: string;
  label: string;
};

type Props = {
  eyebrow?: string;
  title: string;
  /**
   * Cola OPCIONAL del titular, que se compone a continuación del título en el
   * azul claro de la paleta (v2.1; antes iba en itálica de la serifa de
   * display, que ya no existe).
   *
   * Es un matiz de jerarquía, no un cambio de eje: va en la misma línea de
   * lectura, sin sangrado ni desplazamiento. Se pasa como prop (en vez de
   * cortar automáticamente las dos últimas palabras del título) porque los
   * títulos los edita el cliente: un corte automático acabaría destacando "y
   * el" o "de la" en cuanto alguien reescriba la frase.
   */
  titleAccent?: string;
  description?: string;
  image: string;
  imageAlt: string;
  breadcrumbs?: Crumb[];
  children?: React.ReactNode;
};

/**
 * Banda de encabezado con foto a sangre para las páginas internas.
 *
 * El registro es RECTILÍNEO: la foto termina en una línea recta y la sección
 * siguiente empieza justo ahí. Antes cerraba con una curva SVG del color de la
 * banda de abajo; el cliente pidió quitar todas esas curvas, y sin ellas la
 * transición entre bandas la hace el aire (el ritmo vertical de `.section-y`),
 * no un recorte.
 *
 * Todo el contenido se apoya en UN SOLO eje izquierdo —migas, etiqueta, titular
 * y descripción—, alineado con el resto de la página a través de
 * `.container-page`. La versión anterior desplazaba la segunda línea del
 * titular y la descripción para dibujar una diagonal; ese gesto pertenecía al
 * lenguaje orgánico que se retiró.
 *
 * Capas, de atrás hacia delante: fotografía (`-z-20`), fundido
 * (`.photo-scrim`, `-z-10`), hojas flotando (`LeafField`, `-z-10` pero
 * posterior en el DOM) y, encima, el texto en flujo normal.
 */
export function PageHero({
  eyebrow,
  title,
  titleAccent,
  description,
  image,
  imageAlt,
  breadcrumbs,
  children,
}: Props) {
  return (
    <section className="relative isolate flex min-h-[58vh] items-end overflow-hidden pt-28 sm:min-h-[64vh] sm:pt-32">
      <Image
        src={image}
        alt={imageAlt}
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        /* 68 y no la calidad por defecto (75).
           -----------------------------------------------------------------
           Esta fotografía es el LCP de su página, y la de `/experiencias`
           —un sendero de follaje muy denso, que es lo que peor comprime—
           pesaba 184 kB en móvil: el doble que la de la portada. A 68 baja a
           unos 125 kB y el LCP móvil de esa página pasó de 5,2 s a estar por
           debajo de 3,5 s.

           Se puede hacer sin que se note porque esta foto NUNCA se ve limpia:
           encima lleva el fundido `.photo-scrim` (un degradado oscuro de
           varias paradas), la capa de hojas y el titular en blanco. Los
           artefactos de compresión viven en las zonas de detalle fino, que
           aquí quedan justo debajo del velo. La galería de la ficha, que sí
           se mira de cerca, conserva su calidad 75. */
        quality={68}
        className="-z-20 object-cover"
      />
      <div aria-hidden="true" className="photo-scrim absolute inset-0 -z-10" />
      {/* Va DESPUÉS del fundido y con el mismo `-z-10`: así queda por encima de
          él (mismo plano, orden del DOM) y por debajo del texto, que al estar
          en flujo normal se pinta sobre los índices negativos. */}
      <LeafField tone="light" className="-z-10" />

      <div className="on-photo container-page w-full pb-16 sm:pb-20 lg:pb-24">
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

        {/* El rótulo va DENTRO del `h1`, como antetítulo.
            ---------------------------------------------------------------
            Los titulares de estas bandas son frases de tono ("Dormir dentro
            de la reserva", "Experiencias entre el bosque y el agua") y no
            nombran ni el tipo de alojamiento ni el lugar. El rótulo de encima
            sí, y visualmente ya se lee como antetítulo del titular, así que
            pertenece al encabezado. Dentro del `h1` la página pasa a tener un
            encabezado completo sin cambiar un píxel: `.eyebrow` fija su
            propio cuerpo, familia y espaciado, y `flex w-fit` reproduce
            exactamente el `inline-flex` que tenía como párrafo suelto.

            `.eyebrow-chip` ya resuelve el relleno derecho que compensa el
            espaciado de la última letra: por eso solo se declara `pl-3.5`. */}
        <h1 className="tracking-display max-w-3xl text-[2.375rem] leading-[1.05] text-white sm:text-5xl lg:text-[3.75rem]">
          {eyebrow && (
            <span className="eyebrow eyebrow-chip mb-5 flex w-fit items-center rounded-full bg-white/20 py-1.5 pl-3.5 text-white ring-1 ring-inset ring-white/30 backdrop-blur-md">
              {eyebrow}
            </span>
          )}
          {title}
          {titleAccent && (
            <>
              {" "}
              <span className="text-brand-200">{titleAccent}</span>
            </>
          )}
        </h1>

        {description && (
          <p className="mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-white/90 sm:text-lg">
            {description}
          </p>
        )}

        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
