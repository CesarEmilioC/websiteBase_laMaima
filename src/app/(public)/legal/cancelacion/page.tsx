import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalDocument,
  Pending,
  PendingBlock,
  type LegalSection,
} from "@/components/legal/legal-document";
import { getContactInfo } from "@/lib/content";
import { LEGAL_UPDATED } from "@/lib/legal";
import { LEGAL_LINKS, SITE } from "@/lib/site";

export const revalidate = 3600;

const DOC = LEGAL_LINKS[2];

export const metadata: Metadata = {
  title: "Política de cancelación y reembolsos",
  description:
    "Cómo cancelar o modificar una reserva en La Maima — Hotel Campestre: canal de solicitud, plazos, reembolsos, cambios de fecha, no presentación y casos de fuerza mayor.",
  alternates: { canonical: DOC.href },
  openGraph: {
    title: "Cancelaciones y reembolsos · La Maima",
    description:
      "Plazos, reembolsos y cambios de fecha de las reservas de La Maima — Hotel Campestre.",
    url: DOC.href,
  },
};

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
      id: "plazos",
      title: "3. Plazos y porcentajes de reembolso",
      body: (
        <>
          <p>
            El reembolso depende de la antelación con que se cancele respecto de
            la fecha de entrada. La estructura es la siguiente:
          </p>
          <PendingBlock title="Pendiente de definir con La Maima: plazos y porcentajes exactos">
            <ul>
              <li>
                <strong>Cancelación con más de [X] días de antelación:</strong>{" "}
                reembolso del [__] % del valor pagado.
              </li>
              <li>
                <strong>Cancelación entre [X] y [Y] días de antelación:</strong>{" "}
                reembolso del [__] % del valor pagado.
              </li>
              <li>
                <strong>Cancelación con menos de [Y] días de antelación:</strong>{" "}
                reembolso del [__] % del valor pagado.
              </li>
              <li>
                <strong>Temporada alta y puentes festivos:</strong> definir si
                aplican plazos o porcentajes distintos.
              </li>
              <li>
                Definir si el anticipo es reembolsable o si se convierte en un
                crédito para una estadía posterior.
              </li>
            </ul>
          </PendingBlock>
          <p>
            Mientras estos plazos no estén publicados, cada cancelación se
            atiende de forma individual y las condiciones aplicables se
            confirman por escrito al momento de reservar. En ningún caso se
            aplicará al huésped una condición más gravosa que la comunicada
            cuando confirmó su reserva.
          </p>
        </>
      ),
    },
    {
      id: "cambios",
      title: "4. Cambio de fechas",
      body: (
        <>
          <p>
            El cambio de fechas está sujeto a la disponibilidad del alojamiento
            y se solicita por los mismos canales indicados en el punto 2. Si la
            tarifa de las nuevas fechas es superior, el huésped paga la
            diferencia; si es inferior, la diferencia no se reembolsa, salvo que
            La Maima indique lo contrario.
          </p>
          <PendingBlock title="Pendiente de definir con La Maima">
            <ul>
              <li>
                Antelación mínima para solicitar un cambio de fechas sin costo.
              </li>
              <li>Número de cambios permitidos por reserva.</li>
              <li>
                Plazo máximo para usar las nuevas fechas cuando el cambio se
                gestiona como crédito.
              </li>
            </ul>
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
            de no llegar en la fecha de entrada sin haber avisado previamente.
            En ese caso, la reserva se considera consumida y no da lugar a
            reembolso.
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
            en lugar de aplicar los porcentajes ordinarios de cancelación.
          </p>
          <PendingBlock title="Pendiente de definir con La Maima">
            <p>
              Alternativa que se ofrecerá en estos casos: reprogramación sin
              costo, crédito por el valor pagado con una vigencia determinada, o
              reembolso. Conviene fijar una sola regla y publicarla.
            </p>
          </PendingBlock>
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
          </ul>
          <PendingBlock title="Pendiente de definir con La Maima">
            <p>
              Si los costos de la pasarela de pagos se descuentan del valor a
              reembolsar, debe indicarse expresamente aquí y en el momento de la
              reserva.
            </p>
          </PendingBlock>
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
      intro="Qué ocurre si necesitas cancelar o mover tu reserva: por dónde solicitarlo, en qué plazos, cómo se calcula el reembolso y qué pasa en casos de fuerza mayor."
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
