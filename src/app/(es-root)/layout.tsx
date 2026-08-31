import type { Metadata, Viewport } from "next";

import { RootDocument, rootMetadata, VIEWPORT } from "@/components/root-document";

/**
 * LAYOUT RAÍZ DEL SITIO EN ESPAÑOL (la raíz del dominio).
 *
 * El sitio tiene tres layouts raíz —este, `app/en/layout.tsx` y
 * `app/admin/layout.tsx`— porque solo un layout raíz puede pintar el elemento
 * `<html>`, y cada árbol necesita declarar su propio `lang`. Ver la nota larga
 * en `components/root-document.tsx`.
 *
 * El grupo de rutas `(es-root)` no añade nada a las direcciones: el español
 * sigue viviendo en la raíz (`/alojamientos`, no `/es/alojamientos`), que era
 * la condición de partida para no tirar por la borda el SEO ya construido.
 *
 * La cabecera, el pie y el resto del armazón NO están aquí sino en
 * `(site)/layout.tsx`, un nivel más abajo: así la página 404 —que es hermana de
 * `(site)` y no hija— puede pintarse a pantalla completa sin nav ni pie, como
 * estaba antes.
 */
export const viewport: Viewport = VIEWPORT;

export function generateMetadata(): Promise<Metadata> {
  return rootMetadata("es");
}

export default function EsRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument locale="es">{children}</RootDocument>;
}
