import type { Metadata, Viewport } from "next";

import { RootDocument, rootMetadata, VIEWPORT } from "@/components/root-document";

/**
 * LAYOUT RAÍZ DEL SITIO EN INGLÉS (`/en/...`).
 *
 * Es un layout RAÍZ, no uno anidado: al no existir `app/layout.tsx`, este es el
 * primero del árbol `/en` y por tanto el que pinta `<html lang="en">`. Ese es
 * justamente el motivo de la estructura — ver `components/root-document.tsx`.
 *
 * El árbol inglés es un ESPEJO EXACTO del español: mismas rutas con el prefijo
 * `/en`, incluidos los caminos de los documentos legales, que se quedan en
 * español (`/en/legal/privacidad`) para que cada par de páginas se corresponda
 * una a una y el `hreflang` sea trivial de comprobar.
 */
export const viewport: Viewport = VIEWPORT;

export function generateMetadata(): Promise<Metadata> {
  return rootMetadata("en");
}

export default function EnRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument locale="en">{children}</RootDocument>;
}
