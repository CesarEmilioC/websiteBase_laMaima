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
import { NAV_LINKS } from "@/lib/site";
import { GENERAL_MESSAGE, whatsappUrl } from "@/lib/whatsapp";

type Props = {
  /** Número en formato internacional sin signos, para el enlace wa.me. */
  whatsapp: string;
  addressLine: string;
  phoneDisplay: string;
  phoneHref: string;
};

/**
 * Header fijo con vidrio esmerilado AZUL MARINO.
 *
 * La ESTRUCTURA es la que el cliente aprobó del preview (logo a la izquierda,
 * navegación centrada, "Reservar" a la derecha, hamburguesa en móvil) y no se
 * toca. Lo que cambia con la identidad nueva:
 *
 *  - El vidrio pasa de verde bosque a azul marino (`--color-navy`, derivado
 *    del azul primario). Se eligió OSCURO y no claro mirando la portada: el
 *    hero es una fotografía a sangre que va del cielo blanco al follaje en
 *    sombra, y una barra clara obligaría a texto oscuro que se perdería sobre
 *    las zonas luminosas. Sobre marino translúcido el logotipo blanco y los
 *    enlaces se leen igual de bien sobre cualquier foto y sobre las secciones
 *    claras de las páginas internas.
 *  - El logotipo ya no es el PNG azul pasado por `brightness(0) invert`: ahora
 *    es el archivo BLANCO oficial (`logo-lamaima-blanco.png`), un lockup
 *    horizontal compuesto a partir del original de alta resolución —monograma
 *    a la izquierda y wordmark "LA MAIMA" a la derecha—. Los archivos que
 *    entregó el cliente son lockups VERTICALES con el subtítulo "Hotel
 *    Campestre" debajo: a la altura de un nav ese subtítulo mide cuatro
 *    píxeles y no se lee, así que aquí se usa la versión sin él (el lockup
 *    completo, con subtítulo, vive en el pie, donde sí hay sitio).
 *  - Los enlaces llevan versalitas con espaciado amplio: el mismo registro
 *    tipográfico que las etiquetas del resto del sitio.
 *
 * Breakpoint único en `lg` (1024px): por debajo se muestra el hamburguesa;
 * por encima, la navegación completa y el CTA "Reservar" del nav. El botón
 * flotante de WhatsApp (`WhatsAppFloat`) es aparte y vive en todos los
 * tamaños de pantalla —incluido cuando este CTA de escritorio también está
 * visible—, por pedido explícito del cliente final.
 *
 * Es un componente cliente (usa `usePathname` y estado de scroll/menú), así
 * que no puede leer Supabase directamente: recibe los datos de contacto ya
 * resueltos (con fallback aplicado) desde `(public)/layout.tsx`, un server
 * component que sí llama a `getContactInfo()`.
 */
export function SiteHeader({
  whatsapp,
  addressLine,
  phoneDisplay,
  phoneHref,
}: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false;
    return pathname.startsWith(href);
  };

  const dense = scrolled || menuOpen;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300 ease-ios ${
          dense
            ? "glass-header-strong shadow-[0_1px_0_0_rgb(255_255_255/0.12)]"
            : "glass-header shadow-[0_1px_0_0_rgb(255_255_255/0.07)]"
        }`}
      >
        <div className="container-page flex h-16 items-center gap-4 md:h-[74px]">
          {/* Logotipo oficial en blanco, sin filtros CSS. */}
          <Link
            href="/"
            aria-label="La Maima — Inicio"
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
              className="h-[30px] w-auto md:h-9"
            />
          </Link>

          {/* Navegación de escritorio, centrada */}
          <nav
            aria-label="Principal"
            className="hidden flex-1 justify-center lg:flex"
          >
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      /* El relleno derecho compensa el espaciado de la última
                         letra: sin él la pastilla queda descentrada
                         ópticamente respecto al texto. */
                      className={`inline-flex items-center rounded-full py-2 pl-4 pr-[calc(1rem+0.14em)] text-[0.6875rem] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 ease-ios ${
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

          {/* CTA de escritorio */}
          <div className="ml-auto flex items-center gap-1 lg:ml-0">
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
              href="/alojamientos"
              className="hidden shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[0.9375rem] font-semibold text-brand-700 shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-50 active:scale-[0.97] lg:inline-flex"
            >
              <CalendarIcon className="h-[1.05rem] w-[1.05rem]" />
              Reservar
            </Link>

            {/* Botón hamburguesa (móvil) */}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="menu-movil"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              className="relative z-50 -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition-[background-color,transform] duration-200 ease-ios hover:bg-white/10 active:scale-[0.94] lg:hidden"
            >
              {menuOpen ? (
                <CloseIcon className="h-[1.4rem] w-[1.4rem]" />
              ) : (
                <MenuIcon className="h-[1.4rem] w-[1.4rem]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Panel del menú móvil.
          Va FUERA del <header> a propósito: el header aplica `backdrop-filter`,
          y un backdrop-filter convierte al elemento en bloque contenedor de sus
          descendientes `position: fixed`. Si el panel viviera dentro del
          header, su `inset-0` se resolvería contra la barra de 64px en vez de
          contra la ventana y quedaría sin alto. */}
      <div
        id="menu-movil"
        hidden={!menuOpen}
        /* `top` acompaña la altura del header (64px, 74px desde `md`): el
           header es translúcido, así que un desfase dejaría ver la franja
           clara del panel a través del vidrio marino. */
        className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col bg-shell md:top-[74px] lg:hidden"
      >
        <nav
          aria-label="Principal (móvil)"
          className="flex-1 overflow-y-auto px-5 pt-6"
        >
          <ul className="overflow-hidden rounded-panel bg-white shadow-card">
            {NAV_LINKS.map((link, index) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[60px] items-center justify-between gap-4 px-5 py-4 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] transition-colors duration-150 active:bg-brand-600/[0.06] ${
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

          <div className="mt-5 rounded-panel bg-white p-5 shadow-card">
            <p className="eyebrow text-brand-700">Dónde estamos</p>
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
        <div className="space-y-2.5 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <Link
            href="/alojamientos"
            onClick={() => setMenuOpen(false)}
            className="flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-brand-600 px-6 py-4 text-[1.0625rem] font-semibold text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-700 active:scale-[0.98]"
          >
            <CalendarIcon className="h-5 w-5" />
            Reservar en línea
          </Link>
          <a
            href={whatsappUrl(GENERAL_MESSAGE, whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-full bg-white px-6 py-3.5 text-[0.9375rem] font-semibold text-brand-700 shadow-card transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-50 active:scale-[0.98]"
          >
            <WhatsAppIcon className="h-[1.15rem] w-[1.15rem]" />
            Escribir por WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}
