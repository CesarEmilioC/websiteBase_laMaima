import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalDocument,
  Pending,
  type LegalSection,
} from "@/components/legal/legal-document";
import { getContactInfo } from "@/lib/content";
import { LEGAL_UPDATED, SIC } from "@/lib/legal";
import { LEGAL_LINKS, SITE } from "@/lib/site";

/** Misma revalidación que el resto del sitio público: la página es estática. */
export const revalidate = 3600;

const DOC = LEGAL_LINKS[0];

export const metadata: Metadata = {
  title: "Política de privacidad y tratamiento de datos personales",
  description:
    "Cómo trata La Maima — Hotel Campestre los datos personales de sus huéspedes, conforme a la Ley 1581 de 2012 y al Decreto 1377 de 2013: finalidades, derechos del titular y canal para ejercerlos.",
  alternates: { canonical: DOC.href },
  openGraph: {
    title: "Política de privacidad · La Maima",
    description:
      "Tratamiento de datos personales en La Maima — Hotel Campestre (Ley 1581 de 2012).",
    url: DOC.href,
  },
};

export default async function PrivacyPage() {
  const contact = await getContactInfo();

  const sections: LegalSection[] = [
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
              <Pending>razón social exacta inscrita en la Cámara de Comercio</Pending>
            </li>
            <li>
              <strong>NIT:</strong> <Pending>NIT</Pending>
            </li>
            <li>
              <strong>
                Registro Nacional de Turismo (RNT):
              </strong>{" "}
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
              <strong>Correo electrónico para asuntos de datos personales:</strong>{" "}
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
              funcionamiento y, en su caso, herramientas de medición agregada de
              audiencia. No se elaboran perfiles individuales con esa
              información.
            </li>
          </ul>
          <p>
            <strong>No solicitamos datos sensibles</strong> (origen racial o
            étnico, convicciones religiosas o filosóficas, afiliación política o
            sindical, datos de salud, datos biométricos o de vida sexual). Si
            un huésped decide informarnos voluntariamente alguna condición de
            salud, alergia o requerimiento de accesibilidad para prestarle un
            mejor servicio, ese dato se tratará con carácter reservado, solo
            para esa finalidad, y su entrega es enteramente facultativa.
          </p>
          <p>
            Cuando la reserva incluya <strong>niñas, niños o adolescentes</strong>,
            los datos serán suministrados por el adulto responsable, se
            limitarán a los estrictamente necesarios y se tratarán atendiendo al
            interés superior del menor, conforme al artículo 7 de la Ley 1581 de
            2012.
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
            sesión del panel de administración— y, cuando corresponda,
            herramientas de analítica que miden el uso del sitio de forma
            agregada.
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

  return (
    <LegalDocument
      title="Política de privacidad y tratamiento de datos personales"
      current={DOC.href}
      intro="Cómo recogemos, usamos y protegemos los datos personales de quienes reservan y se hospedan en La Maima, conforme a la Ley 1581 de 2012 y al Decreto 1377 de 2013."
      updated={LEGAL_UPDATED}
      sections={sections}
      footnote={
        <p>
          Este documento se complementa con los{" "}
          <Link href="/legal/terminos">términos y condiciones de reserva</Link> y
          con la{" "}
          <Link href="/legal/cancelacion">
            política de cancelación y reembolsos
          </Link>
          .
        </p>
      }
    />
  );
}
