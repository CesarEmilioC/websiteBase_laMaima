import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalDocument,
  Pending,
  PendingBlock,
  type LegalSection,
} from "@/components/legal/legal-document";
import { getContactInfo, getOgImage, type ContactInfo } from "@/lib/content";
import { localePath, type Locale } from "@/lib/i18n/config";
import { LEGAL_UPDATED, LEGAL_UPDATED_EN } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";
import { legalLink, SITE } from "@/lib/site";

const PATH = "/legal/cancelacion";

export async function cancellationMetadata(locale: Locale): Promise<Metadata> {
  const ogImage = await getOgImage(locale);
  const english = locale === "en";

  return pageMetadata({
    title: english
      ? "Cancellation and refund policy"
      : "Política de cancelación y reembolsos",
    description: english
      ? "How to cancel or reschedule a booking at La Maima: the 10 % deposit, date changes up to 24 hours before arrival keeping the deposit as credit, and no-shows."
      : "Cómo cancelar o reprogramar una reserva en La Maima: anticipo del 10 %, cambio de fechas hasta 24 horas antes con el anticipo como crédito y no presentación.",
    path: PATH,
    image: { url: ogImage.url, alt: ogImage.alt },
    socialTitle: english
      ? "Cancellations and refunds · La Maima"
      : "Cancelaciones y reembolsos · La Maima",
    socialDescription: english
      ? "Deadlines, refunds and date changes for bookings at La Maima — Hotel Campestre."
      : "Plazos, reembolsos y cambios de fecha de las reservas de La Maima — Hotel Campestre.",
    locale,
  });
}

export async function CancellationPage({ locale }: { locale: Locale }) {
  const contact = await getContactInfo();
  const english = locale === "en";
  const doc = legalLink("cancellation", locale);

  return (
    <LegalDocument
      locale={locale}
      title={doc.label}
      current={PATH}
      intro={
        english
          ? "What happens if you need to cancel or move your booking: how the 10 % deposit works, until when you can change your dates and keep it as credit, and what happens if you don't arrive or if something is beyond anyone's control."
          : "Qué ocurre si necesitas cancelar o mover tu reserva: cómo funciona el anticipo del 10 %, hasta cuándo puedes cambiar las fechas conservándolo como crédito, y qué pasa si no llegas o si algo se sale de las manos de todos."
      }
      updated={english ? LEGAL_UPDATED_EN : LEGAL_UPDATED}
      sections={english ? sectionsEn(contact) : sectionsEs(contact)}
      footnote={
        english ? (
          <p>
            Need to cancel or move a booking? Message us on WhatsApp at{" "}
            <a href={contact.phoneHref}>{contact.phoneDisplay}</a> with your
            booking number and we will confirm in writing.
          </p>
        ) : (
          <p>
            ¿Necesitas cancelar o mover una reserva? Escríbenos por WhatsApp al{" "}
            <a href={contact.phoneHref}>{contact.phoneDisplay}</a> con tu número
            de reserva y te confirmamos por escrito.
          </p>
        )
      }
    />
  );
}

/* ---------------------------------------------------------------------------
 * Español
 * ------------------------------------------------------------------------- */

function sectionsEs(contact: ContactInfo): LegalSection[] {
  return [
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
            <Link href={localePath("es", "/legal/terminos")}>
              términos y condiciones de reserva
            </Link>
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
        <ul>
          <li>
            El reembolso se realiza por el <strong>mismo medio de pago</strong>{" "}
            utilizado en la reserva, salvo que las partes acuerden otro por
            escrito.
          </li>
          <li>
            El trámite se inicia dentro de los cinco (5) días hábiles siguientes
            a la confirmación de la cancelación. El tiempo en que el dinero se
            ve reflejado depende del banco o de la pasarela de pagos y puede
            tomar hasta <strong>treinta (30) días calendario</strong>.
          </li>
          <li>
            Los reembolsos se hacen a nombre de la persona que realizó el pago.
          </li>
          <li>
            Cuando lo que corresponde es un <strong>crédito</strong> y no un
            reembolso (reprogramación, punto 4), no hay movimiento de dinero: el
            valor queda registrado a nombre de quien reservó y se aplica a las
            nuevas fechas.
          </li>
        </ul>
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
          <Link href={localePath("es", "/legal/terminos")}>
            términos y condiciones de reserva
          </Link>
          .
        </p>
      ),
    },
  ];
}

/* ---------------------------------------------------------------------------
 * English
 * ------------------------------------------------------------------------- */

function sectionsEn(contact: ContactInfo): LegalSection[] {
  /* Los identificadores de sección se mantienen EN ESPAÑOL en los dos idiomas:
     son anclas (`#no-show`, `#reembolsos`) que ya circulan en enlaces y que la
     política de cancelación cita desde el widget de reservas. Traducirlas
     rompería esos enlaces sin ganar nada: el lector ve el título, no el ancla. */
  const P = (props: { children: string }) => (
    <Pending locale="en">{props.children}</Pending>
  );

  return [
    {
      id: "alcance",
      title: "1. Scope",
      body: (
        <>
          <p>
            This policy applies to accommodation and experience bookings at{" "}
            <strong>{SITE.legalName}</strong> confirmed directly through this
            website, WhatsApp, the telephone or email, and forms an integral
            part of the{" "}
            <Link href={localePath("en", "/legal/terminos")}>
              booking terms and conditions
            </Link>
            .
          </p>
          <p>
            Bookings made through Airbnb or Booking.com are governed by that
            platform&apos;s cancellation policy (see section 8).
          </p>
        </>
      ),
    },
    {
      id: "solicitud",
      title: "2. How to request a cancellation or a change",
      body: (
        <>
          <p>
            The request must be made <strong>in writing</strong>, stating the
            booking number, the name of the person who booked and the dates
            affected, through:
          </p>
          <ul>
            <li>
              <strong>WhatsApp:</strong>{" "}
              <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
            </li>
            <li>
              <strong>Email:</strong> <P>official contact email address</P>
            </li>
          </ul>
          <p>
            For all purposes, a cancellation is deemed submitted on the{" "}
            <strong>date and time La Maima receives the request</strong>, not on
            the date it is answered. Every cancellation is confirmed through the
            same channel, with the details of any refund due.
          </p>
        </>
      ),
    },
    {
      id: "anticipo",
      title: "3. Deposit: how a booking is secured",
      body: (
        <>
          <p>
            A <strong>deposit of 10 % of the total value</strong> of the stay is
            required to book. The booking is only firm —and the dates only
            blocked— once that deposit is registered and La Maima sends written
            confirmation. The remaining balance is paid as agreed in that
            confirmation.
          </p>
          <p>
            The deposit is not a separate charge: it is deducted from the total
            value of the stay.
          </p>
          <p>
            If the guest decides not to travel, the deposit{" "}
            <strong>is not refunded in cash</strong>, but it can be kept as
            credit towards new dates provided the change is requested within the
            deadline in section 4.
          </p>
        </>
      ),
    },
    {
      id: "cambios",
      title: "4. Rescheduling (changing dates)",
      body: (
        <>
          <p>
            The dates of a booking can be changed{" "}
            <strong>up to 24 hours before arrival</strong> —that is, at least
            one day in advance— by arranging it directly with the owners through
            the channels in section 2.
          </p>
          <p>
            In that case, <strong>the deposit is kept as credit</strong> towards
            the new dates, subject to availability and to the rate in force on
            those dates. If the new dates are more expensive, the guest pays the
            difference; if they are cheaper, the difference is not refunded in
            cash.
          </p>
          <p>
            A change requested <strong>on the day of arrival</strong> is no
            longer processed as a rescheduling: it counts as a no-show (section
            5).
          </p>
          <PendingBlock title="Still to be defined with La Maima: how long the credit lasts">
            <p>
              We still need to set how long the deposit credit can be used
              before it expires (for example, 3 or 6 months from the original
              booking date). Until a deadline is published, the credit is agreed
              case by case with the owners at the time of rescheduling.
            </p>
          </PendingBlock>
        </>
      ),
    },
    {
      id: "no-show",
      title: "5. No-show and early departure",
      body: (
        <>
          <p>
            A <strong>no-show</strong> means failing to arrive on the check-in
            date without prior notice, and also any cancellation or change
            requested <strong>on the day of arrival</strong>.
          </p>
          <p>
            In the event of a no-show{" "}
            <strong>there is no refund and no credit of the deposit</strong>:
            the booking is treated as consumed.
          </p>
          <p>
            An <strong>early departure</strong> decided by the guest does not
            entitle them to a refund of the unused nights. If the early
            departure is due to a cause attributable to La Maima, the nights not
            enjoyed are refunded.
          </p>
          <p>
            A late arrival is not a no-show as long as it is notified in advance
            by WhatsApp or telephone.
          </p>
        </>
      ),
    },
    {
      id: "cancelacion-maima",
      title: "6. Cancellation by La Maima",
      body: (
        <>
          <p>
            If for a reason attributable to the establishment —damage to the
            accommodation, a safety problem or an overbooking— the reserved
            service could not be provided, La Maima will offer, at the
            guest&apos;s choice:
          </p>
          <ul>
            <li>
              A move to another house at La Maima of equal or higher category,
              at no extra cost.
            </li>
            <li>A change of dates with no penalty.</li>
            <li>
              A <strong>full refund (100 %)</strong> of the amounts paid.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "fuerza-mayor",
      title: "7. Force majeure",
      body: (
        <>
          <p>
            Where the stay cannot go ahead for reasons beyond the control of
            either party —road closures, landslides, extreme weather, health
            emergencies or decisions by the authorities— La Maima will look for
            a reasonable solution with the guest instead of applying the
            ordinary cancellation conditions.
          </p>
          <p>
            In practice, the alternative offered is{" "}
            <strong>free rescheduling</strong> to new dates, keeping everything
            already paid, even if the request arrives less than 24 hours in
            advance.
          </p>
        </>
      ),
    },
    {
      id: "airbnb",
      title: "8. Bookings made through Airbnb or Booking.com",
      body: (
        <p>
          Bookings originating on external platforms are cancelled and refunded{" "}
          <strong>through that same platform</strong> and in accordance with the
          cancellation policy published there, which may differ from the one on
          this site. La Maima cannot modify or process refunds for those
          bookings directly.
        </p>
      ),
    },
    {
      id: "reembolsos",
      title: "9. How and when refunds are made",
      body: (
        <ul>
          <li>
            Refunds are issued through the{" "}
            <strong>same payment method</strong> used for the booking, unless
            the parties agree otherwise in writing.
          </li>
          <li>
            Processing starts within five (5) business days of the cancellation
            being confirmed. How long the money takes to appear depends on the
            bank or the payment gateway and may take up to{" "}
            <strong>thirty (30) calendar days</strong>.
          </li>
          <li>Refunds are made to the person who made the payment.</li>
          <li>
            Where what applies is a <strong>credit</strong> rather than a refund
            (rescheduling, section 4), no money moves: the amount is recorded in
            the name of whoever booked and applied to the new dates.
          </li>
        </ul>
      ),
    },
    {
      id: "consumidor",
      title: "10. Right of withdrawal and payment reversal",
      body: (
        <p>
          Nothing in this policy affects the right of withdrawal and the payment
          reversal mechanism recognised by the Colombian Consumer Statute (Law
          1480 of 2011), on the terms described in the{" "}
          <Link href={localePath("en", "/legal/terminos")}>
            booking terms and conditions
          </Link>
          .
        </p>
      ),
    },
  ];
}
