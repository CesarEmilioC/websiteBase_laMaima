import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalDocument,
  Pending,
  type LegalSection,
} from "@/components/legal/legal-document";
import { getContactInfo, getOgImage, type ContactInfo } from "@/lib/content";
import { localePath, type Locale } from "@/lib/i18n/config";
import { LEGAL_UPDATED, LEGAL_UPDATED_EN, SIC } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

const PATH = "/legal/privacidad";

/**
 * `generateMetadata` y no un objeto: los documentos legales no tienen foto
 * propia y deben caer en la del sitio, que se edita en `/admin/contenido`.
 */
export async function privacyMetadata(locale: Locale): Promise<Metadata> {
  const ogImage = await getOgImage(locale);
  const english = locale === "en";

  return pageMetadata({
    title: english
      ? "Privacy and personal data policy"
      : "Política de privacidad y tratamiento de datos",
    description: english
      ? "How La Maima handles its guests' personal data under Colombian Law 1581 of 2012: purposes, data subject rights and the channel to exercise them."
      : "Cómo trata La Maima los datos personales de sus huéspedes conforme a la Ley 1581 de 2012: finalidades, derechos del titular y canal para ejercerlos.",
    path: PATH,
    image: { url: ogImage.url, alt: ogImage.alt },
    socialTitle: english
      ? "Privacy policy · La Maima"
      : "Política de privacidad · La Maima",
    socialDescription: english
      ? "Personal data processing at La Maima — Hotel Campestre (Colombian Law 1581 of 2012)."
      : "Tratamiento de datos personales en La Maima — Hotel Campestre (Ley 1581 de 2012).",
    locale,
  });
}

export async function PrivacyPage({ locale }: { locale: Locale }) {
  const contact = await getContactInfo();
  const english = locale === "en";

  return (
    <LegalDocument
      locale={locale}
      /* El título de la PÁGINA es más largo que el del enlace del pie
         (`legalLink("privacy")`), a propósito: ahí manda la brevedad y aquí, el
         nombre completo del documento. */
      title={
        english
          ? "Privacy and personal data policy"
          : "Política de privacidad y tratamiento de datos personales"
      }
      current={PATH}
      intro={
        english
          ? "How we collect, use and protect the personal data of everyone who books and stays at La Maima, in accordance with Colombian Law 1581 of 2012 and Decree 1377 of 2013."
          : "Cómo recogemos, usamos y protegemos los datos personales de quienes reservan y se hospedan en La Maima, conforme a la Ley 1581 de 2012 y al Decreto 1377 de 2013."
      }
      updated={english ? LEGAL_UPDATED_EN : LEGAL_UPDATED}
      sections={english ? sectionsEn(contact) : sectionsEs(contact)}
      footnote={
        english ? (
          <p>
            This document is complemented by the{" "}
            <Link href={localePath("en", "/legal/terminos")}>
              booking terms and conditions
            </Link>{" "}
            and the{" "}
            <Link href={localePath("en", "/legal/cancelacion")}>
              cancellation and refund policy
            </Link>
            .
          </p>
        ) : (
          <p>
            Este documento se complementa con los{" "}
            <Link href={localePath("es", "/legal/terminos")}>
              términos y condiciones de reserva
            </Link>{" "}
            y con la{" "}
            <Link href={localePath("es", "/legal/cancelacion")}>
              política de cancelación y reembolsos
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
      id: "responsable",
      title: "1. Responsable del tratamiento",
      body: (
        <>
          <p>
            El responsable del tratamiento de los datos personales recogidos a
            través de este sitio web y de los canales de reserva de{" "}
            <strong>{SITE.legalName}</strong> es:
          </p>
          <ul>
            <li>
              <strong>Razón social:</strong> {SITE.legalName}{" "}
              <Pending>
                razón social exacta inscrita en la Cámara de Comercio
              </Pending>
            </li>
            <li>
              <strong>NIT:</strong> <Pending>NIT</Pending>
            </li>
            <li>
              <strong>Registro Nacional de Turismo (RNT):</strong>{" "}
              <Pending>número de RNT</Pending>
            </li>
            <li>
              <strong>Domicilio:</strong> {contact.street}, {contact.locality},{" "}
              {contact.region}, {contact.country}.
            </li>
            <li>
              <strong>Teléfono y WhatsApp:</strong>{" "}
              <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
            </li>
            <li>
              <strong>
                Correo electrónico para asuntos de datos personales:
              </strong>{" "}
              <Pending>correo oficial de contacto</Pending>
            </li>
          </ul>
          <p>
            En adelante, «La Maima», «nosotros» o «el establecimiento». Quien
            entrega sus datos personales es «el titular».
          </p>
        </>
      ),
    },
    {
      id: "marco",
      title: "2. Marco legal y alcance",
      body: (
        <>
          <p>
            Esta política se adopta en cumplimiento de la{" "}
            <strong>Ley 1581 de 2012</strong>, del{" "}
            <strong>Decreto 1377 de 2013</strong> (hoy compilado en el Decreto
            Único Reglamentario 1074 de 2015) y de las demás normas que regulan
            la protección de datos personales en la República de Colombia.
          </p>
          <p>
            Aplica a todos los datos personales que La Maima recoge y administra
            en su condición de responsable, ya sea a través de este sitio web,
            de WhatsApp, del teléfono, del correo electrónico, del registro de
            huéspedes en el establecimiento o de cualquier otro canal de
            atención.
          </p>
          <p>
            Al enviar una solicitud de reserva, al registrarse como huésped o al
            comunicarse con nosotros por cualquiera de esos canales, el titular
            declara que conoce esta política y autoriza el tratamiento de sus
            datos personales en los términos aquí descritos.
          </p>
        </>
      ),
    },
    {
      id: "datos",
      title: "3. Datos personales que recogemos",
      body: (
        <>
          <p>
            Solo pedimos los datos necesarios para atender la reserva y prestar
            el servicio de alojamiento. En concreto:
          </p>
          <ul>
            <li>
              <strong>Datos de identificación y contacto:</strong> nombre y
              apellidos, número de documento de identidad, número de teléfono o
              WhatsApp y correo electrónico.
            </li>
            <li>
              <strong>Datos de la reserva:</strong> alojamiento elegido, fechas
              de entrada y salida, número de huéspedes, valor total, estado del
              pago y canal por el que llegó la reserva (sitio web, WhatsApp,
              Airbnb o Booking.com).
            </li>
            <li>
              <strong>Datos de facturación:</strong> los que exija la normativa
              tributaria cuando se solicite factura electrónica.
            </li>
            <li>
              <strong>Datos de pago:</strong> los pagos en línea se procesan
              íntegramente en la plataforma de la pasarela de pagos. La Maima{" "}
              <strong>no almacena</strong> números completos de tarjetas ni
              claves; solo conserva la referencia de la transacción y su estado.
            </li>
            <li>
              <strong>Datos técnicos de navegación:</strong> el sitio utiliza
              únicamente las cookies estrictamente necesarias para su
              funcionamiento —incluida la que recuerda el idioma elegido en el
              conmutador— y, en su caso, herramientas de medición agregada de
              audiencia. No se elaboran perfiles individuales con esa
              información.
            </li>
          </ul>
          <p>
            <strong>No solicitamos datos sensibles</strong> (origen racial o
            étnico, convicciones religiosas o filosóficas, afiliación política o
            sindical, datos de salud, datos biométricos o de vida sexual). Si un
            huésped decide informarnos voluntariamente alguna condición de
            salud, alergia o requerimiento de accesibilidad para prestarle un
            mejor servicio, ese dato se tratará con carácter reservado, solo
            para esa finalidad, y su entrega es enteramente facultativa.
          </p>
          <p>
            Cuando la reserva incluya{" "}
            <strong>niñas, niños o adolescentes</strong>, los datos serán
            suministrados por el adulto responsable, se limitarán a los
            estrictamente necesarios y se tratarán atendiendo al interés
            superior del menor, conforme al artículo 7 de la Ley 1581 de 2012.
          </p>
        </>
      ),
    },
    {
      id: "finalidades",
      title: "4. Finalidades del tratamiento",
      body: (
        <>
          <p>Los datos personales se tratan para:</p>
          <ul>
            <li>
              <strong>Gestionar la reserva:</strong> verificar disponibilidad,
              confirmar fechas y tarifas, procesar el pago, emitir la
              confirmación y bloquear el calendario del alojamiento.
            </li>
            <li>
              <strong>Prestar el servicio:</strong> registrar la llegada y la
              salida, atender solicitudes durante la estadía y coordinar las
              experiencias contratadas.
            </li>
            <li>
              <strong>Comunicaciones propias del servicio:</strong> enviar por
              correo electrónico o WhatsApp la confirmación, los recordatorios,
              las indicaciones para llegar y cualquier aviso relevante sobre la
              reserva.
            </li>
            <li>
              <strong>Atender peticiones, quejas y reclamos</strong> y dejar
              constancia de su trámite.
            </li>
            <li>
              <strong>Cumplir obligaciones legales:</strong> facturación,
              contabilidad, obligaciones tributarias, el registro de huéspedes
              exigido por la normativa turística y la atención de requerimientos
              de autoridades competentes.
            </li>
            <li>
              <strong>Enviar información comercial</strong> sobre promociones,
              temporadas o novedades de La Maima,{" "}
              <strong>únicamente si el titular lo autoriza expresamente</strong>{" "}
              y con la posibilidad de darse de baja en cualquier momento.
            </li>
          </ul>
          <p>
            Los datos no se utilizan para finalidades distintas de las
            enunciadas ni se venden a terceros.
          </p>
        </>
      ),
    },
    {
      id: "autorizacion",
      title: "5. Autorización del titular",
      body: (
        <>
          <p>
            La autorización se obtiene antes de tratar los datos, por medios que
            permitan conservar prueba de ella: la aceptación expresa de esta
            política al enviar una solicitud de reserva desde el sitio web, la
            firma de la tarjeta de registro al llegar al establecimiento o la
            conversación escrita por WhatsApp o correo electrónico en la que el
            titular entrega sus datos con el fin de reservar.
          </p>
          <p>
            La entrega de los datos marcados como necesarios es voluntaria, pero
            sin ellos no es posible formalizar ni confirmar una reserva. La
            autorización para recibir información comercial es siempre opcional
            y separada.
          </p>
        </>
      ),
    },
    {
      id: "derechos",
      title: "6. Derechos del titular",
      body: (
        <>
          <p>
            De acuerdo con el artículo 8 de la Ley 1581 de 2012, el titular de
            los datos tiene derecho a:
          </p>
          <ul>
            <li>
              <strong>Conocer</strong> los datos personales sobre los cuales La
              Maima realiza el tratamiento, de forma gratuita.
            </li>
            <li>
              <strong>Actualizar y rectificar</strong> los datos parciales,
              inexactos, incompletos, fraccionados o que induzcan a error.
            </li>
            <li>
              <strong>Solicitar la supresión</strong> de sus datos cuando el
              tratamiento no respete los principios, derechos y garantías
              legales, o cuando ya no sean necesarios para la finalidad
              autorizada.
            </li>
            <li>
              <strong>Revocar la autorización</strong> otorgada para el
              tratamiento.
            </li>
            <li>
              <strong>Solicitar prueba de la autorización</strong> concedida,
              salvo en los casos en que la ley no la exige.
            </li>
            <li>
              <strong>Ser informado</strong>, previa solicitud, sobre el uso que
              se les ha dado a sus datos personales.
            </li>
            <li>
              <strong>Presentar quejas</strong> ante la{" "}
              <a href={SIC.url} target="_blank" rel="noopener noreferrer">
                {SIC.name}
              </a>{" "}
              por infracciones a la normativa de protección de datos, una vez
              agotado el trámite de consulta o reclamo ante La Maima.
            </li>
          </ul>
          <p>
            La supresión y la revocación no proceden cuando exista un deber
            legal o contractual que obligue a conservar la información, como los
            plazos de conservación tributarios y contables.
          </p>
        </>
      ),
    },
    {
      id: "canal",
      title: "7. Canal y procedimiento para ejercer los derechos",
      body: (
        <>
          <p>
            El titular, sus causahabientes o su representante pueden ejercer sus
            derechos por cualquiera de estos medios:
          </p>
          <ul>
            <li>
              <strong>Correo electrónico:</strong>{" "}
              <Pending>correo oficial de contacto</Pending>
            </li>
            <li>
              <strong>WhatsApp o teléfono:</strong>{" "}
              <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
            </li>
            <li>
              <strong>Dirección física:</strong> {contact.addressLine}
            </li>
          </ul>
          <p>
            La solicitud debe indicar el nombre completo del titular, un dato de
            contacto para la respuesta, la descripción de los hechos y lo que se
            pide. Los plazos de respuesta son los que fija la ley:
          </p>
          <ul>
            <li>
              <strong>Consultas:</strong> se atienden en un término máximo de{" "}
              <strong>diez (10) días hábiles</strong>, prorrogable hasta por
              cinco (5) días hábiles más, informando los motivos de la prórroga.
            </li>
            <li>
              <strong>Reclamos:</strong> se atienden en un término máximo de{" "}
              <strong>quince (15) días hábiles</strong>, prorrogable hasta por
              ocho (8) días hábiles más. Si el reclamo está incompleto, se
              solicitará al interesado que lo corrija dentro de los cinco (5)
              días siguientes; transcurridos dos (2) meses sin respuesta, se
              entenderá desistido.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "terceros",
      title: "8. Encargados, transmisión y transferencia de datos",
      body: (
        <>
          <p>
            Para prestar el servicio, La Maima se apoya en proveedores que
            actúan como <strong>encargados del tratamiento</strong> y solo
            pueden usar los datos siguiendo nuestras instrucciones:
          </p>
          <ul>
            <li>
              Proveedores de alojamiento del sitio web y de base de datos
              (infraestructura en la nube).
            </li>
            <li>
              La <strong>pasarela de pagos</strong>, que procesa la transacción y
              conserva los datos financieros bajo sus propios estándares de
              seguridad.
            </li>
            <li>
              El proveedor de <strong>correo electrónico transaccional</strong>,
              que entrega las confirmaciones de reserva.
            </li>
            <li>
              Las <strong>plataformas de reserva</strong> (Airbnb, Booking.com)
              cuando la reserva se origina en ellas; en ese caso, cada
              plataforma es responsable de los datos que recoge y aplica su
              propia política de privacidad.
            </li>
            <li>
              Asesores contables y tributarios, para el cumplimiento de
              obligaciones legales.
            </li>
          </ul>
          <p>
            Algunos de estos proveedores operan servidores fuera de Colombia. En
            esos casos, la transmisión internacional de datos se realiza al
            amparo del artículo 26 de la Ley 1581 de 2012 y de la autorización
            otorgada por el titular, exigiendo a cada proveedor niveles
            adecuados de seguridad y confidencialidad.
          </p>
          <p>
            Fuera de estos supuestos, los datos no se comparten con terceros,
            salvo requerimiento de autoridad judicial o administrativa
            competente.
          </p>
        </>
      ),
    },
    {
      id: "seguridad",
      title: "9. Seguridad y conservación de la información",
      body: (
        <>
          <p>
            La Maima aplica medidas técnicas, humanas y administrativas
            razonables para proteger los datos personales frente a adulteración,
            pérdida, consulta, uso o acceso no autorizado: conexión cifrada
            (HTTPS) en todo el sitio, acceso al panel de administración
            restringido por usuario y contraseña, y separación estricta entre la
            información pública del sitio y los datos de las reservas, que nunca
            se exponen al público. El calendario de disponibilidad publica
            únicamente fechas ocupadas, sin ningún dato del huésped.
          </p>
          <p>
            Los datos se conservan mientras dure la relación con el huésped y,
            después, durante los plazos que exijan las obligaciones legales,
            contables y tributarias aplicables. Cumplidos esos plazos, se
            suprimen o se anonimizan.
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      title: "10. Cookies",
      body: (
        <>
          <p>
            Este sitio utiliza cookies y almacenamiento local estrictamente
            necesarios para su funcionamiento —por ejemplo, para mantener la
            sesión del panel de administración o para recordar si prefieres ver
            el sitio en español o en inglés— y, cuando corresponda, herramientas
            de analítica que miden el uso del sitio de forma agregada.
          </p>
          <p>
            El titular puede configurar su navegador para bloquear o eliminar
            las cookies. Hacerlo no impide navegar por el sitio, aunque puede
            afectar el funcionamiento de algunas secciones.
          </p>
        </>
      ),
    },
    {
      id: "vigencia",
      title: "11. Vigencia y cambios",
      body: (
        <>
          <p>
            Esta política rige desde su publicación y permanece vigente mientras
            La Maima desarrolle su actividad. Las bases de datos se conservarán
            durante el tiempo necesario para cumplir las finalidades descritas y
            los deberes legales de conservación.
          </p>
          <p>
            Cualquier cambio sustancial se comunicará a través de este sitio web
            antes de su entrada en vigor y quedará reflejado en la fecha de
            última actualización que aparece al comienzo del documento.
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
      id: "responsable",
      title: "1. Data controller",
      body: (
        <>
          <p>
            The controller of the personal data collected through this website
            and through the booking channels of{" "}
            <strong>{SITE.legalName}</strong> is:
          </p>
          <ul>
            <li>
              <strong>Registered name:</strong> {SITE.legalName}{" "}
              <P>exact registered name filed with the Chamber of Commerce</P>
            </li>
            <li>
              <strong>Tax ID (NIT):</strong> <P>NIT</P>
            </li>
            <li>
              <strong>National Tourism Registry (RNT):</strong> <P>RNT number</P>
            </li>
            <li>
              <strong>Address:</strong> {contact.street}, {contact.locality},{" "}
              {contact.region}, {contact.country}.
            </li>
            <li>
              <strong>Phone and WhatsApp:</strong>{" "}
              <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
            </li>
            <li>
              <strong>Email for personal data matters:</strong>{" "}
              <P>official contact email address</P>
            </li>
          </ul>
          <p>
            Referred to below as &laquo;La Maima&raquo;, &laquo;we&raquo; or
            &laquo;the establishment&raquo;. Whoever provides their personal data
            is &laquo;the data subject&raquo;.
          </p>
        </>
      ),
    },
    {
      id: "marco",
      title: "2. Legal framework and scope",
      body: (
        <>
          <p>
            This policy is adopted in compliance with{" "}
            <strong>Colombian Law 1581 of 2012</strong>,{" "}
            <strong>Decree 1377 of 2013</strong> (now compiled in Single
            Regulatory Decree 1074 of 2015) and the other rules governing
            personal data protection in the Republic of Colombia.
          </p>
          <p>
            It applies to all personal data that La Maima collects and manages as
            controller, whether through this website, WhatsApp, the telephone,
            email, the guest register at the property or any other channel.
          </p>
          <p>
            By sending a booking request, registering as a guest or contacting us
            through any of those channels, the data subject declares that they
            are aware of this policy and authorises the processing of their
            personal data on the terms described here.
          </p>
        </>
      ),
    },
    {
      id: "datos",
      title: "3. Personal data we collect",
      body: (
        <>
          <p>
            We only ask for the data needed to handle the booking and provide the
            accommodation service. Specifically:
          </p>
          <ul>
            <li>
              <strong>Identification and contact data:</strong> first and last
              name, identity document number, phone or WhatsApp number and email
              address.
            </li>
            <li>
              <strong>Booking data:</strong> the house chosen, check-in and
              check-out dates, number of guests, total amount, payment status and
              the channel the booking came through (website, WhatsApp, Airbnb or
              Booking.com).
            </li>
            <li>
              <strong>Invoicing data:</strong> whatever tax regulations require
              when an electronic invoice is requested.
            </li>
            <li>
              <strong>Payment data:</strong> online payments are processed
              entirely on the payment gateway&apos;s platform. La Maima{" "}
              <strong>does not store</strong> full card numbers or PINs; it only
              keeps the transaction reference and its status.
            </li>
            <li>
              <strong>Technical browsing data:</strong> the site only uses
              cookies that are strictly necessary for it to work —including the
              one that remembers the language you chose in the switch— and, where
              applicable, tools that measure site usage in aggregate. No
              individual profiles are built from that information.
            </li>
          </ul>
          <p>
            <strong>We do not request sensitive data</strong> (racial or ethnic
            origin, religious or philosophical beliefs, political or union
            affiliation, health data, biometric data or data about sexual life).
            If a guest chooses to tell us voluntarily about a health condition,
            an allergy or an accessibility requirement so that we can serve them
            better, that information is handled confidentially, only for that
            purpose, and providing it is entirely optional.
          </p>
          <p>
            Where a booking includes <strong>children or adolescents</strong>,
            their data will be provided by the responsible adult, limited to what
            is strictly necessary and processed in the best interests of the
            child, in accordance with article 7 of Law 1581 of 2012.
          </p>
        </>
      ),
    },
    {
      id: "finalidades",
      title: "4. Purposes of processing",
      body: (
        <>
          <p>Personal data is processed in order to:</p>
          <ul>
            <li>
              <strong>Manage the booking:</strong> check availability, confirm
              dates and rates, process payment, issue the confirmation and block
              the calendar for that house.
            </li>
            <li>
              <strong>Provide the service:</strong> register check-in and
              check-out, handle requests during the stay and coordinate the
              experiences booked.
            </li>
            <li>
              <strong>Service communications:</strong> send the confirmation,
              reminders, directions and any relevant notice about the booking by
              email or WhatsApp.
            </li>
            <li>
              <strong>Handle requests, complaints and claims</strong> and keep a
              record of how they were dealt with.
            </li>
            <li>
              <strong>Comply with legal obligations:</strong> invoicing,
              accounting, tax obligations, the guest register required by tourism
              regulations and responding to requests from competent authorities.
            </li>
            <li>
              <strong>Send commercial information</strong> about offers, seasons
              or news from La Maima,{" "}
              <strong>only where the data subject expressly authorises it</strong>{" "}
              and with the option to unsubscribe at any time.
            </li>
          </ul>
          <p>
            Data is not used for purposes other than those listed, and it is
            never sold to third parties.
          </p>
        </>
      ),
    },
    {
      id: "autorizacion",
      title: "5. Authorisation from the data subject",
      body: (
        <>
          <p>
            Authorisation is obtained before the data is processed, by means that
            leave evidence of it: express acceptance of this policy when sending a
            booking request from the website, the signature on the registration
            card on arrival, or the written conversation on WhatsApp or by email
            in which the data subject provides their details in order to book.
          </p>
          <p>
            Providing the data marked as necessary is voluntary, but without it a
            booking cannot be formalised or confirmed. Authorisation to receive
            commercial information is always optional and separate.
          </p>
        </>
      ),
    },
    {
      id: "derechos",
      title: "6. Rights of the data subject",
      body: (
        <>
          <p>
            Under article 8 of Law 1581 of 2012, the data subject has the right
            to:
          </p>
          <ul>
            <li>
              <strong>Know</strong>, free of charge, what personal data La Maima
              processes about them.
            </li>
            <li>
              <strong>Update and rectify</strong> data that is partial,
              inaccurate, incomplete, fragmented or misleading.
            </li>
            <li>
              <strong>Request deletion</strong> of their data where processing
              does not respect the legal principles, rights and guarantees, or
              where the data is no longer needed for the authorised purpose.
            </li>
            <li>
              <strong>Withdraw the authorisation</strong> given for processing.
            </li>
            <li>
              <strong>Request evidence of the authorisation</strong> granted,
              except where the law does not require it.
            </li>
            <li>
              <strong>Be informed</strong>, on request, of the use made of their
              personal data.
            </li>
            <li>
              <strong>File complaints</strong> with the{" "}
              <a href={SIC.url} target="_blank" rel="noopener noreferrer">
                Colombian Superintendence of Industry and Commerce
              </a>{" "}
              for breaches of data protection rules, once the query or claim
              procedure with La Maima has been exhausted.
            </li>
          </ul>
          <p>
            Deletion and withdrawal do not apply where a legal or contractual
            duty requires the information to be kept, such as tax and accounting
            retention periods.
          </p>
        </>
      ),
    },
    {
      id: "canal",
      title: "7. Channel and procedure for exercising these rights",
      body: (
        <>
          <p>
            The data subject, their heirs or their representative may exercise
            their rights through any of these channels:
          </p>
          <ul>
            <li>
              <strong>Email:</strong> <P>official contact email address</P>
            </li>
            <li>
              <strong>WhatsApp or telephone:</strong>{" "}
              <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
            </li>
            <li>
              <strong>Postal address:</strong> {contact.addressLine}
            </li>
          </ul>
          <p>
            The request must state the data subject&apos;s full name, a contact
            detail for the reply, a description of the facts and what is being
            asked for. The response deadlines are those set by law:
          </p>
          <ul>
            <li>
              <strong>Queries:</strong> answered within a maximum of{" "}
              <strong>ten (10) business days</strong>, extendable by up to five
              (5) further business days, stating the reasons for the extension.
            </li>
            <li>
              <strong>Claims:</strong> answered within a maximum of{" "}
              <strong>fifteen (15) business days</strong>, extendable by up to
              eight (8) further business days. If a claim is incomplete, the
              person will be asked to complete it within the following five (5)
              days; after two (2) months with no reply, it is deemed withdrawn.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "terceros",
      title: "8. Processors, transmission and transfer of data",
      body: (
        <>
          <p>
            To deliver the service, La Maima relies on suppliers acting as{" "}
            <strong>data processors</strong>, who may only use the data following
            our instructions:
          </p>
          <ul>
            <li>Website hosting and database providers (cloud infrastructure).</li>
            <li>
              The <strong>payment gateway</strong>, which processes the
              transaction and keeps the financial data under its own security
              standards.
            </li>
            <li>
              The <strong>transactional email</strong> provider, which delivers
              booking confirmations.
            </li>
            <li>
              The <strong>booking platforms</strong> (Airbnb, Booking.com) where
              a booking originates with them; in that case each platform is
              responsible for the data it collects and applies its own privacy
              policy.
            </li>
            <li>
              Accounting and tax advisers, for compliance with legal obligations.
            </li>
          </ul>
          <p>
            Some of these suppliers operate servers outside Colombia. In those
            cases, the international transmission of data takes place under
            article 26 of Law 1581 of 2012 and the authorisation given by the
            data subject, requiring adequate levels of security and
            confidentiality from each supplier.
          </p>
          <p>
            Beyond these cases, data is not shared with third parties, except at
            the request of a competent judicial or administrative authority.
          </p>
        </>
      ),
    },
    {
      id: "seguridad",
      title: "9. Security and retention of information",
      body: (
        <>
          <p>
            La Maima applies reasonable technical, human and administrative
            measures to protect personal data against tampering, loss,
            unauthorised consultation, use or access: an encrypted connection
            (HTTPS) across the whole site, access to the admin panel restricted by
            username and password, and a strict separation between the public
            content of the site and booking data, which is never exposed publicly.
            The availability calendar publishes only occupied dates, with no guest
            information whatsoever.
          </p>
          <p>
            Data is kept for as long as the relationship with the guest lasts and,
            afterwards, for the periods required by applicable legal, accounting
            and tax obligations. Once those periods are over, it is deleted or
            anonymised.
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      title: "10. Cookies",
      body: (
        <>
          <p>
            This site uses cookies and local storage that are strictly necessary
            for it to work —for example, to keep the admin panel session open, or
            to remember whether you prefer to see the site in Spanish or in
            English— and, where applicable, analytics tools that measure site
            usage in aggregate.
          </p>
          <p>
            You can configure your browser to block or delete cookies. Doing so
            does not prevent you from browsing the site, although it may affect
            how some sections work.
          </p>
        </>
      ),
    },
    {
      id: "vigencia",
      title: "11. Term and changes",
      body: (
        <>
          <p>
            This policy is in force from its publication and remains in force for
            as long as La Maima carries on its activity. Databases will be kept
            for as long as needed to fulfil the purposes described and the legal
            retention duties.
          </p>
          <p>
            Any substantial change will be announced through this website before
            it takes effect and will be reflected in the last-updated date shown
            at the top of the document.
          </p>
        </>
      ),
    },
  ];
}
