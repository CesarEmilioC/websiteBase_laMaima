import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalDocument,
  Pending,
  type LegalSection,
} from "@/components/legal/legal-document";
import { getContactInfo } from "@/lib/content";
import { LEGAL_UPDATED } from "@/lib/legal";
import { LEGAL_LINKS, SITE } from "@/lib/site";

export const revalidate = 3600;

const DOC = LEGAL_LINKS[1];

export const metadata: Metadata = {
  title: "Términos y condiciones de reserva",
  description:
    "Condiciones de reserva y hospedaje en La Maima — Hotel Campestre: tarifas por ocupación con descuento entre semana, anticipo del 10 %, estancias mínimas, check-in 3:00 p. m. y check-out 1:00 p. m., mascotas, eventos y normas de la reserva natural.",
  alternates: { canonical: DOC.href },
  openGraph: {
    title: "Términos y condiciones · La Maima",
    description:
      "Condiciones de reserva, pago, capacidad, horarios y normas de La Maima — Hotel Campestre.",
    url: DOC.href,
  },
};

export default async function TermsPage() {
  const contact = await getContactInfo();

  const sections: LegalSection[] = [
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
        <>
          <ul>
            <li>
              Todas las tarifas se expresan en{" "}
              <strong>pesos colombianos (COP)</strong>, por noche y por el
              alojamiento completo, e incluyen los impuestos que resulten
              aplicables al servicio de hospedaje.
            </li>
            <li>
              <strong>La tarifa depende del número de huéspedes.</strong> Cada
              alojamiento publica en su ficha una tabla de precios por
              ocupación; el valor de la estadía se calcula con el tramo que
              corresponda al grupo. Por encima del tramo más alto se cobra un{" "}
              <strong>valor por huésped adicional</strong>, también publicado en
              la ficha.
            </li>
            <li>
              <strong>Descuento entre semana.</strong> Las noches de lunes a
              jueves que no sean festivas tienen un{" "}
              <strong>25 % de descuento</strong> sobre la tarifa publicada,
              salvo entre el 14 de diciembre y el 15 de enero. Tres Casitas no
              aplica ese descuento porque publica una tarifa propia de lunes a
              jueves, más baja que la de fin de semana. Una estadía que mezcle
              noches de distinto tipo se cobra noche a noche, y el desglose se
              muestra antes de enviar la solicitud.
            </li>
            <li>
              <strong>Desayuno.</strong> Está incluido en la tarifa de los
              alojamientos que así lo indican en su ficha. En Casa Maima se
              cobra aparte, a <strong>$25.000 por persona</strong>.
            </li>
            <li>
              <strong>Estancia mínima.</strong> En puentes festivos, en Semana
              Santa y entre el 23 de diciembre y el 7 de enero se exige un
              número mínimo de noches, distinto según el alojamiento y publicado
              en su ficha. El calendario de reservas lo verifica antes de
              permitir la solicitud.
            </li>
            <li>
              <strong>Anticipo.</strong> Para reservar se requiere un anticipo
              del <strong>10 % del valor total</strong>, que se descuenta de la
              estadía. Las condiciones de ese anticipo se detallan en la{" "}
              <Link href="/legal/cancelacion">política de cancelación</Link>.
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
        </>
      ),
    },
    {
      id: "capacidad",
      title: "5. Capacidad máxima",
      body: (
        <>
          <p>
            Cada alojamiento tiene una <strong>capacidad máxima publicada</strong>{" "}
            en su ficha, y esa capacidad no puede excederse. La cifra responde
            al número de camas, a las condiciones de seguridad y a la carga que
            la reserva natural puede sostener.
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
              <strong>Es un lugar de descanso, no para fiestas excesivas.</strong>{" "}
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
              al equipo. <strong>El alojamiento se devuelve como se entrega.</strong>
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
            celebración debe acordarse previamente con La Maima: no está cubierta
            por la tarifa de alojamiento.
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
        <>
          <ul>
            <li>
              <strong>Desayuno:</strong> se sirve entre las{" "}
              <strong>8:00 y las 9:30 de la mañana</strong>, todos los días. En
              los alojamientos cuya tarifa lo incluye, también se sirve entre
              semana; en los demás se cobra aparte (ver el punto 4).
            </li>
            <li>
              <strong>Almuerzos:</strong> disponibles los fines de semana y,
              entre semana, para grupos de más de seis personas. Se coordinan
              con anticipación.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "cancelaciones",
      title: "9. Cancelaciones, modificaciones y no presentación",
      body: (
        <p>
          Las condiciones de cancelación, cambio de fechas, no presentación
          (no-show) y reembolso se detallan en la{" "}
          <Link href="/legal/cancelacion">
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
              menores a su cargo y del uso prudente de senderos, piscina natural,
              zonas de fogata y demás áreas comunes.
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
              La Maima no responde por el incumplimiento derivado de fuerza mayor
              o caso fortuito, incluidos cierres de vía, deslizamientos, eventos
              climáticos extremos, cortes prolongados de servicios públicos o
              decisiones de autoridad.
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
            Estos términos se rigen, además, por el Estatuto del Consumidor
            (Ley 1480 de 2011). En particular:
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
              medios electrónicos aplica el mecanismo de reversión previsto en el
              artículo 51 de la Ley 1480 de 2011 y sus normas reglamentarias.
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
          <Link href="/legal/privacidad">
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

  return (
    <LegalDocument
      title="Términos y condiciones de reserva"
      current={DOC.href}
      intro="Condiciones que rigen la reserva y la estadía en La Maima: cómo se calcula la tarifa según el número de huéspedes, el anticipo, las estancias mínimas por temporada, los horarios de entrada y salida, las mascotas y las normas de la reserva natural."
      updated={LEGAL_UPDATED}
      sections={sections}
      footnote={
        <p>
          Al confirmar una reserva se aceptan también la{" "}
          <Link href="/legal/cancelacion">
            política de cancelación y reembolsos
          </Link>{" "}
          y la{" "}
          <Link href="/legal/privacidad">política de privacidad</Link>.
        </p>
      }
    />
  );
}
