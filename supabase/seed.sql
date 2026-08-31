-- =============================================================================
-- La Maima — Datos iniciales (Fase 1, contenido provisional)
-- =============================================================================
-- APLICADO al proyecto Supabase "La Maima" (ref mauolzwhergekdvigmaf).
--
-- IMPORTANTE — todo lo de este archivo es CONTENIDO PROVISIONAL:
--   * Fotos: son los ORIGINALES del sitio Wix actual (sin las transformaciones
--     de tamaño del CDN de Wix, es decir la resolución máxima que el cliente
--     tiene publicada hoy), ya migradas al bucket público "gallery" de Supabase
--     Storage. Ninguna vive en website/public: así el cliente puede
--     reemplazarlas desde el panel sin tocar el código.
--     Organización dentro del bucket:
--       sitio/…          portada, "sobre la reserva" y ambientes compartidos
--       alojamientos/<slug>/N.jpg
--       experiencias/<slug>/N.jpg
--     Se reemplazan cuando el cliente envíe sus fotos definitivas en alta
--     resolución (basta con subirlas desde el panel).
--   * Tarifas: placeholders entre $350.000 y $800.000 COP/noche, todas
--     marcadas con price_note = 'Tarifa por confirmar'. NO son precios reales.
--   * Descripciones: redactadas a partir del sitio actual y del brief. El
--     cliente debe validarlas.
--
-- Idempotente: usa `on conflict (slug/key) do update`, así que se puede
-- re-ejecutar sin duplicar filas.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Alojamientos (6)
-- -----------------------------------------------------------------------------
insert into public.accommodations
  (slug, name, short_description, description, capacity,
   price_per_night_cop, price_note, amenities, gallery, visible, sort_order)
values
(
  'casa-maima',
  'Casa Maima',
  'La casa principal de la reserva: amplios ventanales, chimenea y vista abierta al Valle del Cauca.',
  'Casa Maima es el corazón de la reserva. Construida en piedra y madera sobre el filo de la montaña, sus ventanales de piso a techo enmarcan el Valle del Cauca de un extremo a otro: al amanecer se llena de niebla y al atardecer, de luces. Con capacidad para diez personas, es la opción natural para familias grandes y reuniones que necesitan espacio sin renunciar a la intimidad del bosque. Cuenta con cocineta equipada, baño privado y zonas comunes amplias donde la conversación se alarga sola. Afuera, el jardín se funde con treinta años de bosque en rehabilitación.',
  10, 800000, 'Tarifa por confirmar',
  '["Cocineta equipada","Baño privado","Agua caliente","Zona social amplia","Terraza con vista al valle","Parqueadero privado","Ropa de cama y toallas","Acceso a senderos de la reserva"]'::jsonb,
  '[{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/1.jpg","alt":"Casa Maima vista desde el jardín, con base en piedra y grandes ventanales"},
    {"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/2.jpg","alt":"Entrada de Casa Maima con techo azul y camino de piedra entre la vegetación"},
    {"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/sitio/sobre-la-reserva.jpg","alt":"Vista al Valle del Cauca desde los jardines de La Maima"},
    {"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/sitio/bosque.jpg","alt":"Bosque en rehabilitación que rodea la Casa Maima"}]'::jsonb,
  true, 1
),
(
  'mirador',
  'Mirador',
  'Una cabaña suspendida frente al bosque, con terraza privada para ver amanecer la montaña.',
  'El Mirador hace honor a su nombre: se levanta sola sobre el borde del terreno, mirando de frente la ladera de bosque primario. Desde su terraza privada —dos sillas, una mesa y nada más entre usted y los árboles— se escucha el río abajo y se ven pasar tucanes y pericos al atardecer. Es la cabaña que recomendamos a parejas y a quienes vienen buscando silencio. Para cuatro personas, con cocineta equipada, baño privado y agua caliente.',
  4, 450000, 'Tarifa por confirmar',
  '["Cocineta equipada","Baño privado","Agua caliente","Terraza privada con vista al bosque","Parqueadero","Ropa de cama y toallas","Acceso a senderos de la reserva"]'::jsonb,
  '[{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/1.jpg","alt":"Cabaña Mirador con terraza privada frente a la ladera de bosque"},
    {"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/sitio/bosque.jpg","alt":"Ladera de bosque nativo vista desde la cabaña Mirador"},
    {"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/sitio/sobre-la-reserva.jpg","alt":"Vista al Valle del Cauca desde La Maima"}]'::jsonb,
  true, 2
),
(
  'casa-loma',
  'Casa Loma',
  'Casa de campo entre jardines, con ventanales de madera y luz durante todo el día.',
  'Casa Loma es la más luminosa de la reserva. Sus ventanales de madera dan a un jardín de heliconias y bromelias que atrae colibríes desde temprano, y la casa entera está pensada para que el día transcurra con las puertas abiertas. Con capacidad para seis personas, funciona igual de bien para una familia que para un grupo de amigos. Cocineta equipada, baño privado, agua caliente y salida directa a los senderos que suben hacia el bosque alto.',
  6, 600000, 'Tarifa por confirmar',
  '["Cocineta equipada","Baño privado","Agua caliente","Jardín privado","Parqueadero","Ropa de cama y toallas","Acceso a senderos de la reserva"]'::jsonb,
  '[{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-loma/1.jpg","alt":"Casa Loma rodeada de jardines, con ventanales de madera"},
    {"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/sitio/senderos.jpg","alt":"Jardines y senderos de La Maima con vista al valle"},
    {"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/sitio/rio.jpg","alt":"Quebrada de aguas claras dentro de la reserva La Maima"}]'::jsonb,
  true, 3
),
(
  'casa-uba',
  'Casa Uba',
  'Balcón corrido sobre la ladera: la casa para quienes quieren desayunar mirando la montaña.',
  'Casa Uba se apoya en la pendiente y se abre hacia afuera con un balcón corrido que recorre toda su fachada. Es el lugar donde el desayuno se demora, porque la niebla sube por la ladera y hay que quedarse a verla. Acoge hasta cuatro personas y conserva el espíritu de la casa de campo del Valle: paredes blancas, madera oscura y nada de ruido. Cocineta equipada, baño privado y agua caliente.',
  4, 450000, 'Tarifa por confirmar',
  '["Cocineta equipada","Baño privado","Agua caliente","Balcón con vista a la montaña","Parqueadero","Ropa de cama y toallas","Acceso a senderos de la reserva"]'::jsonb,
  '[{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-uba/1.jpg","alt":"Casa Uba con su balcón corrido sobre la ladera"},
    {"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/sitio/sobre-la-reserva.jpg","alt":"Vista al Valle del Cauca desde los jardines de La Maima"},
    {"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/sitio/bosque.jpg","alt":"Bosque nativo de las montañas de Dapa"}]'::jsonb,
  true, 4
),
(
  'dos-casitas',
  'Dos Casitas',
  'Cabaña íntima con terraza bajo los árboles, a pocos pasos de la quebrada.',
  'Dos Casitas está donde el bosque se cierra: una cabaña discreta, con terraza cubierta bajo la sombra de los árboles y el sonido del agua siempre de fondo. Es el alojamiento más cercano a la quebrada, así que basta con salir descalzo unos minutos para llegar a la piscina natural. Para cuatro personas, con cocineta equipada, baño privado y agua caliente.',
  4, 420000, 'Tarifa por confirmar',
  '["Cocineta equipada","Baño privado","Agua caliente","Terraza cubierta","Cercanía a la quebrada","Parqueadero","Ropa de cama y toallas"]'::jsonb,
  '[{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/alojamientos/dos-casitas/1.jpg","alt":"Cabaña Dos Casitas con terraza cubierta bajo los árboles"},
    {"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/sitio/rio.jpg","alt":"Quebrada de aguas claras a pocos pasos de Dos Casitas"},
    {"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/sitio/senderos.jpg","alt":"Senderos y jardines de la reserva La Maima"}]'::jsonb,
  true, 5
),
(
  'tres-casitas',
  'Tres Casitas',
  'Corredor de madera, tapia blanca y el bosque empezando justo al otro lado del pasamanos.',
  'Tres Casitas conserva el corredor largo de las casas viejas del Valle: pérgola de madera, tapia blanca y una hilera de columnas desde donde se ve caer la tarde. Es la más recogida de las seis, pensada para tres personas que quieren desconectarse de verdad. Cocineta equipada, baño privado, agua caliente y acceso directo a los senderos que bordean el bosque secundario.',
  3, 350000, 'Tarifa por confirmar',
  '["Cocineta equipada","Baño privado","Agua caliente","Corredor con pérgola de madera","Parqueadero","Ropa de cama y toallas","Acceso a senderos de la reserva"]'::jsonb,
  '[{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/alojamientos/tres-casitas/1.jpg","alt":"Tres Casitas con su corredor de madera y pérgola"},
    {"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/sitio/senderos.jpg","alt":"Jardines y senderos de La Maima al atardecer"},
    {"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/sitio/bosque.jpg","alt":"Bosque en rehabilitación en las montañas de Dapa"}]'::jsonb,
  true, 6
)
on conflict (slug) do update set
  name                = excluded.name,
  short_description   = excluded.short_description,
  description         = excluded.description,
  capacity            = excluded.capacity,
  price_per_night_cop = excluded.price_per_night_cop,
  price_note          = excluded.price_note,
  amenities           = excluded.amenities,
  gallery             = excluded.gallery,
  visible             = excluded.visible,
  sort_order          = excluded.sort_order;


-- -----------------------------------------------------------------------------
-- Experiencias (8)
-- -----------------------------------------------------------------------------
-- Refleja el documento FINAL del cliente (31-ago-2026), cuya sección
-- "Experiencias y reserva natural" sustituyó al antiguo placeholder
-- "Actividades" y trajo el pasadía, la clase de yoga, el detalle del sendero al
-- río, la pileta con su chorrera y la sección "Alimentación" completa. El
-- avistamiento de flora y fauna NO está en el doc pero se conserva por decisión
-- expresa del cliente. Aplicado en producción con la migración
-- `seed_final_doc_experiences_and_dining`.
insert into public.experiences
  (slug, name, short_description, description, duration,
   capacity, price_cop, price_note, gallery, visible, sort_order)
values
(
  'pasadia',
  'Pasadía',
  'Un día completo en la reserva: almuerzo, yoga, sendero al río, fuentes de agua y fogata.',
  'Disponible los domingos y festivos, de 10:00 a. m. a 6:00 p. m. Incluye almuerzo y acceso a todas las actividades y experiencias de la reserva: clase de yoga, sendero al río, ingreso a las fuentes de agua —la pileta natural y la chorrera— y permanencia hasta la fogata. También el uso de las duchas del salón de yoga y de la zona del restaurante. No incluye el ingreso ni el uso de las cabañas.',
  '10:00 a. m. a 6:00 p. m., domingos y festivos',
  null, 110000, '$110.000 por persona',
  '[{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/experiencias/pasadia/1.jpg","alt":"Zona común de La Maima: pradera abierta entre árboles grandes, con el restaurante y las terrazas al fondo"}]'::jsonb,
  true, 1
),
(
  -- La foto es un SUSTITUTO: no hay ninguna imagen del salón de yoga en el
  -- material del cliente. Pedirle a Sabina una foto real del espacio.
  'clase-de-yoga',
  'Clase de yoga',
  'Yoga tradicional para sentir y mover el cuerpo a través de la respiración, en un espacio dispuesto para los huéspedes.',
  'Incluida en la tarifa de hospedaje y en el pasadía. Se ofrece principalmente los domingos y festivos, en un espacio dispuesto para los huéspedes, con un máximo de 15 personas por clase. Es una clase de una hora y media a dos horas de yoga tradicional, para sentir y mover el cuerpo a través de la respiración. Para quienes solo quieren tomar la clase, el valor es de $40.000 por persona y no incluye el acceso al resto de la reserva.',
  'De hora y media a dos horas',
  15, 40000, 'Incluida · solo clase $40.000',
  '[{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/experiencias/clase-de-yoga/1.jpg","alt":"Rincón tranquilo de las zonas comunes de La Maima: banca de madera junto al jardín y una terraza cubierta"}]'::jsonb,
  true, 2
),
(
  'senderos-por-la-reserva',
  'Senderos por la reserva',
  'Unos 45 minutos de bosque hasta un arroyo del río Arroyohondo, para bañarse entre grandes rocas.',
  'Sendero por el bosque de aproximadamente 45 minutos que llega a un arroyo del río Arroyohondo, donde las personas pueden bañarse en el río natural entre grandes rocas. Más que una caminata, es una invitación a disfrutar y contemplar el bosque que rodea el camino: el viento, las hojas, la tierra, las mariposas y la vida natural del lugar. El sendero está construido en escalones delimitados por la guadua del bosque. La dificultad es moderada y requiere buen calzado; no es recomendable para personas con movilidad reducida.',
  'Unos 45 minutos hasta el río',
  null, null, 'Incluida en la estadía',
  '[{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/experiencias/senderos-por-la-reserva/1.jpg","alt":"Escalones de piedra y madera que suben por el jardín tropical de la reserva"}]'::jsonb,
  true, 3
),
(
  'piscina-de-rio',
  'Piscina de río',
  'Un pozo natural de agua fría y transparente, formado por la quebrada que cruza la reserva.',
  'La quebrada que baja de la montaña atraviesa la reserva y en un punto se abre entre piedras grandes formando un pozo natural. El agua es fría, clara y corre todo el año. Alrededor hay piedra plana para tenderse al sol y sombra de bosque cuando aprieta el mediodía. Está a pocos minutos a pie desde los alojamientos, por sendero señalizado. Recomendamos calzado con agarre y bajar acompañado.',
  'Libre durante el día',
  null, null, 'Incluida en la estadía',
  '[{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/experiencias/piscina-de-rio/1.jpg","alt":"Quebrada de aguas claras entre piedras, en medio del bosque de la reserva"}]'::jsonb,
  true, 4
),
(
  'pileta-natural-y-chorrera',
  'Pileta natural y chorrera',
  'Dos espacios de agua fría en las zonas comunes, para meditar, compartir o darse un chapuzón.',
  'Ubicadas en las zonas comunes principales, la pileta y la chorrera son dos espacios de agua separados entre sí. Ideales para meditar en el agua fría, disfrutar con amigos y un trago, o simplemente darse un chapuzón.',
  'Libre durante el día',
  null, null, 'Incluida en la estadía',
  '[{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/experiencias/pileta-natural-y-chorrera/1.jpg","alt":"Pileta natural de piedra con la chorrera cayendo al espejo de agua, en las zonas comunes de La Maima"},{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/experiencias/pileta-natural-y-chorrera/2.jpg","alt":"Vista abierta de la pileta natural rodeada de pradera y árboles altos"}]'::jsonb,
  true, 5
),
(
  'avistamiento-de-flora-y-fauna',
  'Avistamiento de flora y fauna',
  'Treinta años de rehabilitación han traído de vuelta aves, orquídeas y mamíferos del bosque andino.',
  'La Maima empezó como un proyecto de recuperación hace treinta años, y el resultado se ve a simple vista: hoy la reserva alberga tucanes, pavas, colibríes de varias especies, guatines y una comunidad creciente de orquídeas, bromelias y helechos arbóreos. Las primeras horas de la mañana son las mejores para el avistamiento, sobre todo en los bordes de bosque y cerca del agua. Traiga binóculos; nosotros le indicamos dónde buscar.',
  'Mejor entre 6:00 y 9:00 a. m.',
  null, null, 'Incluida en la estadía',
  '[{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/experiencias/avistamiento-de-flora-y-fauna/1.jpg","alt":"Tucán esmeralda posado en una rama del bosque de La Maima"}]'::jsonb,
  true, 6
),
(
  'fogata',
  'Fogata',
  'Leña, cielo despejado y el frío de la montaña: el cierre natural del día en Dapa.',
  'Se enciende en las noches, alrededor de las 6:00 – 7:00 p. m.: un espacio para reunirse y compartir al final del día, y La Maima regala los marshmallows. A 1.800 metros sobre el nivel del mar la noche baja rápido y con ella el frío de Dapa, así que el fogón de la zona común se vuelve el sitio donde termina el día, con las luces del Valle del Cauca de fondo y —si el cielo está despejado, que es casi siempre— un cielo estrellado sin contaminación lumínica. Se coordina con la administración el mismo día.',
  'Se enciende entre 6:00 y 7:00 p. m.',
  null, null, 'Bajo solicitud',
  '[{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/experiencias/fogata/1.jpg","alt":"Fogata encendida al anochecer, rodeada de troncos que sirven de asiento"}]'::jsonb,
  true, 7
),
(
  -- La "Alimentación" del doc entra como ficha para que sea visible donde el
  -- huésped la busca (y editable por el cliente desde /admin/experiencias),
  -- no solo enterrada en los términos y condiciones.
  'gastronomia',
  'Cocina casera de campo',
  'Comida como en casa: sencilla, abundante y preparada fresca cada día con productos del campo.',
  'Cocina casera de campo, preparada fresca cada día. En La Maima la comida es como en casa: sencilla, abundante y hecha con productos frescos. No manejamos pedidos a la carta —cada día preparamos un plato pensado para todos, aunque tenemos estandarizados cuatro platos— y los domingos y festivos nuestro clásico es el sancocho. Los almuerzos están disponibles los fines de semana, y entre semana para grupos de más de 6 personas. El desayuno está incluido en la estadía en todas las cabañas salvo Casa Maima: es un desayuno servido a la mesa, que inicia con fruta de temporada y jugo de naranja, y sigue con huevos al gusto, pan y arepa, café o chocolate, mantequilla, mermelada y queso cuajada. Si tienes alguna restricción alimentaria o alergia, cuéntanos al reservar y hacemos lo posible por acomodarla.',
  'Desayuno de 8:00 a 9:30 a. m.',
  null, null, 'Desayuno incluido',
  '[{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/experiencias/gastronomia/1.jpg","alt":"Comedor de La Maima bajo la pérgola al atardecer, con mesas de mosaico y sillas de madera"},{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/experiencias/gastronomia/2.jpg","alt":"Zona del restaurante de La Maima con luces cálidas colgantes y vista al bosque"}]'::jsonb,
  true, 8
)
on conflict (slug) do update set
  name              = excluded.name,
  short_description = excluded.short_description,
  description       = excluded.description,
  duration          = excluded.duration,
  capacity          = excluded.capacity,
  price_cop         = excluded.price_cop,
  price_note        = excluded.price_note,
  gallery           = excluded.gallery,
  visible           = excluded.visible,
  sort_order        = excluded.sort_order;


-- -----------------------------------------------------------------------------
-- Contenido del sitio
-- -----------------------------------------------------------------------------
insert into public.site_content (key, value) values
(
  'home_hero',
  '{
    "eyebrow": "Reserva natural y hotel campestre",
    "title": "La naturaleza a tu alcance",
    "subtitle": "Seis casas y cabañas en medio de 30 años de bosque rehabilitado, a 20 minutos de Cali. La combinación perfecta entre lujo y naturaleza.",
    "cta_label": "Ver alojamientos",
    "cta_href": "/alojamientos",
    "image": "https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/sitio/hero.jpg",
    "image_alt": "Cabaña de La Maima frente a la ladera de bosque nativo en las montañas de Dapa"
  }'::jsonb
),
(
  'home_about',
  '{
    "eyebrow": "Sobre la reserva",
    "title": "Treinta años devolviéndole el bosque a la montaña",
    "paragraphs": [
      "La Maima nació como un proyecto familiar de rehabilitación en las montañas de Dapa. Tres décadas después, lo que era potrero es hoy una reserva con bosque primario, secundario y terciario conviviendo en la misma ladera, y con la fauna del bosque andino de regreso: tucanes, pavas, colibríes y guatines.",
      "Sobre ese bosque construimos seis casas y cabañas independientes, cada una con cocineta y baño privado. Nada de pasillos ni recepciones: cada alojamiento tiene su propia entrada, su terraza y su pedazo de montaña.",
      "Estamos en el Km 12 de la Vía a Dapa, en Yumbo, a menos de una hora de Cali por carretera pavimentada. Suficientemente cerca para venir un fin de semana; suficientemente lejos para no oír la ciudad."
    ],
    "image": "https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/sitio/sobre-la-reserva.jpg",
    "image_alt": "Jardines de La Maima con vista abierta al Valle del Cauca",
    "stats": [
      { "value": "30", "label": "años de rehabilitación" },
      { "value": "6", "label": "casas y cabañas" },
      { "value": "3", "label": "tipos de bosque" }
    ]
  }'::jsonb
),
(
  'contact',
  '{
    "business_name": "La Maima — Hotel Campestre",
    "address": "Km 12 Vía a Dapa",
    "locality": "Yumbo",
    "region": "Valle del Cauca",
    "country": "Colombia",
    "phone": "+57 311 308 2813",
    "phone_display": "+57 311 308 2813",
    "whatsapp": "573113082813",
    "instagram": "https://instagram.com/lamaima",
    "instagram_handle": "@lamaima",
    "facebook": "https://facebook.com/lamaimahotel",
    "facebook_handle": "@lamaimahotel",
    "maps_url": "https://www.google.com/maps/search/?api=1&query=La+Maima+Hotel+Campestre+Dapa+Yumbo",
    "latitude": 3.5347,
    "longitude": -76.5583,
    "note": "Reservas y consultas por WhatsApp mientras habilitamos el pago en línea."
  }'::jsonb
)
on conflict (key) do update set value = excluded.value;
