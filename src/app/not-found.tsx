import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";
import { LeafField } from "@/components/leaf-field";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { media } from "@/lib/site";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      {/* El fondo va a sangre (la foto es `fill` sobre este mismo elemento), así
          que aquí no puede ir `.container-page`: el ancho lo limita el propio
          contenido, que ya es estrecho y está centrado. Los márgenes laterales
          sí son los mismos que el resto del sitio. */}
      <main className="on-photo section-y relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 text-center sm:px-8">
        <Image
          src={media("sitio/bosque.jpg")}
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-navy/82" />
        {/* Mismo recurso que la banda de encabezado de las páginas internas:
            la capa de hojas queda entre el velo y el contenido. */}
        <LeafField tone="light" className="-z-10" />

        <Link href="/" aria-label="La Maima — Inicio">
          <Image
            src="/logo-lamaima-blanco.png"
            alt="La Maima — Hotel Campestre"
            width={946}
            height={256}
            /* Archivo blanco oficial: ya no hace falta el filtro
               `brightness(0) invert` que blanqueaba el PNG azul. */
            className="h-9 w-auto sm:h-11"
          />
        </Link>

        <p className="eyebrow eyebrow-chip mt-12 inline-flex items-center rounded-full bg-white/20 py-1.5 pl-3.5 text-white ring-1 ring-inset ring-white/30 backdrop-blur-md">
          Error 404
        </p>
        <h1 className="tracking-display mt-5 max-w-2xl text-[2.375rem] leading-[1.05] text-white sm:text-5xl">
          Esta página se perdió{" "}
          <span className="text-brand-200">en el bosque</span>
        </h1>
        <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-white/80">
          La dirección que buscas no existe o cambió de lugar. Te dejamos el
          camino de vuelta.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-[1.0625rem] font-semibold tracking-[-0.01em] text-brand-700 shadow-pill transition-[background-color,transform] duration-200 ease-ios hover:bg-brand-50 active:scale-[0.98]"
          >
            Volver al inicio
            <ArrowRightIcon className="h-[1.05rem] w-[1.05rem]" />
          </Link>
          <Link
            href="/alojamientos"
            className="inline-flex items-center justify-center rounded-full bg-white/12 px-7 py-4 text-[1.0625rem] font-semibold tracking-[-0.01em] text-white ring-1 ring-inset ring-white/25 backdrop-blur-md transition-[background-color,transform] duration-200 ease-ios hover:bg-white/22 active:scale-[0.98]"
          >
            Ver alojamientos
          </Link>
        </div>
      </main>

      <WhatsAppFloat />
    </>
  );
}
