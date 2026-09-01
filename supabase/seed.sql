-- =============================================================================
-- La Maima — Datos iniciales (Fase 1, contenido provisional)
-- =============================================================================
-- APLICADO al proyecto Supabase "La Maima" (ref ausqyfdglyxapeszkrck).
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
  '[{"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/1.jpg","alt":"Casa Maima vista desde el jardín, con base en piedra y grandes ventanales"},
    {"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/2.jpg","alt":"Entrada de Casa Maima con techo azul y camino de piedra entre la vegetación"},
    {"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/sobre-la-reserva.jpg","alt":"Vista al Valle del Cauca desde los jardines de La Maima"},
    {"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/bosque.jpg","alt":"Bosque en rehabilitación que rodea la Casa Maima"}]'::jsonb,
  true, 1
),
(
  'mirador',
  'Mirador',
  'Una cabaña suspendida frente al bosque, con terraza privada para ver amanecer la montaña.',
  'El Mirador hace honor a su nombre: se levanta sola sobre el borde del terreno, mirando de frente la ladera de bosque primario. Desde su terraza privada —dos sillas, una mesa y nada más entre usted y los árboles— se escucha el río abajo y se ven pasar tucanes y pericos al atardecer. Es la cabaña que recomendamos a parejas y a quienes vienen buscando silencio. Para cuatro personas, con cocineta equipada, baño privado y agua caliente.',
  4, 450000, 'Tarifa por confirmar',
  '["Cocineta equipada","Baño privado","Agua caliente","Terraza privada con vista al bosque","Parqueadero","Ropa de cama y toallas","Acceso a senderos de la reserva"]'::jsonb,
  '[{"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/1.jpg","alt":"Cabaña Mirador con terraza privada frente a la ladera de bosque"},
    {"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/bosque.jpg","alt":"Ladera de bosque nativo vista desde la cabaña Mirador"},
    {"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/sobre-la-reserva.jpg","alt":"Vista al Valle del Cauca desde La Maima"}]'::jsonb,
  true, 2
),
(
  'casa-loma',
  'Casa Loma',
  'Casa de campo entre jardines, con ventanales de madera y luz durante todo el día.',
  'Casa Loma es la más luminosa de la reserva. Sus ventanales de madera dan a un jardín de heliconias y bromelias que atrae colibríes desde temprano, y la casa entera está pensada para que el día transcurra con las puertas abiertas. Con capacidad para seis personas, funciona igual de bien para una familia que para un grupo de amigos. Cocineta equipada, baño privado, agua caliente y salida directa a los senderos que suben hacia el bosque alto.',
  6, 600000, 'Tarifa por confirmar',
  '["Cocineta equipada","Baño privado","Agua caliente","Jardín privado","Parqueadero","Ropa de cama y toallas","Acceso a senderos de la reserva"]'::jsonb,
  '[{"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-loma/1.jpg","alt":"Casa Loma rodeada de jardines, con ventanales de madera"},
    {"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/senderos.jpg","alt":"Jardines y senderos de La Maima con vista al valle"},
    {"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/rio.jpg","alt":"Quebrada de aguas claras dentro de la reserva La Maima"}]'::jsonb,
  true, 3
),
(
  'casa-uba',
  'Casa Uba',
  'Balcón corrido sobre la ladera: la casa para quienes quieren desayunar mirando la montaña.',
  'Casa Uba se apoya en la pendiente y se abre hacia afuera con un balcón corrido que recorre toda su fachada. Es el lugar donde el desayuno se demora, porque la niebla sube por la ladera y hay que quedarse a verla. Acoge hasta cuatro personas y conserva el espíritu de la casa de campo del Valle: paredes blancas, madera oscura y nada de ruido. Cocineta equipada, baño privado y agua caliente.',
  4, 450000, 'Tarifa por confirmar',
  '["Cocineta equipada","Baño privado","Agua caliente","Balcón con vista a la montaña","Parqueadero","Ropa de cama y toallas","Acceso a senderos de la reserva"]'::jsonb,
  '[{"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-uba/1.jpg","alt":"Casa Uba con su balcón corrido sobre la ladera"},
    {"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/sobre-la-reserva.jpg","alt":"Vista al Valle del Cauca desde los jardines de La Maima"},
    {"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/bosque.jpg","alt":"Bosque nativo de las montañas de Dapa"}]'::jsonb,
  true, 4
),
(
  'dos-casitas',
  'Dos Casitas',
  'Cabaña íntima con terraza bajo los árboles, a pocos pasos de la quebrada.',
  'Dos Casitas está donde el bosque se cierra: una cabaña discreta, con terraza cubierta bajo la sombra de los árboles y el sonido del agua siempre de fondo. Es el alojamiento más cercano a la quebrada, así que basta con salir descalzo unos minutos para llegar a la piscina natural. Para cuatro personas, con cocineta equipada, baño privado y agua caliente.',
  4, 420000, 'Tarifa por confirmar',
  '["Cocineta equipada","Baño privado","Agua caliente","Terraza cubierta","Cercanía a la quebrada","Parqueadero","Ropa de cama y toallas"]'::jsonb,
  '[{"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/dos-casitas/1.jpg","alt":"Cabaña Dos Casitas con terraza cubierta bajo los árboles"},
    {"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/rio.jpg","alt":"Quebrada de aguas claras a pocos pasos de Dos Casitas"},
    {"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/senderos.jpg","alt":"Senderos y jardines de la reserva La Maima"}]'::jsonb,
  true, 5
),
(
  'tres-casitas',
  'Tres Casitas',
  'Corredor de madera, tapia blanca y el bosque empezando justo al otro lado del pasamanos.',
  'Tres Casitas conserva el corredor largo de las casas viejas del Valle: pérgola de madera, tapia blanca y una hilera de columnas desde donde se ve caer la tarde. Es la más recogida de las seis, pensada para tres personas que quieren desconectarse de verdad. Cocineta equipada, baño privado, agua caliente y acceso directo a los senderos que bordean el bosque secundario.',
  3, 350000, 'Tarifa por confirmar',
  '["Cocineta equipada","Baño privado","Agua caliente","Corredor con pérgola de madera","Parqueadero","Ropa de cama y toallas","Acceso a senderos de la reserva"]'::jsonb,
  '[{"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/tres-casitas/1.jpg","alt":"Tres Casitas con su corredor de madera y pérgola"},
    {"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/senderos.jpg","alt":"Jardines y senderos de La Maima al atardecer"},
    {"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/bosque.jpg","alt":"Bosque en rehabilitación en las montañas de Dapa"}]'::jsonb,
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
  '[{"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/pasadia/1.jpg","alt":"Zona común de La Maima: pradera abierta entre árboles grandes, con el restaurante y las terrazas al fondo"}]'::jsonb,
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
  '[{"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/clase-de-yoga/1.jpg","alt":"Rincón tranquilo de las zonas comunes de La Maima: banca de madera junto al jardín y una terraza cubierta"}]'::jsonb,
  true, 2
),
(
  'senderos-por-la-reserva',
  'Senderos por la reserva',
  'Unos 45 minutos de bosque hasta un arroyo del río Arroyohondo, para bañarse entre grandes rocas.',
  'Sendero por el bosque de aproximadamente 45 minutos que llega a un arroyo del río Arroyohondo, donde las personas pueden bañarse en el río natural entre grandes rocas. Más que una caminata, es una invitación a disfrutar y contemplar el bosque que rodea el camino: el viento, las hojas, la tierra, las mariposas y la vida natural del lugar. El sendero está construido en escalones delimitados por la guadua del bosque. La dificultad es moderada y requiere buen calzado; no es recomendable para personas con movilidad reducida.',
  'Unos 45 minutos hasta el río',
  null, null, 'Incluida en la estadía',
  '[{"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/senderos-por-la-reserva/1.jpg","alt":"Escalones de piedra y madera que suben por el jardín tropical de la reserva"}]'::jsonb,
  true, 3
),
(
  'piscina-de-rio',
  'Piscina de río',
  'Un pozo natural de agua fría y transparente, formado por la quebrada que cruza la reserva.',
  'La quebrada que baja de la montaña atraviesa la reserva y en un punto se abre entre piedras grandes formando un pozo natural. El agua es fría, clara y corre todo el año. Alrededor hay piedra plana para tenderse al sol y sombra de bosque cuando aprieta el mediodía. Está a pocos minutos a pie desde los alojamientos, por sendero señalizado. Recomendamos calzado con agarre y bajar acompañado.',
  'Libre durante el día',
  null, null, 'Incluida en la estadía',
  '[{"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/piscina-de-rio/1.jpg","alt":"Quebrada de aguas claras entre piedras, en medio del bosque de la reserva"}]'::jsonb,
  true, 4
),
(
  'pileta-natural-y-chorrera',
  'Pileta natural y chorrera',
  'Dos espacios de agua fría en las zonas comunes, para meditar, compartir o darse un chapuzón.',
  'Ubicadas en las zonas comunes principales, la pileta y la chorrera son dos espacios de agua separados entre sí. Ideales para meditar en el agua fría, disfrutar con amigos y un trago, o simplemente darse un chapuzón.',
  'Libre durante el día',
  null, null, 'Incluida en la estadía',
  '[{"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/pileta-natural-y-chorrera/1.jpg","alt":"Pileta natural de piedra con la chorrera cayendo al espejo de agua, en las zonas comunes de La Maima"},{"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/pileta-natural-y-chorrera/2.jpg","alt":"Vista abierta de la pileta natural rodeada de pradera y árboles altos"}]'::jsonb,
  true, 5
),
(
  'avistamiento-de-flora-y-fauna',
  'Avistamiento de flora y fauna',
  'Treinta años de rehabilitación han traído de vuelta aves, orquídeas y mamíferos del bosque andino.',
  'La Maima empezó como un proyecto de recuperación hace treinta años, y el resultado se ve a simple vista: hoy la reserva alberga tucanes, pavas, colibríes de varias especies, guatines y una comunidad creciente de orquídeas, bromelias y helechos arbóreos. Las primeras horas de la mañana son las mejores para el avistamiento, sobre todo en los bordes de bosque y cerca del agua. Traiga binóculos; nosotros le indicamos dónde buscar.',
  'Mejor entre 6:00 y 9:00 a. m.',
  null, null, 'Incluida en la estadía',
  '[{"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/avistamiento-de-flora-y-fauna/1.jpg","alt":"Tucán esmeralda posado en una rama del bosque de La Maima"}]'::jsonb,
  true, 6
),
(
  'fogata',
  'Fogata',
  'Leña, cielo despejado y el frío de la montaña: el cierre natural del día en Dapa.',
  'Se enciende en las noches, alrededor de las 6:00 – 7:00 p. m.: un espacio para reunirse y compartir al final del día, y La Maima regala los marshmallows. A 1.800 metros sobre el nivel del mar la noche baja rápido y con ella el frío de Dapa, así que el fogón de la zona común se vuelve el sitio donde termina el día, con las luces del Valle del Cauca de fondo y —si el cielo está despejado, que es casi siempre— un cielo estrellado sin contaminación lumínica. Se coordina con la administración el mismo día.',
  'Se enciende entre 6:00 y 7:00 p. m.',
  null, null, 'Bajo solicitud',
  '[{"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/fogata/1.jpg","alt":"Fogata encendida al anochecer, rodeada de troncos que sirven de asiento"}]'::jsonb,
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
  '[{"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/gastronomia/1.jpg","alt":"Comedor de La Maima bajo la pérgola al atardecer, con mesas de mosaico y sillas de madera"},{"url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/gastronomia/2.jpg","alt":"Zona del restaurante de La Maima con luces cálidas colgantes y vista al bosque"}]'::jsonb,
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
    "subtitle": "Casas y cabañas independientes en medio de 30 años de bosque rehabilitado, a 20 minutos de Cali. La combinación perfecta entre lujo y naturaleza.",
    "cta_label": "Ver alojamientos",
    "cta_href": "/alojamientos",
    "image": "https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/hero.jpg",
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
      "Sobre ese bosque construimos casas y cabañas independientes, cada una con cocineta y baño privado. Nada de pasillos ni recepciones: cada alojamiento tiene su propia entrada, su terraza y su pedazo de montaña.",
      "Estamos en el Km 12 de la Vía a Dapa, en Yumbo, a menos de una hora de Cali por carretera pavimentada. Suficientemente cerca para venir un fin de semana; suficientemente lejos para no oír la ciudad."
    ],
    "image": "https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/sobre-la-reserva.jpg",
    "image_alt": "Jardines de La Maima con vista abierta al Valle del Cauca",
    "stats": [
      { "value": "30", "label": "años de rehabilitación" },
      { "value": "{{alojamientos}}", "label": "casas y cabañas" },
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

-- =============================================================================
-- VERSIÓN INGLESA DEL SITIO PÚBLICO (/en)
-- =============================================================================
-- Traducciones sembradas junto con la migración `bilingual_english_columns`.
-- Van como UPDATE por slug (y no dentro de los INSERT de arriba) para que este
-- bloque se pueda volver a ejecutar sobre una base ya poblada sin tocar nada
-- más: el español es la fuente y esto es la capa de traducción.
--
-- Criterios de la traducción:
--   · Tono de hotel boutique, no calco literal del español.
--   · Los nombres propios de las casas NO se traducen (por eso no hay
--     `name_en` en accommodations); los de las experiencias SÍ, porque
--     describen la actividad ("Clase de yoga" -> "Yoga class").
--   · Los términos locales se conservan con una glosa breve la primera vez:
--     "sancocho, the slow-cooked Colombian chicken and plantain soup",
--     "guadua — the native bamboo of the region", "arepa (a griddled corn cake)",
--     "(mirador means lookout)".
--   · Los importes se escriben igual ($545.000) y se marcan como COP donde el
--     contexto no lo deja claro: un "$" suelto en inglés se lee como dólares.

-- -----------------------------------------------------------------------------
-- Alojamientos
-- -----------------------------------------------------------------------------
update public.accommodations set
  short_description_en = 'Our big two-storey house: four places to sleep, two living rooms, two dining rooms and a full kitchen. Sleeps up to 10.',
  description_en = E'Our big two-storey house, the largest on the reserve.\n\nUpstairs you will find the main bedroom, with a queen bed and an en-suite bathroom with hot water; a second bedroom with a double bed; and a third with a double bed, a two-person bunk and two single beds, plus a full bathroom off the hall.\n\nDownstairs there are two living rooms, two dining rooms, a TV room that turns into a bedroom with two single beds — step-free and suitable for guests with limited mobility —, a full bathroom, the kitchen and the bar. The kitchen comes with a coffee maker, microwave, fridge, stove and dishwasher, cooking equipment, and coffee, sugar, salt and washing-up liquid.\n\nBreakfast is not included in the rate: it costs $25.000 COP per person and is served between 8:00 and 9:30 in the morning.',
  price_note_en = 'Up to 8 guests · 25 % less Monday to Thursday',
  rate_note_en = 'Breakfast is not included: $25.000 COP per person. A 25 % discount applies Monday to Thursday, except on public holidays and between 14 December and 15 January.',
  amenities_en = '["Main bedroom with a queen bed and en-suite bathroom with hot water","Second bedroom with a double bed","Third bedroom with a double bed, a two-person bunk and two single beds","TV room that converts into a bedroom, step-free and suitable for limited mobility","Three full bathrooms with hot water","Two living rooms and two dining rooms","Kitchen with coffee maker, microwave, fridge, stove and dishwasher","Cooking equipment and a bar","Complimentary coffee, sugar, salt and washing-up liquid","Optional breakfast: $25.000 COP per person","Pet friendly at no extra cost"]'::jsonb
where slug = 'casa-maima';

update public.accommodations set
  short_description_en = 'The highest cabin on the reserve: a wide picture window, a terrace and a hammock over the forest. Sleeps 4, plus one on the sofa bed.',
  description_en = E'Our highest cabin, with a wide picture window and a terrace that open onto the forest — which is where the name comes from (mirador means lookout).\n\nIt has one bedroom with a queen bed and a second bedroom with two single beds. In the living area there is a sofa bed for one extra guest.\n\nThe kitchenette comes with a coffee maker, microwave, fridge, stove and dishwasher, cooking equipment, and coffee, sugar, salt and washing-up liquid. It is completed by a dining table, a hammock and a bathroom with hot water.\n\nBreakfast is included in the rate and is served between 8:00 and 9:30 in the morning.',
  price_note_en = '1 guest · breakfast included · 25 % less Monday to Thursday',
  rate_note_en = 'Breakfast is included. One extra guest on the sofa bed costs $75.000 COP. A 25 % discount applies Monday to Thursday, except on public holidays and between 14 December and 15 January.',
  amenities_en = '["Bedroom with a queen bed","Second bedroom with two single beds","Sofa bed for one extra guest","Wide picture window and terrace over the forest","Hammock","Kitchenette with coffee maker, microwave, fridge, stove and dishwasher","Cooking equipment and dining table","Complimentary coffee, sugar, salt and washing-up liquid","Bathroom with hot water","Breakfast included","Pet friendly at no extra cost"]'::jsonb
where slug = 'mirador';

update public.accommodations set
  short_description_en = 'Two bedrooms plus two single beds in the living area, with a kitchenette, dining table and bathroom with hot water. Sleeps up to 6.',
  description_en = E'A house for up to six guests, with one bedroom with a queen bed, a second bedroom with a double bed and two single beds in the living area.\n\nThe kitchenette comes with a coffee maker, microwave, fridge, stove and dishwasher, cooking equipment, and coffee, sugar, salt and washing-up liquid. It is completed by a dining table and a bathroom with hot water.\n\nBreakfast is included in the rate and is served between 8:00 and 9:30 in the morning.',
  price_note_en = '2 guests · breakfast included · 25 % less Monday to Thursday',
  rate_note_en = 'Breakfast is included. Each extra guest costs $75.000 COP. A 25 % discount applies Monday to Thursday, except on public holidays and between 14 December and 15 January.',
  amenities_en = '["Bedroom with a queen bed","Second bedroom with a double bed","Two single beds in the living area","Kitchenette with coffee maker, microwave, fridge, stove and dishwasher","Cooking equipment and dining table","Complimentary coffee, sugar, salt and washing-up liquid","Bathroom with hot water","Breakfast included","Pet friendly at no extra cost"]'::jsonb
where slug = 'casa-loma';

update public.accommodations set
  short_description_en = 'A long balcony over the hillside: the house for anyone who wants to have breakfast looking at the mountain.',
  description_en = 'Casa Uba leans into the slope and opens outwards along a balcony that runs the full width of the house. It is the place where breakfast takes its time, because the mist climbs the hillside and you have to stay and watch it. It sleeps up to four and keeps the spirit of an old Valle del Cauca farmhouse: white walls, dark timber and no noise at all. Fitted kitchenette, private bathroom and hot water.',
  price_note_en = 'Rate to be confirmed',
  rate_note_en = null,
  amenities_en = '["Fitted kitchenette","Private bathroom","Hot water","Balcony with mountain views","Parking","Bed linen and towels","Access to the reserve trails"]'::jsonb
where slug = 'casa-uba';

update public.accommodations set
  short_description_en = 'Two cabins joined by a balcony walkway, between a garden and a small stand of guadua bamboo. Sleeps up to 4.',
  description_en = E'Two cabins joined by a balcony walkway, surrounded by a garden and a small stand of guadua — the native bamboo of the region.\n\nEach one has its own bedroom with a queen bed and two single beds in the living area. The kitchenette comes with a coffee maker, microwave, fridge, stove and dishwasher, cooking equipment, and coffee, sugar, salt and washing-up liquid, and each cabin has its own bathroom with hot water.\n\nBreakfast is included in the rate and is served between 8:00 and 9:30 in the morning.',
  price_note_en = '2 guests · breakfast included · 25 % less Monday to Thursday',
  rate_note_en = 'Breakfast is included. Each extra guest costs $75.000 COP. A 25 % discount applies Monday to Thursday, except on public holidays and between 14 December and 15 January.',
  amenities_en = '["Two cabins joined by a balcony walkway","A bedroom with a queen bed in each cabin","Two single beds in the living area of each cabin","Garden and a small stand of guadua bamboo around them","Kitchenette with coffee maker, microwave, fridge, stove and dishwasher","Cooking equipment","Complimentary coffee, sugar, salt and washing-up liquid","Bathroom with hot water","Breakfast included","Pet friendly at no extra cost"]'::jsonb
where slug = 'dos-casitas';

update public.accommodations set
  short_description_en = 'A single-room cabin with a queen bed, a single bed and a table out on the terrace. Sleeps up to 3.',
  description_en = E'A single-room cabin, with a queen bed and one single bed.\n\nThe kitchenette comes with a coffee maker, microwave, fridge, stove and dishwasher, cooking equipment, and coffee, sugar, salt and washing-up liquid. It is completed by a bathroom with hot water and a table out on the terrace.\n\nIt is the only cabin with its own Monday-to-Thursday rate: on non-holiday weekdays a stay here costs considerably less than at the weekend.',
  price_note_en = '1 guest, Monday to Thursday · $390.000 at the weekend',
  rate_note_en = 'Separate rates for Monday to Thursday (excluding public holidays) and for the weekend. Each extra guest costs $75.000 COP at the weekend and $55.000 COP Monday to Thursday.',
  amenities_en = '["Queen bed and one single bed in a single room","Table on the terrace","Kitchenette with coffee maker, microwave, fridge, stove and dishwasher","Cooking equipment","Complimentary coffee, sugar, salt and washing-up liquid","Bathroom with hot water","Reduced rate Monday to Thursday, excluding public holidays","Pet friendly at no extra cost"]'::jsonb
where slug = 'tres-casitas';

-- -----------------------------------------------------------------------------
-- Experiencias (aquí el nombre sí se traduce)
-- -----------------------------------------------------------------------------
update public.experiences set
  name_en = 'Day pass',
  short_description_en = 'A full day at the reserve: lunch, yoga, the trail down to the river, the water features and the fire pit.',
  description_en = 'Available on Sundays and public holidays, from 10:00 a.m. to 6:00 p.m. It includes lunch and access to every activity on the reserve: the yoga class, the trail down to the river, the water features — the natural pool and the little waterfall — and staying on until the fire pit is lit. It also covers the use of the showers by the yoga room and the restaurant area. It does not include entry to, or use of, the cabins.',
  duration_en = '10:00 a.m. to 6:00 p.m., Sundays and public holidays',
  price_note_en = '$110.000 COP per person'
where slug = 'pasadia';

update public.experiences set
  name_en = 'Yoga class',
  short_description_en = 'Traditional yoga to feel and move the body through the breath, in a room set aside for our guests.',
  description_en = 'Included in the room rate and in the day pass. It is offered mainly on Sundays and public holidays, in a room set aside for our guests, with a maximum of 15 people per class. It runs from an hour and a half to two hours of traditional yoga, built around feeling and moving the body through the breath. For anyone who only wants the class, it costs $40.000 COP per person and does not include access to the rest of the reserve.',
  duration_en = 'An hour and a half to two hours',
  price_note_en = 'Included · class only $40.000 COP'
where slug = 'clase-de-yoga';

update public.experiences set
  name_en = 'Trails through the reserve',
  short_description_en = 'About 45 minutes of forest down to a branch of the Arroyohondo river, to bathe among the big boulders.',
  description_en = 'A forest trail of roughly 45 minutes that reaches a branch of the Arroyohondo river, where you can bathe in the natural stream among the big boulders. More than a hike, it is an invitation to take in the forest along the way: the wind, the leaves, the earth, the butterflies and the life of the place. The path is built as steps edged with guadua bamboo cut from the forest itself. The difficulty is moderate and good footwear is essential; it is not recommended for guests with reduced mobility.',
  duration_en = 'About 45 minutes down to the river',
  price_note_en = 'Included in your stay'
where slug = 'senderos-por-la-reserva';

update public.experiences set
  name_en = 'River pool',
  short_description_en = 'A natural pool of cold, clear water formed by the stream that crosses the reserve.',
  description_en = 'The stream that comes down the mountain crosses the reserve and, at one point, opens out among large rocks to form a natural pool. The water is cold, clear and runs all year round. There is flat rock around it to stretch out in the sun, and forest shade for when the midday heat sets in. It is a few minutes'' walk from the houses along a signposted path. We recommend shoes with good grip, and going down with company.',
  duration_en = 'Open throughout the day',
  price_note_en = 'Included in your stay'
where slug = 'piscina-de-rio';

update public.experiences set
  name_en = 'Natural pool and waterfall',
  short_description_en = 'Two cold-water spots in the common areas, for meditating, sharing a drink or simply taking a dip.',
  description_en = 'Set in the main common areas, the pool and the little waterfall are two separate bodies of water. Perfect for meditating in the cold water, enjoying it with friends and a drink, or simply taking a dip.',
  duration_en = 'Open throughout the day',
  price_note_en = 'Included in your stay'
where slug = 'pileta-natural-y-chorrera';

update public.experiences set
  name_en = 'Birdwatching and wildlife',
  short_description_en = 'Thirty years of restoration have brought back the birds, orchids and mammals of the Andean forest.',
  description_en = 'La Maima started out as a restoration project thirty years ago, and the result is plain to see: the reserve is now home to toucans, guans, several species of hummingbird, agoutis and a growing community of orchids, bromeliads and tree ferns. The first hours of the morning are the best for spotting them, especially along the forest edges and near the water. Bring binoculars; we will show you where to look.',
  duration_en = 'Best between 6:00 and 9:00 a.m.',
  price_note_en = 'Included in your stay'
where slug = 'avistamiento-de-flora-y-fauna';

update public.experiences set
  name_en = 'Fire pit',
  short_description_en = 'Firewood, a clear sky and the mountain cold: the natural way to close the day in Dapa.',
  description_en = 'It is lit in the evening, at around 6:00 – 7:00 p.m.: a place to gather and share at the end of the day, and La Maima brings the marshmallows. At 1,800 metres above sea level night falls quickly and brings the Dapa cold with it, so the fire in the common area becomes the spot where the day ends, with the lights of the Cauca Valley below and — if the sky is clear, which it almost always is — a starry sky with no light pollution. It is arranged with the front desk on the day.',
  duration_en = 'Lit between 6:00 and 7:00 p.m.',
  price_note_en = 'On request'
where slug = 'fogata';

update public.experiences set
  name_en = 'Farm-style home cooking',
  short_description_en = 'Food like you would eat at home: simple, generous and cooked fresh every day with produce from the countryside.',
  description_en = 'Farm-style home cooking, prepared fresh every day. At La Maima the food is the food of a family home: simple, generous and made with fresh produce. There is no à la carte menu — each day we cook one dish for everyone, although we keep four standard dishes in rotation — and on Sundays and public holidays our classic is sancocho, the slow-cooked Colombian chicken and plantain soup. Lunches are available at weekends and, midweek, for groups of more than six. Breakfast is included in every cabin except Casa Maima: it is served at the table, starting with seasonal fruit and orange juice and going on to eggs cooked to your liking, bread and arepa (a griddled corn cake), coffee or hot chocolate, butter, jam and fresh cuajada cheese. If you have any dietary restriction or allergy, tell us when you book and we will do our best to accommodate it.',
  duration_en = 'Breakfast from 8:00 to 9:30 a.m.',
  price_note_en = 'Breakfast included'
where slug = 'gastronomia';

-- -----------------------------------------------------------------------------
-- Rótulos de estancia mínima (se publican en la ficha del alojamiento)
-- -----------------------------------------------------------------------------
update public.min_stay_rules set label_en = 'Long holiday weekends'               where label = 'Puentes festivos';
update public.min_stay_rules set label_en = 'Easter Week 2027'                    where label = 'Semana Santa 2027';
update public.min_stay_rules set label_en = 'Easter Week 2028'                    where label = 'Semana Santa 2028';
update public.min_stay_rules set label_en = 'High season, 23 Dec – 7 Jan 2026/27' where label = 'Temporada 23 dic – 7 ene 2026/27';
update public.min_stay_rules set label_en = 'High season, 23 Dec – 7 Jan 2027/28' where label = 'Temporada 23 dic – 7 ene 2027/28';

-- -----------------------------------------------------------------------------
-- Contenido editable de la portada (espejo parcial: solo las claves de texto)
-- -----------------------------------------------------------------------------
update public.site_content set value_en = jsonb_build_object(
  'eyebrow',   'Nature reserve and country hotel',
  'title',     'Nature within your reach',
  'subtitle',  'Independent houses and cabins set in 30 years of restored forest, 20 minutes from Cali. The perfect balance of comfort and wilderness.',
  'cta_label', 'See our stays',
  'image_alt', 'A blue-roofed cabin at La Maima facing the native forest hillside in the mountains of Dapa'
) where key = 'home_hero';

update public.site_content set value_en = jsonb_build_object(
  'eyebrow', 'About the reserve',
  'title',   'Thirty years giving the forest back to the mountain',
  'paragraphs', jsonb_build_array(
    'La Maima began as a family restoration project in the mountains of Dapa. Three decades later, what used to be pasture is a reserve where primary, secondary and tertiary forest grow side by side on the same hillside, with the wildlife of the Andean forest back home: toucans, guans, hummingbirds and agoutis.',
    'On top of that forest we built independent houses and cabins, each with its own kitchenette and private bathroom. No corridors, no reception desk: every house has its own entrance, its own terrace and its own piece of mountain.',
    'We are at kilometre 12 of the Dapa road, in Yumbo, less than an hour from Cali on paved road. Close enough to come for a weekend; far enough not to hear the city.'
  ),
  'stats', jsonb_build_array(
    jsonb_build_object('value', '30', 'label', 'years of restoration'),
    jsonb_build_object('value', '{{alojamientos}}', 'label', 'houses and cabins'),
    jsonb_build_object('value', '3',  'label', 'types of forest')
  ),
  'image_alt', 'The Cauca Valley seen from La Maima, with the forest of the reserve in the foreground',
  'gallery', jsonb_build_array(
    jsonb_build_object('url', 'https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/sobre-la-reserva.jpg', 'alt', 'The Cauca Valley seen from La Maima, with the forest of the reserve in the foreground'),
    jsonb_build_object('url', 'https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/bosque.jpg', 'alt', 'Inside the reserve''s forest, with ferns and tall moss-covered trees'),
    jsonb_build_object('url', 'https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/piscina-de-rio/1.jpg', 'alt', 'A cold-water stream with natural pools among the rocks of the reserve'),
    jsonb_build_object('url', 'https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/avistamiento-de-flora-y-fauna/1.jpg', 'alt', 'An emerald toucanet perched on a branch in the forest at La Maima'),
    jsonb_build_object('url', 'https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/senderos.jpg', 'alt', 'An earth trail running through the restored forest of the reserve')
  )
) where key = 'home_about';

update public.site_content set value_en = jsonb_build_object(
  'alojamientos', jsonb_build_object('image_alt', 'The picture window at Mirador, La Maima, looking out over the Cauca Valley'),
  'experiencias', jsonb_build_object('image_alt', 'A trail with timber steps between guadua bamboo and forest trees at La Maima, with a bamboo bench to one side')
) where key = 'listing_heroes';

update public.site_content set value_en = jsonb_build_object(
  'image_alt', 'La Maima, country hotel and nature reserve in Dapa, Yumbo, Colombia'
) where key = 'seo';

update public.site_content set value_en = jsonb_build_object(
  'gallery', jsonb_build_array(
    jsonb_build_object('url', 'https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/sobre-la-reserva.jpg', 'alt', 'The Cauca Valley seen from the gardens at La Maima, under a cloudy sky'),
    jsonb_build_object('url', 'https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/2.jpg', 'alt', 'The panoramic window at Mirador, open onto the forest and the valley'),
    jsonb_build_object('url', 'https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/avistamiento-de-flora-y-fauna/1.jpg', 'alt', 'An emerald toucanet perched on a branch in the forest of the reserve'),
    jsonb_build_object('url', 'https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/5.jpg', 'alt', 'The terrace at Mirador with a hammock hung facing the mountain'),
    jsonb_build_object('url', 'https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/piscina-de-rio/1.jpg', 'alt', 'A cold-water stream with natural pools among the rocks of the forest'),
    jsonb_build_object('url', 'https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/1.jpg', 'alt', 'The front of Casa Maima with its blue roof and its garden of tropical plants')
  )
) where key = 'instagram_strip';
