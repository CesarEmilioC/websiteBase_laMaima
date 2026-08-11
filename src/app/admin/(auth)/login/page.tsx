import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { LoginForm } from "./login-form";
import { safeAdminRedirect } from "@/lib/supabase/middleware";

export const metadata: Metadata = {
  title: "Acceso al panel",
  robots: { index: false, follow: false },
};

/** El formulario depende de `?next=`: no tiene sentido prerenderizarlo. */
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeAdminRedirect(params.next);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-[26rem]">
        <div className="rounded-panel bg-white p-7 shadow-panel ring-1 ring-black/[0.05] sm:p-9">
          <div className="flex flex-col items-center text-center">
            <Image
              src="/logo-lamaima.png"
              alt="La Maima"
              width={132}
              height={44}
              priority
              className="h-11 w-auto"
            />
            <h1 className="mt-6 text-[1.5rem] font-semibold tracking-[-0.03em] text-ink">
              Panel de administración
            </h1>
            <p className="mt-1.5 text-[0.875rem] leading-relaxed text-ink-muted">
              Entra con la cuenta de La Maima para editar el sitio y gestionar
              las reservas.
            </p>
          </div>

          <div className="mt-7">
            <LoginForm next={next} />
          </div>
        </div>

        <p className="mt-6 text-center text-[0.8125rem] text-ink-muted">
          <Link
            href="/"
            className="font-medium text-forest-700 underline-offset-4 hover:underline"
          >
            Volver al sitio
          </Link>
          <span className="mx-2 text-black/20">·</span>
          ¿Olvidaste la contraseña? Escríbele al desarrollador.
        </p>
      </div>
    </main>
  );
}
