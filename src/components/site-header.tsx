"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronRightIcon, CloseIcon, MenuIcon, WhatsAppIcon } from "./icons";
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
 * Header fijo con vidrio esmerilado OSCURO (verde bosque), al estilo de la
 * barra de navegación de iOS/Apple: siempre translúcido, nunca transparente
 * del todo ni claro. Sobre ese fondo oscuro el logo va en blanco (filtro CSS
 * `brightness(0) invert(1)` sobre el PNG azul, que es de un solo tono), los
 * links en blanco con pastilla translúcida en el estado activo y el CTA como
 * pastilla blanca con texto verde. Al hacer scroll el vidrio gana opacidad y
 * el filete inferior claro se hace más visible.
 *
 * Breakpoint único en `lg` (1024px): por debajo se muestran el hamburguesa y
 * el botón flotante de WhatsApp; por encima, la navegación completa y el CTA
 * "Reservar" del nav (y el flotante desaparece). Así nunca hay dos CTA a la
 * vez ni ninguno.
 *
 * En móvil el menú se despliega a pantalla completa con una lista agrupada
 * estilo iOS: filas de 60px, separadores hairline y CTA fijo abajo. El panel
 * se mantiene claro a propósito, para que contraste de forma deliberada con
 * la barra oscura que permanece visible encima.
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
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 md:h-[72px] lg:px-10">
          {/* Logo */}
          <Link
            href="/"
            aria-label="La Maima — Inicio"
            className="relative z-50 flex shrink-0 items-center rounded-xl transition-transform duration-200 ease-ios active:scale-[0.97]"
          >
            <Image
              src="/logo-lamaima.png"
              alt="La Maima — Hotel Campestre"
              width={1668}
              height={707}
              priority
              /* El PNG es azul de un solo tono sobre transparente: el filtro
                 lo deja blanco limpio, sin necesidad de un segundo asset. */
              className="h-11 w-auto brightness-0 invert md:h-14"
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
                      className={`inline-flex items-center rounded-full px-4 py-2 text-[0.9375rem] transition-colors duration-200 ease-ios ${
                        active
                          ? "bg-white/15 font-semibold text-white"
                          : "font-medium text-white/80 hover:bg-white/10 hover:text-white"
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
            {/* Pastilla blanca con texto verde: sobre el vidrio oscuro es la
                opción de mayor contraste y la que mejor lee como acción
                primaria. Un verde sobre verde se apagaba. Oculto por debajo
                de `lg`, donde manda el botón flotante de WhatsApp. */}
            <a
              href={whatsappUrl(GENERAL_MESSAGE, whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[0.9375rem] font-semibold text-forest-700 shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-forest-50 active:scale-[0.97] lg:inline-flex"
            >
              <WhatsAppIcon className="h-[1.05rem] w-[1.05rem]" />
              Reservar
            </a>

            {/* Botón hamburguesa (móvil) */}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="menu-movil"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              className="relative z-50 -mr-1.5 inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition-[background-color,transform] duration-200 ease-ios hover:bg-white/10 active:scale-[0.94] lg:hidden"
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
        /* `top` acompaña la altura del header (64px, 72px desde `md`): el
           header es translúcido, así que un desfase dejaría ver la franja
           clara del panel a través del vidrio oscuro. */
        className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col bg-cream md:top-[72px] lg:hidden"
      >
        <nav
          aria-label="Principal (móvil)"
          className="flex-1 overflow-y-auto px-4 pt-5"
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
                    className={`flex min-h-[60px] items-center justify-between gap-4 px-5 py-4 text-[1.0625rem] font-semibold tracking-[-0.02em] transition-colors duration-150 active:bg-black/[0.04] ${
                      index > 0 ? "border-t border-black/[0.07]" : ""
                    } ${active ? "text-forest-700" : "text-ink"}`}
                  >
                    {link.label}
                    <ChevronRightIcon
                      className={`h-4 w-4 shrink-0 ${
                        active ? "text-forest-600" : "text-ink-muted/60"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 rounded-panel bg-white p-5 shadow-card">
            <p className="text-[0.8125rem] font-semibold text-ink-muted">
              Dónde estamos
            </p>
            <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-soft">
              {addressLine}
            </p>
            <a
              href={phoneHref}
              className="mt-3 inline-flex text-[0.9375rem] font-semibold text-forest-600"
            >
              {phoneDisplay}
            </a>
          </div>
        </nav>

        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <a
            href={whatsappUrl(GENERAL_MESSAGE, whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-forest-600 px-6 py-4 text-[1.0625rem] font-semibold text-white shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-forest-700 active:scale-[0.98]"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Reservar por WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}
