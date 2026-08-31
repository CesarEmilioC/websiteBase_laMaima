import { PublicShell } from "@/components/public-shell";

/**
 * Armazón de las páginas públicas en español: isla de navegación, contenido,
 * pie, flotante de WhatsApp y datos estructurados del negocio.
 *
 * Todo eso vive en `PublicShell`, que comparten los dos idiomas; aquí solo se
 * fija cuál es este. Ver `components/public-shell.tsx`.
 */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PublicShell locale="es">{children}</PublicShell>;
}
