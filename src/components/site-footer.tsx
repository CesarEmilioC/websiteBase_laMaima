import Image from "next/image";
import Link from "next/link";

import { FacebookIcon, InstagramIcon, MapPinIcon, PhoneIcon } from "./icons";
import { getContactInfo } from "@/lib/content";
import { LEGAL_LINKS, NAV_LINKS, SITE } from "@/lib/site";

/**
 * Pie de página sobre azul marino.
 *
 * Es el ÚNICO sitio donde aparece el lockup completo del logotipo —monograma,
 * wordmark y el subtítulo "Hotel Campestre"— tal y como lo entregó el cliente,
 * en vertical y en blanco. En el nav ese subtítulo mediría cuatro píxeles; aquí
 * hay altura de sobra y es donde conviene firmar con la marca entera.
 */
export async function SiteFooter() {
  const year = new Date().getFullYear();
  const contact = await getContactInfo();

  return (
    <footer className="bg-navy text-sand-soft">
      <div className="container-page section-y-sm">
        <div className="grid gap-12 md:grid-cols-12 md:gap-10">
          {/* Marca */}
          <div className="md:col-span-5">
            <Image
              src="/logo-lamaima-vertical-blanco.png"
              alt="La Maima — Hotel Campestre"
              width={999}
              height={921}
              /* Ver la nota de `site-header.tsx`: sin `sizes` el navegador se
                 descarga el original de 999 px para un hueco de ~104 px. */
              sizes="110px"
              className="h-20 w-auto sm:h-24"
            />
            <p className="mt-7 max-w-sm text-[0.9375rem] leading-relaxed text-sand-soft/60">
              Reserva natural y hotel campestre en las montañas de Dapa. Treinta
              años de bosque en rehabilitación, seis casas y cabañas
              independientes y el Valle del Cauca a los pies.
            </p>

            <div className="mt-7 flex items-center gap-3">
              <a
                href={contact.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram de La Maima (${contact.social.instagramHandle})`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-tile bg-white/10 text-sand-soft/85 transition-[background-color,transform] duration-200 ease-ios hover:bg-white/20 hover:text-white active:scale-95"
              >
                <InstagramIcon className="h-[1.15rem] w-[1.15rem]" />
              </a>
              <a
                href={contact.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Facebook de La Maima (${contact.social.facebookHandle})`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-tile bg-white/10 text-sand-soft/85 transition-[background-color,transform] duration-200 ease-ios hover:bg-white/20 hover:text-white active:scale-95"
              >
                <FacebookIcon className="h-[1.15rem] w-[1.15rem]" />
              </a>
            </div>
          </div>

          {/* Navegación */}
          <nav aria-label="Pie de página" className="md:col-span-3">
            <h2 className="eyebrow text-brand-300">Navegación</h2>
            <ul className="mt-5 space-y-3.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.9375rem] text-sand-soft/75 transition-colors duration-200 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contacto */}
          <div className="md:col-span-4">
            <h2 className="eyebrow text-brand-300">Contacto</h2>
            <ul className="mt-5 space-y-4 text-[0.9375rem]">
              <li>
                <a
                  href={contact.maps.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-sand-soft/75 transition-colors duration-200 hover:text-white"
                >
                  <MapPinIcon className="mt-0.5 h-[1.15rem] w-[1.15rem] shrink-0 text-brand-400" />
                  <span>
                    {contact.street}
                    <br />
                    {contact.locality}, {contact.region}
                    <br />
                    {/* /60 y no /45: a 45 % de opacidad sobre el azul marino
                        este renglón no llegaba a la razón de contraste 4,5:1
                        (lo detectó la auditoría de accesibilidad). */}
                    <span className="text-sand-soft/60">Ver en Google Maps</span>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={contact.phoneHref}
                  className="flex items-center gap-3 text-sand-soft/75 transition-colors duration-200 hover:text-white"
                >
                  <PhoneIcon className="h-[1.15rem] w-[1.15rem] shrink-0 text-brand-400" />
                  {contact.phoneDisplay}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-8">
          {/* Fila legal. Va en el pie y no en la navegación principal: son
              documentos de consulta, no destinos de la visita. Además es donde
              los busca quien evalúa el comercio (pasarela de pagos incluida). */}
          <nav aria-label="Información legal">
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.8125rem]">
              {LEGAL_LINKS.map((link, index) => (
                <li key={link.href} className="flex items-center gap-4">
                  {index > 0 && (
                    <span aria-hidden="true" className="text-sand-soft/25">
                      ·
                    </span>
                  )}
                  <Link
                    href={link.href}
                    className="text-sand-soft/70 transition-colors duration-200 hover:text-white"
                  >
                    {link.short}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-5 flex flex-col gap-2 text-[0.8125rem] text-sand-soft/55 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} {SITE.legalName}. Todos los derechos reservados.
            </p>
            <p>Reservas y consultas por WhatsApp {contact.phoneDisplay}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
