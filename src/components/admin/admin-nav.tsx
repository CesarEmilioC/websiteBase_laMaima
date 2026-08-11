"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navegación del panel: barra lateral en escritorio y fila de pestañas
 * desplazable en móvil (patrón de "tab bar" de iOS).
 */

export type NavItem = {
  href: string;
  label: string;
  icon: "home" | "bed" | "compass" | "calendar" | "lock" | "text";
};

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Resumen", icon: "home" },
  { href: "/admin/alojamientos", label: "Alojamientos", icon: "bed" },
  { href: "/admin/experiencias", label: "Experiencias", icon: "compass" },
  { href: "/admin/reservas", label: "Reservas", icon: "calendar" },
  { href: "/admin/bloqueos", label: "Bloqueos", icon: "lock" },
  { href: "/admin/contenido", label: "Contenido", icon: "text" },
];

const PATHS: Record<NavItem["icon"], string> = {
  home: "M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1v-8.5Z",
  bed: "M3 17v-6h13a4 4 0 0 1 4 4v2M3 17v3M21 17v3M3 11V7M7 11a2 2 0 1 1 4 0",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm2.8-11.8-1.6 4.6-4.6 1.6 1.6-4.6 4.6-1.6Z",
  calendar:
    "M4 8h16M7 4v3m10-3v3M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z",
  text: "M5 6h14M5 11h14M5 16h9",
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ icon }: { icon: NavItem["icon"] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[1.125rem] w-[1.125rem] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[icon]} />
    </svg>
  );
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Escritorio: barra lateral */}
      <nav aria-label="Secciones del panel" className="hidden lg:block">
        <ul className="space-y-1">
          {ADMIN_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[0.9375rem] font-medium transition-colors duration-200 ${
                    active
                      ? "bg-forest-600 text-white shadow-pill"
                      : "text-ink-soft hover:bg-black/[0.05] hover:text-ink"
                  }`}
                >
                  <NavIcon icon={item.icon} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Móvil y tableta: pestañas horizontales */}
      <nav
        aria-label="Secciones del panel"
        className="-mx-4 overflow-x-auto px-4 lg:hidden"
      >
        <ul className="flex w-max gap-2 pb-1">
          {ADMIN_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[0.875rem] font-semibold transition-colors duration-200 ${
                    active
                      ? "bg-forest-600 text-white shadow-pill"
                      : "bg-black/[0.05] text-ink-soft"
                  }`}
                >
                  <NavIcon icon={item.icon} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
