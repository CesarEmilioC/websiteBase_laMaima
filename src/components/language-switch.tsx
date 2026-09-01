"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FlagES, FlagGB } from "./flags";
import { dict } from "@/lib/i18n";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALES,
  localePath,
  splitLocale,
  type Locale,
} from "@/lib/i18n/config";

type Props = {
  /** Idioma de la página que se está viendo. */
  locale: Locale;
  /** Variante visual: sobre el vidrio marino del nav o sobre fondo claro. */
  tone?: "onDark" | "onLight";
  /** Sufijo para los `id` internos de las banderas (ver `flags.tsx`). */
  idSuffix?: string;
  className?: string;
};

/**
 * Conmutador de idioma: pastilla segmentada con las dos banderas.
 *
 * CONSERVA LA PÁGINA. No manda a la portada del otro idioma —que es lo que hace
 * la mitad de los sitios bilingües y lo que más molesta—: lee la dirección
 * actual, le quita el prefijo de idioma y compone la misma ruta en el otro
 * árbol. Quien está mirando la ficha del Mirador en español aterriza en la
 * ficha del Mirador en inglés.
 *
 * SON ENLACES DE VERDAD, no botones con JavaScript: cada bandera es un `<a>`
 * con `href` a una página que existe, así que funciona sin JS, se puede abrir en
 * otra pestaña y los rastreadores encuentran el árbol inglés desde cualquier
 * página del español (que es, además, media señal de `hreflang` gratis).
 *
 * LA COOKIE es lo único que necesita JavaScript, y solo recuerda la elección
 * para la próxima visita a la portada (ver `middleware.ts`). Si no se ejecuta,
 * el conmutador sigue funcionando: simplemente no se acuerda.
 *
 * `prefetch={false}` a propósito: son dos enlaces siempre visibles en la barra
 * y precargar el árbol entero del otro idioma en cada página es tráfico que casi
 * nadie va a usar.
 */
export function LanguageSwitch({
  locale,
  tone = "onDark",
  idSuffix = "a",
  className = "",
}: Props) {
  const pathname = usePathname();
  const t = dict(locale);

  /* La ruta canónica (en su forma española, sin prefijo) de la página actual.
     Si por lo que sea `usePathname` aún no resolvió, se cae a la portada. */
  const { path } = splitLocale(pathname ?? "/");

  function remember(next: Locale) {
    try {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    } catch {
      /* Cookies bloqueadas: el conmutador sigue navegando igual. */
    }
  }

  const dark = tone === "onDark";

  return (
    <div
      role="group"
      aria-label={t.locale.group}
      className={`flex shrink-0 items-center gap-0.5 rounded-full p-0.5 ${
        dark
          ? "bg-white/10 ring-1 ring-inset ring-white/15"
          : "bg-ink/[0.06] ring-1 ring-inset ring-ink/[0.08]"
      } ${className}`}
    >
      {LOCALES.map((option) => {
        const active = option === locale;
        const Flag = option === "es" ? FlagES : FlagGB;

        /* El nombre accesible EMPIEZA por el texto visible ("ES" / "EN").
           No es adorno: la regla `label-content-name-mismatch` de axe —y, de
           paso, quien dicta "haz clic en EN" a un control por voz— exige que el
           rótulo hablado contenga lo que se ve escrito. "Cambiar a inglés" no
           contiene "EN" por ningún lado, así que el código corto va delante y
           la frase completa detrás. */
        const label = `${t.locale.short[option]} — ${t.locale.switchTo[option]}`;

        return (
          <Link
            key={option}
            href={localePath(option, path)}
            hrefLang={option}
            prefetch={false}
            onClick={() => remember(option)}
            aria-label={label}
            aria-current={active ? "true" : undefined}
            className={`group inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.08em] transition-[background-color,color] duration-200 ease-ios sm:pr-2.5 ${
              active
                ? dark
                  ? "bg-white/90 text-brand-800"
                  : "bg-white text-brand-700 shadow-card"
                : dark
                  ? "text-white/90 hover:bg-white/10 hover:text-white"
                  : "text-ink-muted hover:bg-white/70 hover:text-ink"
            }`}
          >
            {/* 18×12: la proporción 3:2 real de las dos banderas. El filete
                interior las despega del fondo claro de la pastilla activa.

                LA OPACIDAD DEL "APAGADO" VIVE AQUÍ, en la bandera, y no en el
                enlace entero. Antes el enlace llevaba `opacity-70` y el texto
                `text-white/60`: las dos alfas se MULTIPLICAN (≈0,42) y el código
                de idioma inactivo caía a 1,78:1 sobre el vidrio marino, muy por
                debajo del 4,5:1 exigido. La bandera es decorativa —el SVG va
                con `aria-hidden`, ver `flags.tsx`— y no está sujeta al mínimo
                de contraste de TEXTO, así que se queda con el tono apagado y el
                código de idioma recupera el suyo. La distinción
                activo/inactivo la sigue marcando, sobre todo, la pastilla
                blanca. */}
            <span
              className={`block h-3 w-[1.125rem] overflow-hidden rounded-[2px] ring-1 ring-inset ring-black/15 transition-opacity duration-200 ease-ios ${
                active ? "" : "opacity-70 group-hover:opacity-100"
              }`}
            >
              <Flag className="h-full w-full" idSuffix={`${idSuffix}-${option}`} />
            </span>
            {/* El código de dos letras se ve SIEMPRE.
                ----------------------------------------------------------
                Antes se escondía por debajo de `sm` para que la isla del nav
                cupiera en 390 px con el logotipo y el hamburguesa. Ya no hace
                falta: en móvil el conmutador vive dentro del menú, donde el
                sitio sobra, y ahí una bandera suelta se lee peor que
                "🇬🇧 EN" — sobre todo la del Reino Unido, que a 18 px de ancho
                mucha gente no distingue de cualquier otra tricolor. */}
            <span>{t.locale.short[option]}</span>
          </Link>
        );
      })}
    </div>
  );
}
