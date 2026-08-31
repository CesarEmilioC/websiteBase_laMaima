import type { Metadata, Viewport } from "next";

import { RootDocument, VIEWPORT } from "@/components/root-document";

/**
 * LAYOUT RAÍZ DEL PANEL DE ADMINISTRACIÓN.
 *
 * Desde que el sitio público es bilingüe no existe `app/layout.tsx`: cada árbol
 * pinta su propio `<html>` para poder declarar su idioma (ver
 * `components/root-document.tsx`). El panel es uno de esos árboles, y es
 * MONOLINGÜE EN ESPAÑOL a propósito: lo usa el equipo de La Maima, no los
 * huéspedes, y traducirlo solo añadiría superficie que mantener.
 *
 * Aparte de eso no pinta interfaz: aísla `/admin/*` del sitio público (que
 * tiene su propio armazón con cabecera, pie y botón de WhatsApp) y marca todo
 * el panel como no indexable. El `robots.ts` ya excluye /admin, pero la
 * metaetiqueta cubre el caso de un enlace directo compartido por error.
 */
export const metadata: Metadata = {
  title: {
    default: "Panel · La Maima",
    template: "%s · Panel La Maima",
  },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = VIEWPORT;

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument locale="es">{children}</RootDocument>;
}
