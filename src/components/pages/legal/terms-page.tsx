import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalDocument,
  Pending,
  type LegalSection,
} from "@/components/legal/legal-document";
import { getContactInfo, getOgImage, type ContactInfo } from "@/lib/content";
import { localePath, type Locale } from "@/lib/i18n/config";
import { LEGAL_UPDATED, LEGAL_UPDATED_EN } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";
import { legalLink, SITE } from "@/lib/site";

const PATH = "/legal/terminos";

export async function termsMetadata(locale: Locale): Promise<Metadata> {
  const ogImage = await getOgImage(locale);
  const english = locale === "en";

  return pageMetadata({
    title: english
      ? "Booking terms and conditions"
      : "Términos y condiciones de reserva",
    /* Por debajo de 160 caracteres: Google recorta a partir de ahí y lo que
       sobra no se lee nunca. */
    description: english
      ? "Booking and stay conditions at La Maima: rates by occupancy, deposit, minimum stays, check-in at 3:00 p.m., pets and the rules of the nature reserve."
      : "Condiciones de reserva y hospedaje en La Maima: tarifas por ocupación, anticipo, estancias mínimas, check-in 3:00 p. m., mascotas y normas de la reserva.",
    path: PATH,
    image: { url: ogImage.url, alt: ogImage.alt },
    socialTitle: english
      ? "Terms and conditions · La Maima"
      : "Términos y condiciones · La Maima",
    socialDescription: english
      ? "Booking, payment, capacity, timetable and house rules at La Maima — Hotel Campestre."
      : "Condiciones de reserva, pago, capacidad, horarios y normas de La Maima — Hotel Campestre.",
    locale,
  });
}

export async function TermsPage({ locale }: { locale: Locale }) {
  const contact = await getContactInfo();
  const english = locale === "en";
  const doc = legalLink("terms", locale);

  return (
    <LegalDocument
      locale={locale}
      title={doc.label}
      current={PATH}
      intro={
        english
          ? "The conditions that govern booking and staying at La Maima: how the rate is calculated from the number of guests, the deposit, the minimum stays by season, check-in and check-out times, pets and the rules of the nature reserve."
          : "Condiciones que rigen la reserva y la estadía en La Maima: cómo se calcula la tarifa según el número de huéspedes, el anticipo, las estancias mínimas por temporada, los horarios de entrada y salida, las mascotas y las normas de la reserva natural."
      }
      updated={english ? LEGAL_UPDATED_EN : LEGAL_UPDATED}
      sections={english ? sectionsEn(contact) : sectionsEs(contact)}
      footnote={
        english ? (
          <p>
            Confirming a booking also means accepting the{" "}
            <Link href={localePath("en", "/legal/cancelacion")}>
              cancellation and refund policy
            </Link>{" "}
            and the{" "}
            <Link href={localePath("en", "/legal/privacidad")}>
              privacy policy
            </Link>
            .
          </p>
        ) : (
          <p>
            Al confirmar una reserva se aceptan también la{" "}
            <Link href={localePath("es", "/legal/cancelacion")}>
              política de cancelación y reembolsos
            </Link>{" "}
            y la{" "}
            <Link href={localePath("es", "/legal/privacidad")}>
              política de privacidad
            </Link>
            .
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
      id: "identificacion",
      title: "1. Identificación del establecimiento",
      body: (
        <>
          <p>
            <strong>{SITE.legalName}</strong> es una reserva natural y un
            establecimiento de alojamiento rural ubicado en {contact.street},{" "}
            {contact.locality}, {contact.region}, {contact.country}.
          </p>
          <ul>
            <li>
              <strong>NIT:</strong> <Pending>NIT</Pending>
            </li>
            <li>
              <strong>Registro Nacional de Turismo (RNT):</strong>{" "}
              <Pending>número de RNT</Pending>
            </li>
            <li>
              <strong>Correo electrónico:</strong>{" "}
              <Pending>correo oficial de contacto</Pending>
            </li>
            <li>
              <strong>Teléfono y WhatsApp:</strong>{" "}
              <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "objeto",
      title: "2. Objeto y aceptación",
      body: (
        <>
          <p>
            Estos términos regulan la reserva y el uso de los alojamientos y
            experiencias que La Maima ofrece a través de este sitio web y de sus
            canales de atención. Al enviar una solicitud de reserva, al
            confirmarla o al realizar el pago, el huésped declara que ha leído y
            acepta íntegramente estas condiciones.
          </p>
          <p>
            Quien reserva debe ser <strong>mayor de edad</strong> y responde por
            la veracidad de los datos que suministra y por el cumplimiento de
            estas condiciones por parte de todas las personas incluidas en su
            reserva.
          </p>
        </>
      ),
    },
    {
      id: "proceso",
      title: "3. Proceso de reserva",
      body: (
        <>
          <p>La reserva se hace en cuatro pasos:</p>
          <ol>
            <li>
              El huésped elige el alojamiento y las fechas en el calendario del
              sitio, que muestra la disponibilidad real e incluye las reservas
              recibidas por Airbnb y Booking.com.
            </li>
            <li>
              Envía la solicitud con el número de huéspedes y sus datos de
              contacto.
            </li>
            <li>
              La Maima confirma la disponibilidad y el valor total, e indica el
              medio de pago.
            </li>
            <li>
              <strong>
                La reserva queda en firme únicamente cuando se registra el pago
              </strong>{" "}
              y La Maima envía la confirmación escrita con el número de reserva.
              Hasta ese momento las fechas no están garantizadas, aunque
              aparezcan seleccionadas en el calendario.
            </li>
          </ol>
          <p>
            La disponibilidad publicada se actualiza de forma permanente, pero
            puede variar entre el momento de la consulta y el de la
            confirmación. Si una fecha deja de estar disponible antes de que se
            registre el pago, La Maima lo informará y ofrecerá alternativas o
            devolverá cualquier suma recibida.
          </p>
        </>
      ),
    },
    {
      id: "tarifas",
      title: "4. Tarifas, pagos e impuestos",
      body: (
        <ul>
          <li>
            Todas las tarifas se expresan en{" "}
            <strong>pesos colombianos (COP)</strong>, por noche y por el
            alojamiento completo, e incluyen los impuestos que resulten
            aplicables al servicio de hospedaje.
          </li>
          <li>
            <strong>La tarifa depende del número de huéspedes.</strong> Cada
            alojamiento publica en su ficha una tabla de precios por ocupación;
            el valor de la estadía se calcula con el tramo que corresponda al
            grupo. Por encima del tramo más alto se cobra un{" "}
            <strong>valor por huésped adicional</strong>, también publicado en
            la ficha.
          </li>
          <li>
            <strong>Descuento entre semana.</strong> Las noches de lunes a
            jueves que no sean festivas tienen un{" "}
            <strong>25 % de descuento</strong> sobre la tarifa publicada, salvo
            entre el 14 de diciembre y el 15 de enero. Tres Casitas no aplica
            ese descuento porque publica una tarifa propia de lunes a jueves,
            más baja que la de fin de semana. Una estadía que mezcle noches de
            distinto tipo se cobra noche a noche, y el desglose se muestra antes
            de enviar la solicitud.
          </li>
          <li>
            <strong>Desayuno.</strong> Está incluido en la tarifa de los
            alojamientos que así lo indican en su ficha. En Casa Maima se cobra
            aparte, a <strong>$25.000 por persona</strong>.
          </li>
          <li>
            <strong>Estancia mínima.</strong> En puentes festivos, en Semana
            Santa y entre el 23 de diciembre y el 7 de enero se exige un número
            mínimo de noches, distinto según el alojamiento y publicado en su
            ficha. El calendario de reservas lo verifica antes de permitir la
            solicitud.
          </li>
          <li>
            <strong>Anticipo.</strong> Para reservar se requiere un anticipo del{" "}
            <strong>10 % del valor total</strong>, que se descuenta de la
            estadía. Las condiciones de ese anticipo se detallan en la{" "}
            <Link href={localePath("es", "/legal/cancelacion")}>
              política de cancelación
            </Link>
            .
          </li>
          <li>
            Los pagos en línea se procesan a través de una{" "}
            <strong>pasarela de pagos autorizada</strong>, que admite tarjetas
            de crédito y débito, PSE y billeteras digitales. La Maima no
            almacena los datos de la tarjeta.
          </li>
          <li>
            La tarifa aplicable es la vigente y confirmada por escrito al
            momento de cerrar la reserva; una vez confirmada, no cambia. El
            comprobante de la transacción lo genera la pasarela; la factura
            electrónica, cuando se solicite, la emite La Maima conforme a la
            normativa tributaria vigente.
          </li>
        </ul>
      ),
    },
    {
      id: "capacidad",
      title: "5. Capacidad máxima",
      body: (
        <>
          <p>
            Cada alojamiento tiene una{" "}
            <strong>capacidad máxima publicada</strong> en su ficha, y esa
            capacidad no puede excederse. La cifra responde al número de camas, a
            las condiciones de seguridad y a la carga que la reserva natural
            puede sostener.
          </p>
          <p>
            No se admiten huéspedes adicionales, visitantes ni pernoctaciones no
            declaradas sin autorización previa y por escrito de La Maima. El
            incumplimiento de esta condición da derecho al establecimiento a
            cobrar el valor correspondiente o a dar por terminada la estadía sin
            reembolso.
          </p>
          <p>
            Los menores de edad se cuentan dentro de la capacidad máxima y deben
            estar acompañados en todo momento por un adulto responsable.
          </p>
        </>
      ),
    },
    {
      id: "horarios",
      title: "6. Horarios de entrada y salida",
      body: (
        <>
          <ul>
            <li>
              <strong>Check-in (entrada):</strong> a partir de las{" "}
              <strong>3:00 p. m.</strong> Es posible entrar antes si el
              alojamiento ya está disponible; se coordina con anticipación.
            </li>
            <li>
              <strong>Check-out (salida):</strong> a la{" "}
              <strong>1:00 p. m.</strong> Si no hay una reserva siguiente en el
              mismo alojamiento hay flexibilidad para salir más tarde,
              coordinada directamente con el huésped.
            </li>
          </ul>
          <p>
            Las llegadas fuera del horario establecido deben coordinarse con
            anticipación: el acceso a la reserva es por vía de montaña y no
            siempre hay personal disponible a cualquier hora.
          </p>
          <p>
            Al llegar, todos los huéspedes deben presentar su documento de
            identidad y diligenciar la tarjeta de registro hotelero exigida por
            la normativa turística colombiana.
          </p>
        </>
      ),
    },
    {
      id: "normas",
      title: "7. Normas de la casa y de la reserva natural",
      body: (
        <>
          <p>
            La Maima es una reserva natural en rehabilitación desde hace tres
            décadas. Las normas de convivencia existen para proteger el bosque,
            la fauna y el descanso de los demás huéspedes, y su cumplimiento es
            obligatorio. Con carácter general:
          </p>
          <ul>
            <li>
              <strong>
                Es un lugar de descanso, no para fiestas excesivas.
              </strong>{" "}
              Se respeta el descanso de los demás: nada de música a alto volumen
              ni ruido que se escuche desde los otros alojamientos.
            </li>
            <li>
              <strong>No se permite fumar.</strong>
            </li>
            <li>
              No se enciende fuego fuera de las zonas habilitadas para ello.
            </li>
            <li>
              No se alimenta, persigue ni retira fauna ni flora nativa, y no se
              sale de los senderos señalizados.
            </li>
            <li>
              No se deja basura en el sendero ni en ninguna otra parte del
              hotel: los residuos se separan y se depositan en los puntos
              dispuestos para ello.
            </li>
            <li>
              Cualquier accidente o daño —un vaso roto, por ejemplo— se reporta
              al equipo.{" "}
              <strong>El alojamiento se devuelve como se entrega.</strong>
            </li>
            <li>
              El uso de la piscina natural de río, los senderos y las zonas
              comunes es bajo la responsabilidad de cada huésped.
            </li>
          </ul>

          <h3>Mascotas: La Maima es pet friendly</h3>
          <p>
            Las mascotas son bienvenidas <strong>sin costo adicional</strong>,
            con estas condiciones:
          </p>
          <ul>
            <li>
              El dueño es responsable de su mascota y debe estar pendiente de
              ella en todo momento.
            </li>
            <li>Vacunas y desparasitación al día.</li>
            <li>No se usan las toallas del hotel para los animales.</li>
            <li>
              Los daños o la suciedad excesiva que cause la mascota se reparan o
              se cubren.
            </li>
          </ul>
          <p>
            Al llegar se entrega una guía con las diez reglas de convivencia de
            la reserva.
          </p>

          <h3>Eventos y celebraciones</h3>
          <p>
            Sí se realizan eventos —matrimonios, cenas, almuerzos empresariales,
            cumpleaños— con <strong>cotización a medida</strong>. Cualquier
            celebración debe acordarse previamente con La Maima: no está
            cubierta por la tarifa de alojamiento.
          </p>

          <p>
            El listado completo y actualizado de las normas de la casa se
            entrega junto con la confirmación de la reserva y está disponible en
            cada alojamiento. El incumplimiento grave o reiterado faculta a La
            Maima para dar por terminada la estadía sin derecho a reembolso.
          </p>
        </>
      ),
    },
    {
      id: "gastronomia",
      title: "8. Gastronomía",
      body: (
        <ul>
          <li>
            <strong>Desayuno:</strong> se sirve entre las{" "}
            <strong>8:00 y las 9:30 de la mañana</strong>, todos los días. En
            los alojamientos cuya tarifa lo incluye, también se sirve entre
            semana; en los demás se cobra aparte (ver el punto 4).
          </li>
          <li>
            <strong>Almuerzos:</strong> disponibles los fines de semana y, entre
            semana, para grupos de más de seis personas. Se coordinan con
            anticipación.
          </li>
        </ul>
      ),
    },
    {
      id: "cancelaciones",
      title: "9. Cancelaciones, modificaciones y no presentación",
      body: (
        <p>
          Las condiciones de cancelación, cambio de fechas, no presentación
          (no-show) y reembolso se detallan en la{" "}
          <Link href={localePath("es", "/legal/cancelacion")}>
            política de cancelación y reembolsos
          </Link>
          , que forma parte integral de estos términos.
        </p>
      ),
    },
    {
      id: "responsabilidad",
      title: "10. Responsabilidad",
      body: (
        <>
          <p>
            La Maima responde por la correcta prestación del servicio de
            alojamiento contratado y por el mantenimiento de sus instalaciones
            en condiciones seguras de uso.
          </p>
          <p>
            El huésped reconoce que se hospeda en un{" "}
            <strong>entorno natural de montaña</strong>, con terreno irregular,
            senderos, cuerpos de agua, fauna silvestre y condiciones climáticas
            cambiantes. En consecuencia:
          </p>
          <ul>
            <li>
              Cada huésped es responsable de su propio cuidado, del de los
              menores a su cargo y del uso prudente de senderos, piscina
              natural, zonas de fogata y demás áreas comunes.
            </li>
            <li>
              El huésped responde por los daños que él o sus acompañantes causen
              a las instalaciones, al mobiliario o al entorno natural.
            </li>
            <li>
              La Maima no responde por la pérdida de dinero, joyas, equipos
              electrónicos u otros objetos de valor que el huésped no haya
              entregado en custodia, ni por los objetos dejados dentro de los
              vehículos.
            </li>
            <li>
              La Maima no responde por el incumplimiento derivado de fuerza
              mayor o caso fortuito, incluidos cierres de vía, deslizamientos,
              eventos climáticos extremos, cortes prolongados de servicios
              públicos o decisiones de autoridad.
            </li>
          </ul>
          <p>
            Ninguna de estas previsiones limita los derechos que la ley
            colombiana reconoce al consumidor.
          </p>
        </>
      ),
    },
    {
      id: "consumidor",
      title: "11. Derechos del consumidor",
      body: (
        <>
          <p>
            Estos términos se rigen, además, por el Estatuto del Consumidor (Ley
            1480 de 2011). En particular:
          </p>
          <ul>
            <li>
              <strong>Peticiones, quejas y reclamos:</strong> pueden presentarse
              por WhatsApp al{" "}
              <a href={contact.phoneHref}>{contact.phoneDisplay}</a> o al correo
              electrónico <Pending>correo oficial de contacto</Pending>. Se
              responden dentro de los quince (15) días hábiles siguientes a su
              recepción.
            </li>
            <li>
              <strong>Derecho de retracto:</strong> cuando resulte aplicable
              conforme al artículo 47 de la Ley 1480 de 2011, podrá ejercerse
              dentro de los cinco (5) días hábiles siguientes a la celebración
              del contrato, siempre que la prestación del servicio no haya
              comenzado. El reembolso se realiza dentro de los treinta (30) días
              calendario siguientes a la solicitud.
            </li>
            <li>
              <strong>Reversión del pago:</strong> en las compras realizadas por
              medios electrónicos aplica el mecanismo de reversión previsto en
              el artículo 51 de la Ley 1480 de 2011 y sus normas
              reglamentarias.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "sitio",
      title: "12. Uso del sitio web y propiedad intelectual",
      body: (
        <>
          <p>
            Los textos, fotografías, logotipos y demás contenidos de este sitio
            son propiedad de {SITE.legalName} o se usan con autorización de sus
            titulares. Se permite consultarlos y compartirlos citando la fuente;
            no se permite su reproducción con fines comerciales sin autorización
            previa y escrita.
          </p>
          <p>
            Está prohibido el uso del sitio para fines ilícitos, la extracción
            automatizada masiva de contenido y cualquier conducta que afecte su
            funcionamiento o seguridad. La Maima procura la disponibilidad
            permanente del sitio, pero no garantiza que esté libre de
            interrupciones por mantenimiento o por causas ajenas a su control.
          </p>
        </>
      ),
    },
    {
      id: "datos",
      title: "13. Protección de datos personales",
      body: (
        <p>
          El tratamiento de los datos personales suministrados durante la
          reserva y la estadía se rige por la{" "}
          <Link href={localePath("es", "/legal/privacidad")}>
            política de privacidad y tratamiento de datos personales
          </Link>
          , adoptada conforme a la Ley 1581 de 2012 y al Decreto 1377 de 2013.
        </p>
      ),
    },
    {
      id: "ley",
      title: "14. Ley aplicable, modificaciones y jurisdicción",
      body: (
        <>
          <p>
            Estos términos se rigen por las leyes de la{" "}
            <strong>República de Colombia</strong>. Cualquier controversia que
            no pueda resolverse de común acuerdo se someterá a los jueces
            competentes de la República de Colombia.
          </p>
          <p>
            La Maima puede modificar estos términos para adaptarlos a cambios
            normativos o de operación. La versión aplicable a cada reserva es la
            publicada en este sitio al momento de confirmarla, y la fecha de
            última actualización aparece al comienzo del documento.
          </p>
        </>
      ),
    },
  ];
}

/* ---------------------------------------------------------------------------
 * English
 * ------------------------------------------------------------------------- */

function sectionsEn(contact: ContactInfo): LegalSection[] {
  const P = (props: { children: string }) => (
    <Pending locale="en">{props.children}</Pending>
  );

  return [
    {
      id: "identificacion",
      title: "1. Details of the establishment",
      body: (
        <>
          <p>
            <strong>{SITE.legalName}</strong> is a nature reserve and rural
            accommodation business located at {contact.street},{" "}
            {contact.locality}, {contact.region}, {contact.country}.
          </p>
          <ul>
            <li>
              <strong>Tax ID (NIT):</strong> <P>NIT</P>
            </li>
            <li>
              <strong>National Tourism Registry (RNT):</strong> <P>RNT number</P>
            </li>
            <li>
              <strong>Email:</strong> <P>official contact email address</P>
            </li>
            <li>
              <strong>Phone and WhatsApp:</strong>{" "}
              <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "objeto",
      title: "2. Purpose and acceptance",
      body: (
        <>
          <p>
            These terms govern the booking and use of the accommodation and
            experiences that La Maima offers through this website and its other
            channels. By sending a booking request, confirming it or making
            payment, the guest declares that they have read and fully accept
            these conditions.
          </p>
          <p>
            Whoever makes the booking must be{" "}
            <strong>of legal age</strong> and is responsible for the accuracy of
            the information provided and for compliance with these conditions by
            everyone included in the booking.
          </p>
        </>
      ),
    },
    {
      id: "proceso",
      title: "3. Booking process",
      body: (
        <>
          <p>Booking takes four steps:</p>
          <ol>
            <li>
              The guest chooses the house and the dates on the site&apos;s
              calendar, which shows real availability and includes bookings
              received through Airbnb and Booking.com.
            </li>
            <li>
              They send the request with the number of guests and their contact
              details.
            </li>
            <li>
              La Maima confirms availability and the total amount, and indicates
              how to pay.
            </li>
            <li>
              <strong>
                The booking is only firm once payment has been registered
              </strong>{" "}
              and La Maima sends written confirmation with the booking number.
              Until then the dates are not guaranteed, even if they appear
              selected on the calendar.
            </li>
          </ol>
          <p>
            Published availability is updated continuously, but it may change
            between the moment of the enquiry and the confirmation. If a date
            stops being available before payment is registered, La Maima will say
            so and will offer alternatives or return any amount received.
          </p>
        </>
      ),
    },
    {
      id: "tarifas",
      title: "4. Rates, payments and taxes",
      body: (
        <ul>
          <li>
            All rates are quoted in{" "}
            <strong>Colombian pesos (COP)</strong>, per night and for the whole
            house, and include any taxes applicable to the accommodation
            service.
          </li>
          <li>
            <strong>The rate depends on the number of guests.</strong> Each
            house publishes a table of prices by occupancy on its page; the value
            of the stay is calculated using the band that matches the group.
            Above the highest band an{" "}
            <strong>extra guest charge</strong> applies, also published on the
            page.
          </li>
          <li>
            <strong>Midweek discount.</strong> Monday to Thursday nights that
            are not public holidays carry a{" "}
            <strong>25 % discount</strong> on the published rate, except between
            14 December and 15 January. Tres Casitas does not apply that discount
            because it publishes its own Monday-to-Thursday rate, lower than its
            weekend one. A stay that mixes different kinds of night is charged
            night by night, and the breakdown is shown before you send the
            request.
          </li>
          <li>
            <strong>Breakfast.</strong> It is included in the rate of the houses
            whose page says so. At Casa Maima it is charged separately, at{" "}
            <strong>$25.000 COP per person</strong>.
          </li>
          <li>
            <strong>Minimum stay.</strong> Over long holiday weekends, during
            Easter Week and between 23 December and 7 January a minimum number of
            nights applies, different for each house and published on its page.
            The booking calendar checks it before allowing the request.
          </li>
          <li>
            <strong>Deposit.</strong> Booking requires a deposit of{" "}
            <strong>10 % of the total value</strong>, which is deducted from the
            stay. The conditions of that deposit are set out in the{" "}
            <Link href={localePath("en", "/legal/cancelacion")}>
              cancellation policy
            </Link>
            .
          </li>
          <li>
            Online payments are processed through an{" "}
            <strong>authorised payment gateway</strong>, which accepts credit
            and debit cards, PSE bank transfers and digital wallets. La Maima
            does not store card details.
          </li>
          <li>
            The applicable rate is the one in force and confirmed in writing when
            the booking is closed; once confirmed, it does not change. The
            transaction receipt is generated by the gateway; the electronic
            invoice, where requested, is issued by La Maima in accordance with
            Colombian tax regulations.
          </li>
        </ul>
      ),
    },
    {
      id: "capacidad",
      title: "5. Maximum capacity",
      body: (
        <>
          <p>
            Each house has a <strong>published maximum capacity</strong> on its
            page, and that capacity cannot be exceeded. The figure reflects the
            number of beds, safety conditions and the load the nature reserve can
            sustain.
          </p>
          <p>
            Extra guests, visitors or undeclared overnight stays are not allowed
            without prior written authorisation from La Maima. Breaching this
            condition entitles the establishment to charge the corresponding
            amount or to end the stay without a refund.
          </p>
          <p>
            Children count towards the maximum capacity and must be accompanied
            at all times by a responsible adult.
          </p>
        </>
      ),
    },
    {
      id: "horarios",
      title: "6. Check-in and check-out times",
      body: (
        <>
          <ul>
            <li>
              <strong>Check-in:</strong> from <strong>3:00 p.m.</strong> Earlier
              arrival is possible if the house is already available; please
              arrange it in advance.
            </li>
            <li>
              <strong>Check-out:</strong> at <strong>1:00 p.m.</strong> If there
              is no following booking in the same house there is flexibility to
              leave later, arranged directly with the guest.
            </li>
          </ul>
          <p>
            Arrivals outside these hours must be arranged in advance: the reserve
            is reached by mountain road and staff are not always available at any
            hour.
          </p>
          <p>
            On arrival, all guests must show their identity document and fill in
            the hotel registration card required by Colombian tourism
            regulations.
          </p>
        </>
      ),
    },
    {
      id: "normas",
      title: "7. House rules and rules of the nature reserve",
      body: (
        <>
          <p>
            La Maima has been a nature reserve under restoration for three
            decades. The house rules exist to protect the forest, the wildlife
            and the rest of other guests, and following them is mandatory. In
            general terms:
          </p>
          <ul>
            <li>
              <strong>
                This is a place to rest, not a place for loud parties.
              </strong>{" "}
              Please respect other people&apos;s rest: no loud music and no noise
              that can be heard from the other houses.
            </li>
            <li>
              <strong>Smoking is not allowed.</strong>
            </li>
            <li>No fires outside the areas set aside for them.</li>
            <li>
              Do not feed, chase or remove native wildlife or plants, and do not
              leave the signposted trails.
            </li>
            <li>
              Do not leave rubbish on the trail or anywhere else on the property:
              waste is separated and left at the points provided.
            </li>
            <li>
              Report any accident or damage —a broken glass, for instance— to the
              team. <strong>The house is returned as it was handed over.</strong>
            </li>
            <li>
              Use of the natural river pool, the trails and the common areas is
              at each guest&apos;s own risk.
            </li>
          </ul>

          <h3>Pets: La Maima is pet friendly</h3>
          <p>
            Pets are welcome <strong>at no extra cost</strong>, on these
            conditions:
          </p>
          <ul>
            <li>
              The owner is responsible for their pet and must keep an eye on it
              at all times.
            </li>
            <li>Vaccinations and deworming up to date.</li>
            <li>Hotel towels are not to be used for animals.</li>
            <li>
              Any damage or excessive mess caused by the pet is repaired or paid
              for.
            </li>
          </ul>
          <p>
            On arrival we hand over a guide with the reserve&apos;s ten house
            rules.
          </p>

          <h3>Events and celebrations</h3>
          <p>
            We do host events —weddings, dinners, corporate lunches, birthdays—
            with a <strong>tailored quote</strong>. Any celebration must be
            agreed with La Maima in advance: it is not covered by the
            accommodation rate.
          </p>

          <p>
            The full, up-to-date list of house rules is provided with the booking
            confirmation and is available in every house. Serious or repeated
            breaches entitle La Maima to end the stay with no right to a refund.
          </p>
        </>
      ),
    },
    {
      id: "gastronomia",
      title: "8. Food and drink",
      body: (
        <ul>
          <li>
            <strong>Breakfast:</strong> served between{" "}
            <strong>8:00 and 9:30 in the morning</strong>, every day. In the
            houses whose rate includes it, it is also served midweek; in the
            others it is charged separately (see section 4).
          </li>
          <li>
            <strong>Lunches:</strong> available at weekends and, midweek, for
            groups of more than six. Please arrange them in advance.
          </li>
        </ul>
      ),
    },
    {
      id: "cancelaciones",
      title: "9. Cancellations, changes and no-shows",
      body: (
        <p>
          The conditions for cancellation, date changes, no-shows and refunds are
          set out in the{" "}
          <Link href={localePath("en", "/legal/cancelacion")}>
            cancellation and refund policy
          </Link>
          , which forms an integral part of these terms.
        </p>
      ),
    },
    {
      id: "responsabilidad",
      title: "10. Liability",
      body: (
        <>
          <p>
            La Maima is responsible for properly providing the accommodation
            service booked and for keeping its facilities in safe working
            condition.
          </p>
          <p>
            The guest acknowledges that they are staying in a{" "}
            <strong>natural mountain environment</strong>, with uneven ground,
            trails, bodies of water, wildlife and changeable weather.
            Accordingly:
          </p>
          <ul>
            <li>
              Each guest is responsible for their own safety, for that of any
              minors in their care, and for the sensible use of the trails, the
              natural pool, the fire pit areas and the other common areas.
            </li>
            <li>
              The guest is liable for damage that they or their companions cause
              to the facilities, the furniture or the natural surroundings.
            </li>
            <li>
              La Maima is not liable for the loss of money, jewellery, electronic
              equipment or other valuables that the guest has not handed over for
              safekeeping, nor for items left inside vehicles.
            </li>
            <li>
              La Maima is not liable for non-performance caused by force majeure,
              including road closures, landslides, extreme weather, prolonged
              utility outages or decisions by the authorities.
            </li>
          </ul>
          <p>
            None of these provisions limits the rights that Colombian law grants
            to consumers.
          </p>
        </>
      ),
    },
    {
      id: "consumidor",
      title: "11. Consumer rights",
      body: (
        <>
          <p>
            These terms are also governed by the Colombian Consumer Statute (Law
            1480 of 2011). In particular:
          </p>
          <ul>
            <li>
              <strong>Requests, complaints and claims:</strong> may be submitted
              by WhatsApp at{" "}
              <a href={contact.phoneHref}>{contact.phoneDisplay}</a> or by email
              to <P>official contact email address</P>. They are answered within
              fifteen (15) business days of receipt.
            </li>
            <li>
              <strong>Right of withdrawal:</strong> where applicable under
              article 47 of Law 1480 of 2011, it may be exercised within five (5)
              business days of entering into the contract, provided the service
              has not started. The refund is made within thirty (30) calendar
              days of the request.
            </li>
            <li>
              <strong>Payment reversal:</strong> for purchases made by electronic
              means, the reversal mechanism in article 51 of Law 1480 of 2011 and
              its implementing rules applies.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "sitio",
      title: "12. Use of the website and intellectual property",
      body: (
        <>
          <p>
            The texts, photographs, logos and other content on this site belong
            to {SITE.legalName} or are used with the permission of their owners.
            You may consult and share them citing the source; reproducing them
            for commercial purposes without prior written permission is not
            allowed.
          </p>
          <p>
            Using the site for unlawful purposes, mass automated scraping of its
            content and any conduct that affects its operation or security are
            prohibited. La Maima aims to keep the site permanently available but
            does not guarantee that it will be free from interruptions for
            maintenance or for reasons beyond its control.
          </p>
        </>
      ),
    },
    {
      id: "datos",
      title: "13. Personal data protection",
      body: (
        <p>
          The processing of personal data provided during booking and the stay is
          governed by the{" "}
          <Link href={localePath("en", "/legal/privacidad")}>
            privacy and personal data policy
          </Link>
          , adopted in accordance with Colombian Law 1581 of 2012 and Decree 1377
          of 2013.
        </p>
      ),
    },
    {
      id: "ley",
      title: "14. Governing law, changes and jurisdiction",
      body: (
        <>
          <p>
            These terms are governed by the laws of the{" "}
            <strong>Republic of Colombia</strong>. Any dispute that cannot be
            resolved by agreement will be submitted to the competent courts of
            the Republic of Colombia.
          </p>
          <p>
            La Maima may amend these terms to adapt them to regulatory or
            operational changes. The version that applies to each booking is the
            one published on this site at the time it is confirmed, and the
            last-updated date appears at the top of the document.
          </p>
        </>
      ),
    },
  ];
}
