/**
 * Diccionario del sitio público en ESPAÑOL. Es la fuente de la verdad: el tipo
 * `Dictionary` se deriva de este objeto, así que cualquier clave que se añada
 * aquí y falte en `en.ts` rompe la compilación (que es exactamente lo que
 * queremos: un sitio bilingüe a medias es peor que uno monolingüe).
 *
 * QUÉ ENTRA AQUÍ Y QUÉ NO
 * -----------------------
 * Aquí viven los textos de la INTERFAZ: navegación, rótulos, botones, avisos
 * del motor de reservas, etiquetas accesibles. El CONTENIDO —nombres y
 * descripciones de alojamientos y experiencias, titulares de la portada— vive
 * en Supabase con sus columnas `*_en` y lo edita la administradora desde el
 * panel; ver `src/lib/content.ts`.
 *
 * Las funciones que componen frases con números ("3 noches", "Hasta 4
 * personas") no están aquí sino en `format.ts`, `dates.ts` y `pricing.ts`, que
 * reciben el idioma como parámetro: son texto CALCULADO, y partirlo en trozos
 * para meterlo en un diccionario produce frases que solo funcionan en un
 * idioma.
 */

export const es = {
  /* --- Conmutador de idioma ---------------------------------------------- */
  locale: {
    /** Etiqueta accesible del grupo de banderas. */
    group: "Idioma del sitio",
    /** Rótulo VISIBLE, para donde el conmutador va acompañado de texto
        (hoy: la ficha de idioma del menú móvil). */
    label: "Idioma",
    switchTo: {
      es: "Cambiar a español",
      en: "Cambiar a inglés",
    },
    short: {
      es: "ES",
      en: "EN",
    },
  },

  /* --- Navegación --------------------------------------------------------- */
  nav: {
    home: "Inicio",
    accommodations: "Alojamientos",
    experiences: "Experiencias",
    contact: "Contacto",
    book: "Reservar",
    bookOnline: "Reservar en línea",
    primary: "Principal",
    primaryMobile: "Principal (móvil)",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    homeAria: "La Maima — Inicio",
    skipToContent: "Saltar al contenido",
    whereWeAre: "Dónde estamos",
    breadcrumb: "Ruta de navegación",
  },

  /* --- Piezas compartidas -------------------------------------------------- */
  common: {
    from: "Desde",
    /** Prefijo del aforo: "Hasta 4 personas". */
    upTo: "Hasta",
    seeDetails: "Ver detalles",
    perNight: "/ noche",
    /** Bajo el precio grande de la ficha. En inglés se hace explícito el COP. */
    copPerNight: "COP / noche",
    night: "noche",
    nights: "noches",
    guest: "huésped",
    guests: "huéspedes",
    whatsapp: "Escribir por WhatsApp",
    whatsappAsk: "Preguntar por WhatsApp",
    whatsappConsult: "Consultar por WhatsApp",
    whatsappFloat: "Escríbenos por WhatsApp",
    whatsappCheck: "Consultar disponibilidad",
    talkToUs: "Hablar con nosotros",
    viewAvailability: "Ver disponibilidad",
    updatingSection: "Estamos actualizando esta sección",
    updatingSectionHelp:
      "Mientras tanto, escríbenos por WhatsApp y te contamos qué tenemos disponible.",
  },

  /* --- Portada ------------------------------------------------------------ */
  home: {
    accommodations: {
      eyebrow: "Dónde dormir",
      title: "Seis casas y cabañas, cada una con su",
      titleAccent: "pedazo de montaña",
      lead: "Todas independientes, con cocineta equipada y baño privado. Elige la que mejor se acomode a tu grupo y calcula tu estadía con fechas reales.",
      empty:
        "Estamos actualizando la información de nuestros alojamientos. Escríbenos por WhatsApp y te contamos la disponibilidad.",
      cta: "Ver los seis y reservar",
      /* Nombre accesible del enlace que envuelve la FOTO de cada fila del
         zigzag. El titular de al lado ya enlaza a la misma ficha con el nombre
         de la casa como texto, así que sin una etiqueta propia un lector de
         pantalla anunciaría dos enlaces al mismo sitio y solo uno con nombre
         (la foto se anunciaría por su texto alternativo, que describe la
         fotografía, no el destino). */
      photoAria: (name: string) => `Ver ${name}`,
    },
    about: {
      cta: "Ver alojamientos y fechas",
      galleryLabel: "Fotos de la reserva natural",
    },
    experiences: {
      eyebrow: "Qué hacer",
      title: "El bosque también es",
      titleAccent: "parte del plan",
      lead: "Senderos, agua fría de quebrada, fogata al anochecer y aves que volvieron después de treinta años de rehabilitación.",
      carouselLabel: "Experiencias de La Maima",
      prev: "Ver las experiencias anteriores",
      next: "Ver las siguientes experiencias",
      ctaBook: "Reservar tu estadía",
      ctaAll: "Ver todas las experiencias",
    },
    contact: {
      eyebrow: "Cómo llegar",
      title: "A 12 kilómetros de la vía a Dapa,",
      titleAccent: "a menos de una hora de Cali",
      lead: "La subida es por carretera pavimentada y el último tramo está señalizado. Si vienes por primera vez, escríbenos y te enviamos la ubicación exacta y las recomendaciones del camino.",
      addressLabel: "Dirección",
      openInMaps: "Abrir en Google Maps",
      phoneLabel: "Teléfono y WhatsApp",
      socialLabel: "Redes sociales",
      mapTitle: "Ubicación de La Maima en Google Maps",
      noteStrong: "Elige tus fechas en línea.",
      noteBody:
        "Cada alojamiento tiene su calendario con la disponibilidad real y el cálculo de tu estadía. La solicitud se confirma por WhatsApp el mismo día.",
    },
    instagram: {
      title: "El día a día de la reserva",
      lead: "Amaneceres sobre el valle, las aves que volvieron al bosque y las casas por dentro.",
      cta: "Síguenos en Instagram",
    },
  },

  /* --- Listado de alojamientos -------------------------------------------- */
  accommodations: {
    heroEyebrow: "Casas y cabañas en Dapa",
    heroTitle: "Dormir dentro de",
    heroTitleAccent: "la reserva",
    heroDescription:
      "Seis alojamientos independientes repartidos por la ladera. Cada uno con su entrada, su terraza y su vista. Todos con cocineta equipada y baño privado.",
    sectionEyebrow: "Dónde dormir",
    sectionTitle: "Seis casas y cabañas",
    sectionLead:
      "Cada alojamiento tiene su propia tarifa según el número de huéspedes, y las noches de lunes a jueves cuestan menos. Entra a la ficha para ver la tabla completa y calcular tu estadía con fechas reales.",
    emptyHelp:
      "Mientras tanto, escríbenos por WhatsApp y te contamos qué alojamientos tenemos disponibles.",
  },

  /* --- Ficha de alojamiento ------------------------------------------------ */
  detail: {
    checkIn: "Check-in 3:00 p. m.",
    petFriendly: "Pet friendly",
    cancellationLink: "Política de cancelación y reprogramación",
    rateFrom: "Tarifa desde",
    rateConditions: "Condiciones de la tarifa",
    about: (name: string) => `Sobre ${name}`,
    included: "Qué incluye",
    book: "Reservar",
    askAbout: (name: string) => `Preguntar por WhatsApp sobre ${name}`,
    replyBy: (phone: string) => `Respondemos por WhatsApp al ${phone}`,
    bookingEyebrow: "Reservas",
    bookingTitle: (name: string) => `Elige tus fechas en ${name}`,
    bookingLead:
      "El calendario muestra la disponibilidad real, incluidas las reservas que llegan por Airbnb y Booking. Arma tu estadía y envíanos la solicitud: confirmamos fechas y forma de pago el mismo día.",
    others: "Otros alojamientos",
    othersCta: "Ver los seis",
    specialPlans: "Planes especiales",
    specialPlansNote:
      "Si eliges fechas dentro de un plan, el calendario aplica su precio automáticamente.",
    planPerNight: "por noche",
    notFoundTitle: "Alojamiento no encontrado",
  },

  /* --- Galería y visor ----------------------------------------------------- */
  gallery: {
    label: (name: string) => `Galería de fotos de ${name}`,
    openOne: (alt: string) => `Ver la foto a pantalla completa: ${alt}`,
    open: (position: number, total: number, alt: string) =>
      `Ver la foto ${position} de ${total} a pantalla completa: ${alt}`,
    openAll: (total: number) => `Ver las ${total} fotos a pantalla completa`,
    morePhotos: (count: number) =>
      `+${count} ${count === 1 ? "foto" : "fotos"}`,
    close: "Cerrar la galería",
    previous: "Foto anterior",
    next: "Foto siguiente",
    counter: (index: number, total: number) => `Foto ${index} de ${total}`,
    /** Alt de respaldo cuando una foto viene sin descripción. */
    fallbackAlt: (name: string) => `${name} en La Maima`,
    /** Puntos de la galería automática de la portada. */
    dot: (position: number, total: number) =>
      `Ver la foto ${position} de ${total}`,
    /** `aria-roledescription`: lo lee el lector de pantalla en el idioma de la página. */
    carouselRole: "carrusel",
  },

  /* --- Motor de reservas --------------------------------------------------- */
  booking: {
    loading: "Cargando disponibilidad…",
    errorTitle: "No pudimos cargar la disponibilidad, intenta de nuevo",
    errorBody: (phone: string) =>
      `Si el problema sigue, escríbenos por WhatsApp al ${phone} y confirmamos las fechas contigo.`,
    retry: "Reintentar",
    hintStart: "Toca una fecha para la entrada.",
    hintEnd: "Ahora toca la fecha de salida.",
    hintReady: "Fechas listas. Revisa el resumen y envía la solicitud.",
    clearDates: "Borrar fechas",
    summaryTitle: "Tu solicitud",
    checkIn: "Entrada",
    checkOut: "Salida",
    nights: "Noches",
    unset: "Sin elegir",
    guests: "Huéspedes",
    guestsHint: (max: string) => `Máximo ${max} · la tarifa cambia con la ocupación`,
    removeGuest: "Quitar un huésped",
    addGuest: "Añadir un huésped",
    total: "Total estimado",
    average: (amount: string) => `${amount} por noche en promedio`,
    breakfastExtra: (guestsLabel: string, nightsLabel: string, amount: string) =>
      `El desayuno de ${guestsLabel} durante ${nightsLabel} sumaría ${amount}. No está incluido en el total.`,
    request: "Solicitar reserva",
    /** Canal secundario: el mismo mensaje, pero por WhatsApp. */
    requestWhatsapp: "Prefiero pedirlo por WhatsApp",
    requestReady: "Sigue al paso de datos: te confirmamos en menos de 48 horas.",
    requestBlocked: "Ajusta las fechas para cumplir la estancia mínima.",
    requestPending: "Elige las fechas para enviar tu solicitud.",
    onlineSoon: "Muy pronto podrás pagar en línea aquí mismo.",
    prefersTalking: "¿Prefieres hablar?",
    acceptPolicy: "Al reservar aceptas la",
    acceptPolicyLink: "política de cancelación",
    /** Aviso cuando el rango elegido cruza noches ya reservadas. */
    occupiedRange: (
      checkIn: string,
      touched: string,
      limit: string,
    ) =>
      `Entre el ${checkIn} y el ${touched} hay noches ya reservadas: con entrada el ${checkIn}, la salida más tardía era el ${limit}. Empezamos de nuevo con entrada el ${touched}.`,
    overCapacity: (name: string, capacity: string) =>
      `${name} admite máximo ${capacity}.`,
    minStayHelp: (chosen: string, missing: number) =>
      `Elegiste ${chosen}: añade ${missing} más para poder reservar.`,
    calendar: {
      prevMonth: "Mes anterior",
      nextMonth: "Mes siguiente",
      available: "Disponible",
      unavailable: "No disponible",
      yourDates: "Tus fechas",
      dayUnavailable: " — no disponible",
    },

    /* --- Paso 2: datos del huésped --------------------------------------- */
    form: {
      eyebrow: "Paso 2 de 2",
      title: "Tus datos",
      lead: "Con esto apartamos tus fechas y te escribimos para confirmar.",
      back: "Cambiar fechas",
      recapTitle: "Tu estadía",
      checking: "Comprobando disponibilidad…",

      name: "Nombre completo",
      namePlaceholder: "Como aparece en tu documento",
      email: "Correo electrónico",
      emailHint: "Aquí te llega el código de tu solicitud.",
      phone: "Teléfono / WhatsApp",
      phoneHint: "Es por donde te confirmamos más rápido.",
      guests: "Huéspedes",
      notes: "Algo que debamos saber",
      notesOptional: "opcional",
      notesPlaceholder:
        "Hora aproximada de llegada, mascotas, celebraciones, alergias…",
      /** Campo trampa: invisible, solo lo leen los lectores de pantalla. */
      honeypot: "No rellenes este campo",

      policyBefore: "He leído y acepto la",
      policyLink: "política de cancelación",
      policyAfter: "",

      submit: "Enviar solicitud",
      submitting: "Enviando…",
      /** Aviso que resume el estado del formulario para lectores de pantalla. */
      errorSummary: "Revisa los campos marcados.",
      required: "obligatorio",

      /** Mensajes por campo. Las claves salen de `@/lib/booking/guest`. */
      errors: {
        "name-required": "Escribe tu nombre completo.",
        "name-too-short": "El nombre parece incompleto.",
        "name-too-long": "El nombre es demasiado largo.",
        "email-required": "Escribe tu correo electrónico.",
        "email-invalid": "Ese correo no parece válido. Revisa la arroba y el dominio.",
        "email-too-long": "El correo es demasiado largo.",
        "phone-required": "Escribe un teléfono donde podamos escribirte.",
        "phone-too-short": "El teléfono parece incompleto.",
        "phone-too-long": "El teléfono es demasiado largo.",
        "notes-too-long": "La nota es muy larga: resúmela un poco.",
        "policy-required": "Necesitamos que aceptes la política de cancelación.",
      },

      /** Motivos por los que una solicitud correcta puede no prosperar. */
      failures: {
        "dates-taken":
          "Esas fechas se acaban de ocupar. Vuelve al calendario y elige otras: la disponibilidad ya está actualizada.",
        "invalid-dates":
          "Esas fechas ya no son válidas. Vuelve al calendario y elígelas de nuevo.",
        "min-stay": "Esa temporada tiene estancia mínima.",
        "over-capacity": "Ese alojamiento no admite tantos huéspedes.",
        "not-found": "Ese alojamiento ya no está disponible.",
        "rate-limited":
          "Recibimos varias solicitudes tuyas seguidas. Espera un momento o escríbenos por WhatsApp y te atendemos al instante.",
        unconfigured:
          "No podemos registrar la solicitud en este momento. Escríbenos por WhatsApp y la tomamos nosotros.",
        server:
          "No pudimos registrar tu solicitud. Inténtalo de nuevo; si vuelve a fallar, escríbenos por WhatsApp.",
      },
    },

    /* --- Paso 3: solicitud registrada ------------------------------------ */
    success: {
      eyebrow: "Solicitud registrada",
      title: "¡Listo! Tus fechas quedaron apartadas",
      codeLabel: "Tu código de solicitud",
      hold: (deadline: string) =>
        `Tu solicitud quedó registrada y las fechas quedan reservadas por 48 horas (hasta el ${deadline}) mientras el equipo confirma.`,
      contact: "Te contactaremos por WhatsApp o correo.",
      emailSent: (email: string) => `Te enviamos una copia a ${email}.`,
      onlineSoon: "Muy pronto podrás pagar en línea aquí mismo.",
      summaryTitle: "Resumen de tu solicitud",
      accommodation: "Alojamiento",
      whatsapp: "Escribirnos por WhatsApp",
      /** Mensaje prellenado del botón: lleva el código dentro. */
      whatsappMessage: (code: string, accommodation: string) =>
        `Hola! Hice la solicitud ${code} para ${accommodation}. ¿Me confirman?`,
      again: "Hacer otra solicitud",
    },
  },

  /* --- Experiencias -------------------------------------------------------- */
  experiences: {
    heroEyebrow: "Qué hacer en la reserva de Dapa",
    heroTitle: "Experiencias entre el bosque",
    heroTitleAccent: "y el agua",
    heroDescription:
      "La Maima no es solo dónde dormir. Treinta años de rehabilitación dejaron senderos, una quebrada con pozos naturales y un bosque al que volvieron las aves.",
    listHeading: "Experiencias de la reserva",
    emptyHelp:
      "Escríbenos por WhatsApp y te contamos qué experiencias tenemos disponibles para tu visita.",
    planTitle: "¿Quieres armar",
    planTitleAccent: "tu plan",
    planTitleTail: "?",
    planLead:
      "Cuéntanos cuántos vienen y qué fechas tienen en mente, y te ayudamos a combinar alojamiento y experiencias.",
    planCta: "Ver alojamientos y fechas",
    askAbout: (name: string) =>
      `Consultar por WhatsApp sobre la experiencia ${name}`,
  },

  /* --- Documentos legales -------------------------------------------------- */
  legal: {
    eyebrow: "Legal",
    updated: (date: string) => `Última actualización: ${date}`,
    contents: "Contenido",
    contentsMobile: "Contenido del documento",
    contentsNav: "Contenido del documento",
    otherDocs: "Otros documentos legales",
    pending: (what: string) => `[Dato por confirmar con La Maima: ${what}]`,
    links: {
      privacy: "Política de privacidad y tratamiento de datos",
      terms: "Términos y condiciones de reserva",
      cancellation: "Política de cancelación y reembolsos",
    },
    short: {
      privacy: "Privacidad",
      terms: "Términos",
      cancellation: "Cancelaciones",
    },
  },

  /* --- Página 404 ---------------------------------------------------------- */
  notFound: {
    metaTitle: "Página no encontrada",
    eyebrow: "Error 404",
    title: "Esta página se perdió",
    titleAccent: "en el bosque",
    body: "La dirección que buscas no existe o cambió de lugar. Te dejamos el camino de vuelta.",
    home: "Volver al inicio",
    accommodations: "Ver alojamientos",
  },

  /* --- Pie de página ------------------------------------------------------- */
  footer: {
    blurb:
      "Reserva natural y hotel campestre en las montañas de Dapa. Treinta años de bosque en rehabilitación, seis casas y cabañas independientes y el Valle del Cauca a los pies.",
    navHeading: "Navegación",
    contactHeading: "Contacto",
    nav: "Pie de página",
    legalNav: "Información legal",
    seeOnMaps: "Ver en Google Maps",
    rights: (year: number, name: string) =>
      `© ${year} ${name}. Todos los derechos reservados.`,
    bookings: (phone: string) => `Reservas y consultas por WhatsApp ${phone}`,
    instagramAria: (handle: string) => `Instagram de La Maima (${handle})`,
    facebookAria: (handle: string) => `Facebook de La Maima (${handle})`,
  },
};

/**
 * Forma del diccionario. `en.ts` se declara con este tipo, de modo que el
 * compilador exige la MISMA estructura: ni una clave de menos, ni una firma de
 * función distinta.
 *
 * OJO: este objeto NO lleva `as const`. Con `as const` los textos quedarían
 * tipados como literales ("Inicio", no `string`) y la traducción inglesa sería
 * un error de tipos por decir otra cosa. Sin él, los textos son `string` y lo
 * que el tipo verifica es lo que importa: que existan todas las claves y que
 * las funciones reciban los mismos argumentos.
 */
export type Dictionary = typeof es;
