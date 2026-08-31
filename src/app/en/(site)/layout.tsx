import { PublicShell } from "@/components/public-shell";

/** Armazón de las páginas públicas en inglés. Ver `components/public-shell.tsx`. */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PublicShell locale="en">{children}</PublicShell>;
}
