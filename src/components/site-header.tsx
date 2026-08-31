"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CalendarIcon,
  ChevronRightIcon,
  CloseIcon,
  MenuIcon,
  WhatsAppIcon,
} from "./icons";
import { LanguageSwitch } from "./language-switch";
import { dict } from "@/lib/i18n";
import { localePath, splitLocale, type Locale } from "@/lib/i18n/config";
import { navLinks } from "@/lib/site";
import { generalMessage, whatsappUrl } from "@/lib/whatsapp";

type Props = {
  locale: Locale;
  /** Número en formato internacional sin signos, para el enlace wa.me. */
  whatsapp: string;
  addressLine: string;
  phoneDisplay: string;
  phoneHref: string;
};

/**
 * Barra de navegación: ISLA FLOTANTE de vidrio azul marino.
 *
 * ---------------------------------------------------------------------------
 * QUÉ CAMBIÓ Y POR QUÉ
 * ---------------------------------------------------------------------------
 * Antes era una barra a sangre pegada al borde superior. Ahora es una isla:
 * separada del borde (12 px, 16 px desde `sm`), con los mismos márgenes
 * laterales que el contenido —vive dentro de `.container-page`, así que su
 * borde izquierdo cae exactamente sobre el del titular de la portada— y con
 * esquinas de pastilla. La referencia es el otro proyecto del cliente
 * (gpiprofesionales.com), con una diferencia que pidió expresamente: MÁS
 * DELGADA en vertical. La de GPI ronda los 80 px; esta mide 56 en móvil y 60
 * desde `lg`, que es lo justo para el logotipo de 30 px y un objetivo táctil de
 * 44.
 *
 * Flotando, la barra deja ver la fotografía por los cuatro lados y deja de
 * leerse como el "techo" del navegador: es un objeto sobre la página. Por eso
 * necesita SOMBRA (una barra pegada al borde no la necesita) y un filete
 * interior claro que le dibuje el canto contra los cielos blancos de las fotos.
 *
 * El comportamiento al hacer scroll no cambia: el vidrio se vuelve más opaco en
 * cuanto la página se mueve, porque debajo puede pasar cualquier cosa.
 *
 * ---------------------------------------------------------------------------
 * ANCHOS
 * ---------------------------------------------------------------------------
 * En 1280 tienen que caber: logotipo (140), cuatro enlaces, el conmutador de
 * idioma (~100) y el botón "Reservar" (~120). La navegación va centrada con
 * `flex-1` y los dos extremos son `shrink-0`, así que el que cede espacio es
 * siempre el bloque central, que es el que puede. Los enlaces bajan de
 * `pl-4 pr-4` a `px-3.5` respecto a la barra anterior: son ~24 px recuperados
 * que se van al conmutador sin que la navegación se note más apretada.
 *
 * En móvil el conmutador se queda EN LA ISLA, junto al hamburguesa, y no dentro
 * del menú: cambiar de idioma es lo primero que busca quien entra y no debería
 * costar dos toques ni obligar a abrir un panel a pantalla completa. A 390 px
 * cabe porque ahí las banderas van solas, sin el código de dos letras.
 */
export function SiteHeader({
  locale,
  whatsapp,
  addressLine,
  phoneDisplay,
  phoneHref,
}: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const t = dict(locale);
  const links = navLinks(locale);
  const home = localePath(locale, "/");
  const bookHref = localePath(locale, "/alojamientos");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cierra el menú al navegar a otra ruta.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Bloquea el scroll del fondo mientras el menú móvil está abierto.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  // Cierra con Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  /**
   * ¿Este enlace apunta a la página actual?
   *
   * La comparación se hace sobre la ruta CANÓNICA (sin el prefijo `/en`) para
   * que la lógica sea una sola en los dos árboles: `/en/alojamientos` está
   * activo por lo mismo que `/alojamientos`.
   */
  const current = splitLocale(pathname ?? "/").path;
  const isActive = (href: string) => {
    const { path } = splitLocale(href);
    if (path === "/") return current === "/";
    if (path.startsWith("/#")) return false;
    return current.startsWith(path);
  };

  const dense = scrolled || menuOpen;

  return (
    <>
      {/* El `<header>` es el CARRIL fijo; la isla es el div de dentro. Se
          separan porque el carril tiene que ocupar todo el ancho para que la
          isla pueda centrarse con los mismos márgenes que el contenido, pero no
          debe pintar nada ni capturar clics fuera de ella (`pointer-events`). */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 pt-3 sm:pt-4">
        <div className="container-page">
          <div
            className={`pointer-events-auto flex h-14 items-center gap-3 rounded-[1.75rem] pl-4 pr-3 transition-[background-color,box-shadow] duration-300 ease-ios sm:gap-4 sm:pl-5 sm:pr-4 lg:h-[3.75rem] ${
              dense
                ? "glass-header-strong shadow-float ring-1 ring-inset ring-white/15"
                : "glass-header shadow-panel ring-1 ring-inset ring-white/10"
            }`}
          >
            {/* Logotipo oficial en blanco, sin filtros CSS. */}
            <Link
              href={home}
              aria-label={t.nav.homeAria}
              className="relative z-50 flex shrink-0 items-center rounded-lg transition-opacity duration-200 ease-ios hover:opacity-85"
            >
              <Image
                src="/logo-lamaima-blanco.png"
                alt="La Maima — Hotel Campestre"
                width={946}
                height={256}
                priority
                /* `sizes` es obligatorio aquí: sin él, Next arma el srcset con
                   el `width` declarado y su doble (946 y 1920 px) y un móvil con
                   DPR 1,75 se descarga la versión de 1920 px para un hueco de
                   133 px. Con la medida real declarada, el navegador pide el
                   recorte pequeño. */
                sizes="140px"
                className="h-[26px] w-auto sm:h-7 lg:h-[30px]"
              />
            </Link>

            {/* Navegación de escritorio, centrada */}
            <nav
              aria-label={t.nav.primary}
              className="hidden min-w-0 flex-1 justify-center lg:flex"
            >
              <ul className="flex items-center gap-0.5">
                {links.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        /* El relleno derecho compensa el espaciado de la última
                           letra: sin él la pastilla queda descentrada
                           ópticamente respecto al texto. */
                        className={`inline-flex items-center whitespace-nowrap rounded-full py-1.5 pl-3.5 pr-[calc(0.875rem+0.14em)] text-[0.6875rem] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 ease-ios ${
                          active
                            ? "bg-white/15 text-white"
                            : "text-white/75 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Extremo derecho: idioma, CTA y hamburguesa */}
            <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
              <LanguageSwitch locale={locale} idSuffix="nav" />

              {/* Pastilla blanca con texto azul: sobre el vidrio marino es la
                  opción de mayor contraste y la que mejor lee como acción
                  primaria. Oculta por debajo de `lg`, donde manda el botón
                  flotante de WhatsApp.

                  Lleva al LISTADO DE ALOJAMIENTOS, que es donde vive el motor de
                  reservas (calendario real + cálculo de la estadía), no a
                  WhatsApp: reservar es la experiencia central del sitio y el
                  chat sigue a un toque en el botón flotante, que el cliente pidió
                  mantener en todos los tamaños. Al ser un `next/link`, además,
                  Next precarga la ruta en cuanto el botón entra en pantalla. */}
              <Link
                href={bookHref}
                className="hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-[0.875rem] font-semibold text-brand-700 shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-50 active:scale-[0.97] lg:inline-flex"
              >
                <CalendarIcon className="h-4 w-4" />
                {t.nav.book}
              </Link>

              {/* Botón hamburguesa (móvil) */}
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-controls="menu-movil"
                aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
                className="relative z-50 -mr-1 inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition-[background-color,transform] duration-200 ease-ios hover:bg-white/10 active:scale-[0.94] lg:hidden"
              >
                {menuOpen ? (
                  <CloseIcon className="h-[1.4rem] w-[1.4rem]" />
                ) : (
                  <MenuIcon className="h-[1.4rem] w-[1.4rem]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Menú móvil.
          ------------------------------------------------------------------
          Va FUERA del <header> a propósito: el header aplica `backdrop-filter`,
          y un backdrop-filter convierte al elemento en bloque contenedor de sus
          descendientes `position: fixed`. Si el panel viviera dentro, su
          `inset-0` se resolvería contra la isla y quedaría sin alto.

          Con la isla flotante el panel también pasa a ser una LÁMINA flotante:
          arranca justo debajo de la isla, respeta sus mismos márgenes laterales
          y se redondea igual. Un panel a sangre debajo de una isla se veía como
          dos lenguajes distintos pegados. Detrás va un velo oscuro que apaga la
          página, para que la lámina se lea como una capa por encima y no como
          una sección más. */}
      <div
        aria-hidden={!menuOpen}
        hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
        className="fixed inset-0 z-40 bg-navy/45 backdrop-blur-sm lg:hidden"
      />
      <div
        id="menu-movil"
        hidden={!menuOpen}
        className="fixed inset-x-5 bottom-4 top-[4.75rem] z-40 flex flex-col overflow-hidden rounded-[1.75rem] bg-shell shadow-float ring-1 ring-inset ring-white/40 sm:inset-x-8 sm:top-[5.25rem] lg:hidden"
      >
        <nav
          aria-label={t.nav.primaryMobile}
          className="flex-1 overflow-y-auto px-4 pt-4"
        >
          <ul className="overflow-hidden rounded-panel bg-white shadow-card">
            {links.map((link, index) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[56px] items-center justify-between gap-4 px-5 py-4 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] transition-colors duration-150 active:bg-brand-600/[0.06] ${
                      index > 0 ? "border-t border-ink/[0.08]" : ""
                    } ${active ? "text-brand-700" : "text-ink"}`}
                  >
                    {link.label}
                    <ChevronRightIcon
                      className={`h-4 w-4 shrink-0 ${
                        active ? "text-brand-600" : "text-ink-muted/60"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 rounded-panel bg-white p-5 shadow-card">
            <p className="eyebrow text-brand-700">{t.nav.whereWeAre}</p>
            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-soft">
              {addressLine}
            </p>
            <a
              href={phoneHref}
              className="mt-3 inline-flex text-[0.9375rem] font-semibold text-brand-700"
            >
              {phoneDisplay}
            </a>
          </div>
        </nav>

        {/* Pie fijo del menú: primero reservar en línea (la acción central del
            sitio) y debajo, con menos peso, el atajo al chat. */}
        <div className="space-y-2.5 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Link
            href={bookHref}
            onClick={() => setMenuOpen(false)}
            className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-brand-600 px-6 py-3.5 text-[1.0625rem] font-semibold text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-700 active:scale-[0.98]"
          >
            <CalendarIcon className="h-5 w-5" />
            {t.nav.bookOnline}
          </Link>
          <a
            href={whatsappUrl(generalMessage(locale), whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-full bg-white px-6 py-3 text-[0.9375rem] font-semibold text-brand-700 shadow-card transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-50 active:scale-[0.98]"
          >
            <WhatsAppIcon className="h-[1.15rem] w-[1.15rem]" />
            {t.common.whatsapp}
          </a>
        </div>
      </div>
    </>
  );
}
