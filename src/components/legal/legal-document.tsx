import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { dict } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";
import { breadcrumbList } from "@/lib/seo";
import { legalLinks } from "@/lib/site";

/**
 * Armazón compartido de los tres documentos legales
 * (privacidad, términos y cancelación).
 *
 * Las tres páginas son texto largo y su única diferencia real es el contenido,
 * así que el encabezado, la tabla de contenido, la caja de lectura y la
 * navegación entre documentos viven aquí una sola vez.
 *
 * El índice NO se escribe a mano: se deriva del mismo array de secciones que
 * se renderiza, de modo que nunca puede quedar desincronizado con el cuerpo
 * (un enlace roto en un documento legal es peor que no tener índice).
 */

export type LegalSection = {
  /** Ancla de la sección: se usa en el índice y en `id` del <section>. */
  id: string;
  title: string;
  body: React.ReactNode;
};

type Props = {
  locale: Locale;
  /** Título del documento (h1). */
  title: string;
  /** Ruta CANÓNICA de este documento (sin prefijo de idioma): se usa para no
   *  enlazarlo consigo mismo y para la miga de pan. */
  current: string;
  /** Entradilla bajo el título: de qué trata el documento, en una frase. */
  intro: string;
  /** Fecha de la última revisión, ya formateada en español. */
  updated: string;
  sections: LegalSection[];
  /** Cierre opcional: canal de contacto, notas finales. */
  footnote?: React.ReactNode;
};

export function LegalDocument({
  locale,
  title,
  current,
  intro,
  updated,
  sections,
  footnote,
}: Props) {
  const t = dict(locale);
  const others = legalLinks(locale).filter((link) => link.path !== current);

  return (
    <>
      {/* Encabezado limpio (sin foto): un documento legal se lee, no se
          contempla. El relleno superior es el mismo de la ficha de alojamiento
          —el que deja libre el header fijo— y el fondo, el lienzo `shell`: así
          los únicos blancos de la página son los paneles de lectura. */}
      <section className="bg-shell pb-10 pt-28 sm:pt-32 lg:pt-36">
        <div className="container-page">
          <nav aria-label={t.nav.breadcrumb}>
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.8125rem] text-ink-muted">
              <li>
                <Link
                  href={localePath(locale, "/")}
                  className="transition-colors duration-200 hover:text-brand-600"
                >
                  {t.nav.home}
                </Link>
              </li>
              <li aria-hidden="true" className="text-ink-muted/50">
                ›
              </li>
              <li className="text-ink" aria-current="page">
                {title}
              </li>
            </ol>
          </nav>

          <p className="eyebrow mt-6 text-brand-700">{t.legal.eyebrow}</p>
          <h1 className="tracking-display mt-3 max-w-3xl text-[2.125rem] leading-[1.08] text-ink sm:text-[2.75rem] lg:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-ink-muted">
            {intro}
          </p>
          <p className="glass-sand mt-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium text-ink-soft">
            {t.legal.updated(updated)}
          </p>
        </div>
      </section>

      {/* Cuerpo ------------------------------------------------------------ */}
      <section className="section-y-sm bg-sand-soft">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Índice: en pantalla ancha acompaña la lectura pegado arriba;
                en móvil se pliega para no empujar el texto media pantalla. */}
            <nav
              aria-label={t.legal.contentsNav}
              className="lg:col-span-4 lg:order-2"
            >
              <details className="group rounded-panel bg-white p-5 shadow-card ring-1 ring-ink/[0.05] lg:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[0.9375rem] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {t.legal.contentsMobile}
                  <span
                    aria-hidden="true"
                    className="text-ink-muted transition-transform duration-200 ease-ios group-open:rotate-180"
                  >
                    ⌄
                  </span>
                </summary>
                <ol className="mt-4 space-y-2.5 border-t border-ink/[0.07] pt-4 text-[0.9375rem]">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="text-ink-muted transition-colors duration-200 hover:text-brand-700"
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>

              <div className="hidden lg:sticky lg:top-28 lg:block">
                <div className="rounded-panel bg-white p-6 shadow-card ring-1 ring-ink/[0.05]">
                  {/* `.eyebrow` fija la familia SANS: es un rótulo de
                      interfaz, no un titular, y a 13 px la serifa de display
                      con peso 600 solo se ve emborronada. */}
                  <h2 className="eyebrow text-ink-muted">{t.legal.contents}</h2>
                  <ol className="mt-4 space-y-2.5 text-[0.9375rem]">
                    {sections.map((section) => (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className="text-ink-muted transition-colors duration-200 hover:text-brand-700"
                        >
                          {section.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </nav>

            <article className="lg:col-span-8 lg:order-1">
              <div className="rounded-panel bg-white p-6 shadow-panel ring-1 ring-ink/[0.05] sm:p-9 lg:p-11">
                <div className="legal-prose max-w-[68ch]">
                  {sections.map((section, index) => (
                    <section
                      key={section.id}
                      id={section.id}
                      className={
                        index > 0
                          ? "mt-11 scroll-mt-28 border-t border-ink/[0.07] pt-9"
                          : "scroll-mt-28"
                      }
                    >
                      <h2 className="tracking-editorial text-[1.375rem] text-ink sm:text-[1.5rem]">
                        {section.title}
                      </h2>
                      <div className="mt-4">{section.body}</div>
                    </section>
                  ))}
                </div>

                {footnote && (
                  <div className="legal-prose mt-11 max-w-[68ch] border-t border-ink/[0.07] pt-8 text-[0.9375rem] text-ink-muted">
                    {footnote}
                  </div>
                )}
              </div>

              {/* Los tres documentos se citan entre sí: conviene poder saltar
                  de uno a otro sin volver al pie de página. */}
              <nav
                aria-label={t.legal.otherDocs}
                className="mt-8 grid gap-3 sm:grid-cols-2"
              >
                {others.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between gap-4 rounded-card bg-white px-5 py-4 text-[0.9375rem] font-semibold text-ink shadow-card ring-1 ring-ink/[0.05] transition-[background-color,color,transform] duration-200 ease-ios hover:bg-brand-50 hover:text-brand-700 active:scale-[0.99]"
                  >
                    {link.label}
                    <span aria-hidden="true">›</span>
                  </Link>
                ))}
              </nav>
            </article>
          </div>
        </div>
      </section>

      {/* La misma miga de pan que se pinta arriba, en formato legible por
          máquina. Se emite aquí, en el armazón compartido, para que los tres
          documentos la tengan sin repetirla en cada página. */}
      <JsonLd
        graph={[
          breadcrumbList([
            { name: t.nav.home, path: localePath(locale, "/") },
            { name: title, path: localePath(locale, current) },
          ]),
        ]}
      />
    </>
  );
}

/**
 * Dato que todavía debe confirmar La Maima (NIT, RNT, correo oficial, plazos
 * de cancelación…).
 *
 * Se marca EN AMARILLO y con texto explícito a propósito: el resto del
 * documento es texto definitivo, y quien lo revise —el cliente, la agencia o
 * el analista de la pasarela— tiene que distinguir de un vistazo lo que falta
 * de lo que ya está cerrado. Inventar un NIT o un plazo de reembolso sería
 * mucho peor que dejarlo señalado.
 */
export function Pending({
  children,
  locale = "es",
}: {
  /** Que falta, en texto plano: la marca lo envuelve con su propio rotulo. */
  children: string;
  locale?: Locale;
}) {
  return (
    <mark className="mx-0.5 rounded-md bg-amber-100/80 px-1.5 py-0.5 font-medium text-amber-900 ring-1 ring-inset ring-amber-500/30">
      {dict(locale).legal.pending(children)}
    </mark>
  );
}

/**
 * Aviso de bloque para las secciones cuyo CONTENIDO entero depende del
 * cliente (por ejemplo, los porcentajes de reembolso). La estructura queda
 * redactada y lista; solo falta rellenar las cifras.
 */
export function PendingBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="my-5 rounded-card bg-amber-50 p-5 ring-1 ring-inset ring-amber-500/25">
      <p className="text-[0.9375rem] font-semibold text-amber-900">{title}</p>
      <div className="legal-prose legal-prose-amber mt-3 text-[0.9375rem]">
        {children}
      </div>
    </div>
  );
}
