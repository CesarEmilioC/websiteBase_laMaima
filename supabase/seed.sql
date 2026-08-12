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
-- Experiencias (4)
-- -----------------------------------------------------------------------------
insert into public.experiences
  (slug, name, short_description, description, duration,
   capacity, price_cop, price_note, gallery, visible, sort_order)
values
(
  'senderos-por-la-reserva',
  'Senderos por la reserva',
  'Rutas de distinta exigencia por bosque primario, secundario y terciario, a su propio ritmo.',
  'La reserva se recorre a pie por una red de senderos que atraviesa los tres estados del bosque: el terciario, el más joven, sembrado por la familia; el secundario, ya cerrado y en plena recuperación; y el primario, que nunca fue talado y donde los árboles llevan siglos en pie. Hay rutas cortas de media hora y caminatas de media mañana hasta los miradores altos. Se pueden hacer por cuenta propia o con acompañamiento, coordinándolo con anticipación.',
  '30 minutos a 3 horas',
  null, null, 'Incluida en la estadía',
  '[{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/sitio/senderos.jpg","alt":"Sendero entre los jardines de La Maima con vista al Valle del Cauca"}]'::jsonb,
  true, 1
),
(
  'fogata',
  'Fogata',
  'Leña, cielo despejado y el frío de la montaña: el cierre natural del día en Dapa.',
  'A 1.800 metros sobre el nivel del mar la noche baja rápido y con ella el frío de Dapa, así que la fogata deja de ser un plan y se vuelve el sitio donde termina el día. Encendemos el fogón en la zona común, al aire libre, con las luces del Valle del Cauca de fondo y —si el cielo está despejado, que es casi siempre— un cielo estrellado sin contaminación lumínica. Ideal para grupos y familias. Se coordina con la administración el mismo día.',
  '2 a 3 horas',
  null, null, 'Bajo solicitud',
  '[{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/experiencias/fogata/1.jpg","alt":"Fogata encendida en la zona común de La Maima al anochecer"}]'::jsonb,
  true, 2
),
(
  'piscina-de-rio',
  'Piscina de río',
  'Un pozo natural de agua fría y transparente, formado por la quebrada que cruza la reserva.',
  'La quebrada que baja de la montaña atraviesa la reserva y en un punto se abre entre piedras grandes formando un pozo natural. El agua es fría, clara y corre todo el año. Alrededor hay piedra plana para tenderse al sol y sombra de bosque cuando aprieta el mediodía. Está a pocos minutos a pie desde los alojamientos, por sendero señalizado. Recomendamos calzado con agarre y bajar acompañado.',
  'Libre durante el día',
  null, null, 'Incluida en la estadía',
  '[{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/sitio/rio.jpg","alt":"Piscina natural formada por la quebrada entre piedras dentro de la reserva"}]'::jsonb,
  true, 3
),
(
  'avistamiento-de-flora-y-fauna',
  'Avistamiento de flora y fauna',
  'Treinta años de rehabilitación han traído de vuelta aves, orquídeas y mamíferos del bosque andino.',
  'La Maima empezó como un proyecto de recuperación hace treinta años, y el resultado se ve a simple vista: hoy la reserva alberga tucanes, pavas, colibríes de varias especies, guatines y una comunidad creciente de orquídeas, bromelias y helechos arbóreos. Las primeras horas de la mañana son las mejores para el avistamiento, sobre todo en los bordes de bosque y cerca del agua. Traiga binóculos; nosotros le indicamos dónde buscar.',
  'Mejor entre 6:00 y 9:00 a. m.',
  null, null, 'Incluida en la estadía',
  '[{"url":"https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/sitio/bosque.jpg","alt":"Dosel del bosque nativo en las montañas de Dapa, hábitat de la fauna de la reserva"}]'::jsonb,
  true, 4
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
