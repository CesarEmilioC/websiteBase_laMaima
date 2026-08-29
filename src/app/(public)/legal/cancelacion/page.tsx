import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalDocument,
  Pending,
  PendingBlock,
  type LegalSection,
} from "@/components/legal/legal-document";
import { getContactInfo, getOgImage } from "@/lib/content";
import { LEGAL_UPDATED } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";
import { LEGAL_LINKS, SITE } from "@/lib/site";

export const revalidate = 3600;

const DOC = LEGAL_LINKS[2];

export async function generateMetadata(): Promise<Metadata> {
  const ogImage = await getOgImage();

  return pageMetadata({
    title: "Política de cancelación y reembolsos",
    description:
      "Cómo cancelar o reprogramar una reserva en La Maima: anticipo del 10 %, cambio de fechas hasta 24 horas antes con el anticipo como crédito y no presentación.",
    path: DOC.href,
    image: { url: ogImage.url, alt: ogImage.alt },
    socialTitle: "Cancelaciones y reembolsos · La Maima",
    socialDescription:
      "Plazos, reembolsos y cambios de fecha de las reservas de La Maima — Hotel Campestre.",
  });
}

export default async function CancellationPage() {
  const contact = await getContactInfo();

  const sections: LegalSection[] = [
    {
      id: "alcance",
      title: "1. Alcance",
      body: (
        <>
          <p>
            Esta política aplica a las reservas de alojamiento y experiencias de{" "}
            <strong>{SITE.legalName}</strong> confirmadas directamente a través
            de este sitio web, de WhatsApp, del teléfono o del correo
            electrónico, y forma parte integral de los{" "}
            <Link href="/legal/terminos">términos y condiciones de reserva</Link>
            .
          </p>
          <p>
            Las reservas hechas a través de Airbnb o Booking.com se rigen por la
            política de cancelación de esa plataforma (ver el punto 8).
          </p>
        </>
      ),
    },
    {
      id: "solicitud",
      title: "2. Cómo solicitar una cancelación o un cambio",
      body: (
        <>
          <p>
            La solicitud debe hacerse <strong>por escrito</strong>, indicando el
            número de reserva, el nombre de quien reservó y las fechas
            afectadas, a través de:
          </p>
          <ul>
            <li>
              <strong>WhatsApp:</strong>{" "}
              <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
            </li>
            <li>
              <strong>Correo electrónico:</strong>{" "}
              <Pending>correo oficial de contacto</Pending>
            </li>
          </ul>
          <p>
            Para todos los efectos, la cancelación se entiende presentada en la{" "}
            <strong>fecha y hora en que La Maima recibe la solicitud</strong>,
            no en la fecha en que se responde. Toda cancelación se confirma por
            el mismo medio, con el detalle del reembolso que corresponda.
          </p>
        </>
      ),
    },
    {
      id: "anticipo",
      title: "3. Anticipo: cómo se asegura la reserva",
      body: (
        <>
          <p>
            Para reservar se requiere un{" "}
            <strong>anticipo del 10 % del valor total</strong> de la estadía. La
            reserva queda en firme —y las fechas bloqueadas— únicamente cuando
            ese anticipo se registra y La Maima envía la confirmación escrita.
            El saldo restante se paga según lo acordado en esa confirmación.
          </p>
          <p>
            El anticipo no es un cargo aparte: se descuenta del valor total de
            la estadía.
          </p>
          <p>
            Si el huésped decide no viajar, el anticipo{" "}
            <strong>no se devuelve en dinero</strong>, pero puede conservarse
            como crédito para unas fechas nuevas siempre que la reprogramación
            se solicite dentro del plazo del punto 4.
          </p>
        </>
      ),
    },
    {
      id: "cambios",
      title: "4. Reprogramación (cambio de fechas)",
      body: (
        <>
          <p>
            La fecha de una reserva se puede cambiar{" "}
            <strong>hasta 24 horas antes de la llegada</strong> —es decir, con
            un día de anticipación como mínimo—, coordinándolo directamente con
            los propietarios por los canales del punto 2.
          </p>
          <p>
            En ese caso, <strong>el anticipo queda como crédito</strong> para
            las nuevas fechas, sujeto a la disponibilidad del alojamiento y a la
            tarifa vigente en esas fechas. Si la tarifa de las nuevas fechas es
            superior, el huésped paga la diferencia; si es inferior, la
            diferencia no se reembolsa en dinero.
          </p>
          <p>
            Una solicitud de cambio presentada{" "}
            <strong>el mismo día de la llegada</strong> ya no se tramita como
            reprogramación: se cuenta como no presentación (punto 5).
          </p>
          <PendingBlock title="Pendiente de definir con La Maima: vigencia del crédito">
            <p>
              Falta fijar cuánto tiempo se puede usar el crédito del anticipo
              antes de que caduque (por ejemplo, 3 o 6 meses desde la fecha
              original de la reserva). Mientras no se publique un plazo, el
              crédito se acuerda caso por caso con los propietarios al momento
              de reprogramar.
            </p>
          </PendingBlock>
        </>
      ),
    },
    {
      id: "no-show",
      title: "5. No presentación y salida anticipada",
      body: (
        <>
          <p>
            Se entiende por <strong>no presentación (no-show)</strong> el hecho
            de no llegar en la fecha de entrada sin haber avisado previamente, y
            también la cancelación o el cambio solicitados{" "}
            <strong>el mismo día de la llegada</strong>.
          </p>
          <p>
            En caso de no presentación{" "}
            <strong>no hay devolución ni crédito del anticipo</strong>: la
            reserva se considera consumida.
          </p>
          <p>
            La <strong>salida anticipada</strong> por decisión del huésped no
            genera reembolso de las noches no utilizadas. Si la salida
            anticipada se debe a una causa atribuible a La Maima, se reembolsan
            las noches no disfrutadas.
          </p>
          <p>
            Un retraso en la llegada no implica no presentación siempre que se
            avise con anticipación por WhatsApp o teléfono.
          </p>
        </>
      ),
    },
    {
      id: "cancelacion-maima",
      title: "6. Cancelación por parte de La Maima",
      body: (
        <>
          <p>
            Si por una causa atribuible al establecimiento —un daño en el
            alojamiento, un problema de seguridad o una sobreventa— no fuera
            posible prestar el servicio reservado, La Maima ofrecerá, a elección
            del huésped:
          </p>
          <ul>
            <li>
              El traslado a otro alojamiento de La Maima de categoría igual o
              superior, sin costo adicional.
            </li>
            <li>El cambio de fechas sin penalidad.</li>
            <li>
              El <strong>reembolso íntegro (100 %)</strong> de las sumas
              pagadas.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "fuerza-mayor",
      title: "7. Fuerza mayor y caso fortuito",
      body: (
        <>
          <p>
            Cuando la estadía no pueda realizarse por hechos ajenos a la
            voluntad de las partes —cierres de vía, deslizamientos, eventos
            climáticos extremos, emergencias sanitarias o decisiones de
            autoridad—, La Maima buscará una solución razonable con el huésped
            en lugar de aplicar las condiciones ordinarias de cancelación.
          </p>
          <p>
            En la práctica, la alternativa que se ofrece es la{" "}
            <strong>reprogramación sin costo</strong> para unas fechas nuevas,
            conservando lo pagado, aunque la solicitud llegue con menos de 24
            horas de antelación.
          </p>
        </>
      ),
    },
    {
      id: "airbnb",
      title: "8. Reservas hechas por Airbnb o Booking.com",
      body: (
        <p>
          Las reservas originadas en plataformas externas se cancelan y se
          reembolsan <strong>a través de esa misma plataforma</strong> y de
          acuerdo con la política de cancelación publicada allí, que puede
          diferir de la de este sitio. La Maima no puede modificar ni tramitar
          directamente los reembolsos de esas reservas.
        </p>
      ),
    },
    {
      id: "reembolsos",
      title: "9. Cómo y cuándo se hace el reembolso",
      body: (
        <>
          <ul>
            <li>
              El reembolso se realiza por el{" "}
              <strong>mismo medio de pago</strong> utilizado en la reserva,
              salvo que las partes acuerden otro por escrito.
            </li>
            <li>
              El trámite se inicia dentro de los cinco (5) días hábiles
              siguientes a la confirmación de la cancelación. El tiempo en que
              el dinero se ve reflejado depende del banco o de la pasarela de
              pagos y puede tomar hasta{" "}
              <strong>treinta (30) días calendario</strong>.
            </li>
            <li>
              Los reembolsos se hacen a nombre de la persona que realizó el
              pago.
            </li>
            <li>
              Cuando lo que corresponde es un{" "}
              <strong>crédito</strong> y no un reembolso (reprogramación, punto
              4), no hay movimiento de dinero: el valor queda registrado a
              nombre de quien reservó y se aplica a las nuevas fechas.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "consumidor",
      title: "10. Derecho de retracto y reversión del pago",
      body: (
        <p>
          Lo previsto en esta política se entiende sin perjuicio del derecho de
          retracto y del mecanismo de reversión del pago reconocidos por el
          Estatuto del Consumidor (Ley 1480 de 2011), en los términos descritos
          en los{" "}
          <Link href="/legal/terminos">términos y condiciones de reserva</Link>.
        </p>
      ),
    },
  ];

  return (
    <LegalDocument
      title="Política de cancelación y reembolsos"
      current={DOC.href}
      intro="Qué ocurre si necesitas cancelar o mover tu reserva: cómo funciona el anticipo del 10 %, hasta cuándo puedes cambiar las fechas conservándolo como crédito, y qué pasa si no llegas o si algo se sale de las manos de todos."
      updated={LEGAL_UPDATED}
      sections={sections}
      footnote={
        <p>
          ¿Necesitas cancelar o mover una reserva? Escríbenos por WhatsApp al{" "}
          <a href={contact.phoneHref}>{contact.phoneDisplay}</a> con tu número de
          reserva y te confirmamos por escrito.
        </p>
      }
    />
  );
}
