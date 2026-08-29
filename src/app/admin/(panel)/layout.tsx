import Image from "next/image";
import Link from "next/link";

import { signOutAction } from "./actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { SubmitButton } from "@/components/admin/submit-button";
import { requireAdmin } from "@/lib/admin/auth";

/**
 * Marco del panel: cabecera con la identidad de la sesión y navegación
 * (lateral en escritorio, pestañas en móvil).
 *
 * `requireAdmin()` corre en cada navegación: el middleware ya filtra, pero
 * repetir la comprobación aquí evita que una ruta quede desprotegida si algún
 * día cambia el `matcher`.
 */
export default async function AdminPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireAdmin();

  return (
    <div className="min-h-screen bg-sand-soft">
      <header className="glass-strong sticky top-0 z-40 border-b border-ink/[0.07]">
        <div className="mx-auto flex max-w-[88rem] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/logo-lamaima.png"
              alt="La Maima"
              width={946}
              height={256}
              priority
              className="h-8 w-auto"
            />
            <span className="hidden text-[0.8125rem] font-semibold text-ink-muted sm:inline">
              Panel
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold text-brand-700 transition-colors hover:bg-brand-600/10 sm:inline-flex"
            >
              Ver el sitio
            </Link>
            <span
              className="hidden max-w-[14rem] truncate text-[0.8125rem] text-ink-muted md:inline"
              title={user.email ?? ""}
            >
              {user.email}
            </span>
            <form action={signOutAction}>
              <SubmitButton tone="secondary" size="sm" pendingLabel="Saliendo…">
                Cerrar sesión
              </SubmitButton>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[88rem] gap-8 px-4 py-6 sm:px-6 lg:flex lg:px-8 lg:py-10">
        <aside className="lg:w-56 lg:shrink-0">
          <div className="lg:sticky lg:top-24">
            <AdminNav />
          </div>
        </aside>

        <main className="min-w-0 flex-1 pt-6 lg:pt-0">{children}</main>
      </div>
    </div>
  );
}
