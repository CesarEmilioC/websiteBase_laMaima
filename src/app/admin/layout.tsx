import type { Metadata } from "next";

/**
 * Raíz del panel de administración.
 *
 * No pinta interfaz: solo aísla el árbol `/admin/*` del sitio público (que
 * tiene su propio layout con header, footer y botón de WhatsApp) y marca todo
 * el panel como no indexable. El `robots.ts` del sitio ya excluye /admin, pero
 * la metaetiqueta cubre el caso de un enlace directo compartido por error.
 */
export const metadata: Metadata = {
  title: {
    default: "Panel · La Maima",
    template: "%s · Panel La Maima",
  },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
