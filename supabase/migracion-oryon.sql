-- =============================================================================
-- MIGRACIÓN A LA INFRAESTRUCTURA DE ORYON — proyecto Supabase ausqyfdglyxapeszkrck
-- =============================================================================
-- Generado: 1 de septiembre de 2026.
--
-- CÓMO USARLO
--   Supabase Dashboard (proyecto NUEVO de ORYON) -> SQL Editor -> New query
--   -> pegar ESTE archivo COMPLETO -> Run.  Es un solo paso.
--
-- Este archivo es AUTOSUFICIENTE e IDEMPOTENTE (se puede volver a correr):
--   A. Esquema completo (extensiones, tablas, triggers, índices, EXCLUDE,
--      función release_expired_holds, RLS y todas las policies).
--   B. Bucket "gallery" + sus policies de storage.
--   C. Todos los datos del proyecto anterior, con las URLs de imágenes ya
--      reescritas al host nuevo (ausqyfdglyxapeszkrck).
--   D. Usuario administrador admin@lamaima.com (solo si no existe todavía).
--   E. Consulta final de verificación (debe imprimir "OK" en cada fila).
--
-- LO QUE YA ESTÁ HECHO y este archivo NO repite:
--   · Los 76 objetos del bucket, copiados por REST y verificados uno a uno
--     (mismas rutas, tamaños y mime types). Aquí solo se registra el bucket y
--     sus permisos, no se vuelven a subir los archivos.
--   · El usuario admin@lamaima.com, creado con la API de administración de
--     Auth y con el inicio de sesión ya comprobado. El bloque D se salta solo
--     si el correo ya existe.
--
-- Lo único que falta, y es lo que hace este archivo, es el ESQUEMA y los DATOS:
-- no hay forma de ejecutar DDL contra el proyecto con las llaves de API, así
-- que este paso tiene que darse desde el SQL Editor del panel.
--
-- El proyecto anterior (mauolzwhergekdvigmaf) NO se toca.
-- =============================================================================


-- =============================================================================
-- A. ESQUEMA
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Extensiones
-- -----------------------------------------------------------------------------
-- pgcrypto: gen_random_uuid(). Ya viene instalada en Supabase (schema extensions).
create extension if not exists pgcrypto with schema extensions;

-- btree_gist: permite combinar una columna de igualdad (accommodation_id, uuid)
-- con una columna de rango (&&) dentro de la misma restricción EXCLUDE, que es
-- lo que usa "bookings" para impedir el solape de fechas.
create extension if not exists btree_gist with schema extensions;


-- -----------------------------------------------------------------------------
-- Función utilitaria: mantener "updated_at" en cada UPDATE.
-- search_path fijo y vacío (recomendación de seguridad de Supabase: evita el
-- secuestro de la resolución de nombres desde un search_path manipulado).
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =============================================================================
-- 1. accommodations — alojamientos (casas y cabañas)
-- =============================================================================
create table if not exists public.accommodations (
  id                  uuid primary key default gen_random_uuid(),

  -- slug para URLs públicas: /alojamientos/[slug]
  slug                text not null unique,
  name                text not null,

  -- resumen de 1–2 líneas para las tarjetas de listado
  short_description   text,
  -- texto largo para la página de detalle
  description         text,

  -- Ocupación máxima, incluidos los huéspedes adicionales que se admiten:
  -- el Mirador es "hasta 4 (+1 en sofá cama)", así que su capacity es 5.
  capacity            integer not null check (capacity > 0),

  -- Tarifa "Desde" de los listados. La tarifa REAL se calcula por ocupación
  -- con `rate_tiers` (ver más abajo); esta columna se mantiene sincronizada
  -- con el tramo más bajo y es el respaldo de los alojamientos que todavía no
  -- tienen tabla publicada.
  price_per_night_cop integer not null check (price_per_night_cop >= 0),
  -- aclaración corta junto al precio, ej. "1 persona · desayuno incluido"
  price_note          text,

  /* --- Modelo de tarifas real (migración `occupancy_rate_model`) ---------
     Fuente: documento oficial de tarifas de La Maima. */

  -- Valor por huésped por encima del tramo más alto de rate_tiers.
  -- Null = no se admiten adicionales (Casa Maima).
  extra_person_price_cop         integer
    check (extra_person_price_cop is null or extra_person_price_cop >= 0),
  -- Solo lo usa Tres Casitas, que tiene adicional propio de lunes a jueves.
  extra_person_price_weekday_cop integer
    check (extra_person_price_weekday_cop is null
           or extra_person_price_weekday_cop >= 0),

  breakfast_included             boolean not null default false,
  -- Valor por persona cuando el desayuno se cobra aparte. Null = el documento
  -- del cliente no lo define (no se inventa un precio).
  breakfast_price_cop            integer
    check (breakfast_price_cop is null or breakfast_price_cop >= 0),

  -- Descuento sobre la tarifa base en noches de lunes a jueves NO festivas
  -- (25 en casi todas). Null en Tres Casitas, que ya publica tabla propia.
  weekday_discount_pct           integer
    check (weekday_discount_pct is null
           or (weekday_discount_pct > 0 and weekday_discount_pct < 100)),

  -- Aclaración larga de la tarifa, redactada por el cliente.
  rate_note                      text,

  -- ["Cocineta equipada", "Baño privado", ...]
  amenities           jsonb not null default '[]'::jsonb,

  /* --- Versión inglesa del sitio (migración `bilingual_english_columns`) ---
     El texto español se queda en las columnas de siempre y el inglés va en
     estas gemelas. Donde la traducción falte o venga vacía, la capa de
     contenido cae al español: una ficha a medio traducir se lee, un hueco en
     blanco parece una página rota.

     NO hay `name_en`: "Casa Maima", "Mirador" o "Tres Casitas" son nombres
     propios de las casas y traducirlos rompería la correspondencia con los
     letreros, con Airbnb y con lo que el equipo dice por WhatsApp. */
  short_description_en text,
  description_en       text,
  price_note_en        text,
  rate_note_en         text,
  -- Se usa ENTERA o no se usa: media lista traducida en la misma tabla se lee
  -- peor que la original sin traducir.
  amenities_en        jsonb not null default '[]'::jsonb,

  -- [{ "url": "https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/1.jpg", "alt": "..." }, ...]
  gallery             jsonb not null default '[]'::jsonb,

  -- si es false no se muestra en el sitio público (borrador / fuera de servicio)
  visible             boolean not null default true,
  -- orden manual en los listados (menor = primero)
  sort_order          integer not null default 0,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists set_updated_at_accommodations on public.accommodations;
create trigger set_updated_at_accommodations
  before update on public.accommodations
  for each row execute function public.set_updated_at();

create index if not exists idx_accommodations_visible
  on public.accommodations (visible, sort_order);


-- =============================================================================
-- 1b. rate_tiers — precio por número de huéspedes
-- =============================================================================
-- El precio de La Maima NO es "una tarifa por noche": cada cabaña publica una
-- tabla por ocupación. Se cobra el tramo más bajo cuyo `guests` alcance para
-- el grupo (Casa Maima tiene 8 y 10: nueve personas pagan el de 10), y por
-- encima del tramo más alto entra `extra_person_price_cop`.
create table if not exists public.rate_tiers (
  id               uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null references public.accommodations (id)
                     on delete cascade,

  guests           integer not null check (guests > 0),
  price_cop        integer not null check (price_cop >= 0),

  -- 'any'     : una sola tabla, válida todos los días (el caso normal)
  -- 'weekend' : tabla de fin de semana / festivos   \  solo Tres Casitas, la
  -- 'weekday' : tabla propia de lunes a jueves      /  única con dos tablas
  day_type         text not null default 'any'
                     check (day_type in ('any', 'weekend', 'weekday')),

  sort             integer not null default 0,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint rate_tiers_unique unique (accommodation_id, day_type, guests)
);

drop trigger if exists set_updated_at_rate_tiers on public.rate_tiers;
create trigger set_updated_at_rate_tiers
  before update on public.rate_tiers
  for each row execute function public.set_updated_at();

create index if not exists idx_rate_tiers_accommodation
  on public.rate_tiers (accommodation_id, day_type, guests);


-- =============================================================================
-- 1c. min_stay_rules — estancia mínima por temporada y por cabaña
-- =============================================================================
create table if not exists public.min_stay_rules (
  id               uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null references public.accommodations (id)
                     on delete cascade,

  -- Texto que ve el huésped: "Puentes festivos", "Semana Santa 2027"…
  label            text not null,
  -- Su gemela inglesa: el rótulo se publica en la ficha ("Easter Week:
  -- minimum 3 nights"), así que también viaja traducido.
  label_en         text,

  -- 'holiday_bridge': cualquier fin de semana largo (festivo en lunes). Se
  --                   calcula con `holidays`, así que no lleva fechas.
  -- 'date_range'    : temporada con fechas explícitas y editables.
  rule_type        text not null
                     check (rule_type in ('holiday_bridge', 'date_range')),

  -- Noches cubiertas, AMBOS extremos inclusive.
  date_from        date,
  date_to          date,

  min_nights       integer not null check (min_nights > 0),
  sort             integer not null default 0,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint min_stay_rules_dates check (
    (rule_type = 'date_range'
      and date_from is not null and date_to is not null and date_to >= date_from)
    or (rule_type = 'holiday_bridge')
  )
);

drop trigger if exists set_updated_at_min_stay_rules on public.min_stay_rules;
create trigger set_updated_at_min_stay_rules
  before update on public.min_stay_rules
  for each row execute function public.set_updated_at();

create index if not exists idx_min_stay_rules_accommodation
  on public.min_stay_rules (accommodation_id, sort);


-- =============================================================================
-- 1d. holidays — festivos de Colombia (Ley 51 de 1983, "Ley Emiliani")
-- =============================================================================
-- Sembrada con 2026 y 2027 completos (los festivos trasladables ya corridos al
-- lunes siguiente). Se amplía con un INSERT cuando haga falta otro año; el CRUD
-- desde el panel queda para una fase posterior.
create table if not exists public.holidays (
  holiday_date date primary key,
  name         text not null,

  -- Un festivo en LUNES arma "puente". Es columna GENERADA para que no pueda
  -- quedar desincronizada con la fecha si alguien edita la fila a mano.
  is_bridge    boolean generated always as
                 (extract(isodow from holiday_date) = 1) stored,

  created_at   timestamptz not null default now()
);

create index if not exists idx_holidays_bridge
  on public.holidays (is_bridge, holiday_date);


-- =============================================================================
-- 1e. rate_plans — paquetes y tarifas especiales
-- =============================================================================
-- Fundación para lo que el cliente cree más adelante ("San Valentín", puentes
-- con cena, etc.). Se deja VACÍA a propósito: hoy no existe ninguno.
-- Cuando un plan activo cubre una noche y trae precio, ese precio manda sobre
-- rate_tiers y anula el descuento de lunes a jueves.
create table if not exists public.rate_plans (
  id                  uuid primary key default gen_random_uuid(),

  -- Null = el plan aplica a TODOS los alojamientos.
  accommodation_id    uuid references public.accommodations (id)
                        on delete cascade,

  name                text not null,
  description         text,

  -- Noches cubiertas, ambos extremos inclusive.
  date_from           date not null,
  date_to             date not null,

  -- Null = el plan solo nombra la temporada y conserva el precio por tramos.
  price_per_night_cop integer
                        check (price_per_night_cop is null
                               or price_per_night_cop >= 0),
  guests_included     integer
                        check (guests_included is null or guests_included > 0),

  active              boolean not null default true,
  sort                integer not null default 0,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint rate_plans_dates check (date_to >= date_from)
);

drop trigger if exists set_updated_at_rate_plans on public.rate_plans;
create trigger set_updated_at_rate_plans
  before update on public.rate_plans
  for each row execute function public.set_updated_at();

create index if not exists idx_rate_plans_window
  on public.rate_plans (active, date_from, date_to);


-- =============================================================================
-- 2. experiences — experiencias / actividades de la reserva
-- =============================================================================
-- A diferencia de accommodations, aquí precio y capacidad son OPCIONALES: hoy
-- varias experiencias están incluidas en la estadía y no tienen tarifa ni cupo
-- definidos. "price_note" cubre el caso ("Incluida en la estadía").
create table if not exists public.experiences (
  id                uuid primary key default gen_random_uuid(),

  slug              text not null unique,
  name              text not null,

  short_description text,
  description       text,

  -- duración aproximada, texto libre: "1–2 horas", "Todo el día"
  duration          text,

  -- capacidad opcional (null = sin cupo definido)
  capacity          integer check (capacity is null or capacity > 0),

  -- precio por persona en COP; null = sin costo adicional / por confirmar
  price_cop         integer check (price_cop is null or price_cop >= 0),
  price_note        text,

  /* --- Versión inglesa. A diferencia de los alojamientos, aquí el NOMBRE sí
     se traduce: "Clase de yoga" describe la actividad, no es una marca. */
  name_en              text,
  short_description_en text,
  description_en       text,
  duration_en          text,
  price_note_en        text,

  gallery           jsonb not null default '[]'::jsonb,

  visible           boolean not null default true,
  sort_order        integer not null default 0,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists set_updated_at_experiences on public.experiences;
create trigger set_updated_at_experiences
  before update on public.experiences
  for each row execute function public.set_updated_at();

create index if not exists idx_experiences_visible
  on public.experiences (visible, sort_order);


-- =============================================================================
-- 3. bookings — reservas (solicitudes del sitio + registro manual)
-- =============================================================================
-- Migraciones aplicadas encima del esquema inicial:
--   · `booking_engine_holds_and_codes`  (2026-09-01)
--   · `release_expired_holds_function`  (2026-09-01)
create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),

  accommodation_id uuid not null references public.accommodations (id)
                     on delete restrict,

  guest_name       text not null,
  guest_email      text,
  guest_phone      text,

  check_in         date not null,
  check_out        date not null,
  guests           integer not null check (guests > 0),

  total_cop        integer not null check (total_cop >= 0),

  -- pending  : solicitud recibida. Si viene del sitio, con hold de 48 h
  --            (expires_at); si la registra el equipo, sin vencimiento.
  -- confirmed: el equipo la dio por buena. Ocupa fechas SIN vencimiento.
  -- paid     : pago confirmado (fase Wompi).
  -- cancelled: cancelada (no bloquea fechas).
  -- external : registrada manualmente desde Airbnb/Booking/otro canal.
  status           text not null default 'pending'
                     check (status in ('pending', 'confirmed', 'paid',
                                       'cancelled', 'external')),

  source           text not null default 'web'
                     check (source in ('web', 'airbnb', 'booking', 'manual')),

  -- referencia de la transacción en Wompi o del canal externo
  payment_ref      text,

  /* --- Motor de reservas (migración `booking_engine_holds_and_codes`) -----
     booking_code: código legible y DICTABLE por teléfono, tipo "LM-7F3K". Lo
       genera el flujo público (ver src/lib/booking/code.ts) con un alfabeto sin
       caracteres confundibles. Único, pero nulo en las filas que registra el
       equipo a mano: varios NULL no chocan entre sí en un índice único.
     expires_at: vencimiento del HOLD de 48 horas. NULL = no vence (confirmed,
       paid, manual, external). REGLA: un `pending` con expires_at < now() NO
       ocupa calendario. Como la restricción EXCLUDE de más abajo no puede leer
       now() —su predicado tiene que ser inmutable—, toda creación de reserva
       llama antes a release_expired_holds(). Ver src/lib/booking/holds.ts.
     notes: lo que escribe el huésped en el formulario, más las anotaciones del
       sistema (p. ej. "Hold vencido: …").
     locale: idioma en que el huésped hizo la solicitud. Decide el idioma de SUS
       correos; el aviso interno siempre va en español. */
  booking_code     text,
  expires_at       timestamptz,
  notes            text,
  locale           text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint bookings_checkout_after_checkin check (check_out > check_in),
  constraint bookings_locale_check check (locale is null or locale in ('es', 'en'))
);

drop trigger if exists set_updated_at_bookings on public.bookings;
create trigger set_updated_at_bookings
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- Único, admitiendo varios NULL.
create unique index if not exists bookings_booking_code_key
  on public.bookings (booking_code);

-- Restricción anti-solape: para un mismo alojamiento no pueden coexistir dos
-- reservas activas (pending, confirmed o paid) con rangos de fechas que se
-- crucen. Rango medio-abierto [check_in, check_out) para que el día de salida
-- de un huésped pueda ser el día de entrada del siguiente.
--
-- Las "cancelled" y "external" quedan fuera: la primera ya no ocupa calendario
-- y la segunda se refleja en blocked_dates (importado por iCal).
--
-- ESTA ES LA ÚLTIMA LÍNEA DE DEFENSA contra la carrera entre dos solicitudes
-- simultáneas: la Server Action re-comprueba disponibilidad antes de insertar,
-- pero entre esa comprobación y el INSERT cabe otra transacción. El perdedor
-- recibe un 23P01, que el código traduce a "esas fechas se acaban de ocupar".
alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    accommodation_id with =,
    daterange(check_in, check_out, '[)') with &&
  )
  where (status in ('pending', 'confirmed', 'paid'));

create index if not exists idx_bookings_accommodation_dates
  on public.bookings (accommodation_id, check_in, check_out);

create index if not exists idx_bookings_status
  on public.bookings (status);

-- Para el barrido de holds vencidos: parcial, porque solo los pending vencen.
create index if not exists idx_bookings_pending_expiry
  on public.bookings (accommodation_id, expires_at)
  where status = 'pending';


-- -----------------------------------------------------------------------------
-- release_expired_holds(): cancela los holds vencidos de un alojamiento.
-- -----------------------------------------------------------------------------
-- Se llama SIEMPRE antes de crear o reactivar una reserva (flujo público y
-- panel), por el motivo explicado arriba: la restricción EXCLUDE no puede leer
-- now(), así que para ella un hold vencido sigue ocupando sitio.
--
-- Va en una sola sentencia UPDATE para que sea atómico: entre un SELECT y un
-- UPDATE hechos por separado cabría otra transacción.
--
-- security INVOKER a propósito: el flujo público la llama con la clave de
-- servicio (que se salta RLS) y el panel con el JWT del administrador (que
-- tiene política total sobre bookings). Nadie más necesita ejecutarla.
create or replace function public.release_expired_holds(
  p_note              text,
  p_accommodation_id  uuid default null
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  released integer;
begin
  update public.bookings
     set status = 'cancelled',
         notes  = case
                    when notes is null or btrim(notes) = '' then p_note
                    else notes || chr(10) || p_note
                  end
   where status = 'pending'
     and expires_at is not null
     and expires_at <= now()
     and (p_accommodation_id is null or accommodation_id = p_accommodation_id);

  get diagnostics released = row_count;
  return released;
end;
$$;

revoke all on function public.release_expired_holds(text, uuid) from public;
revoke all on function public.release_expired_holds(text, uuid) from anon;
grant execute on function public.release_expired_holds(text, uuid) to authenticated;
grant execute on function public.release_expired_holds(text, uuid) to service_role;


-- =============================================================================
-- 4. blocked_dates — fechas bloqueadas manualmente o importadas por iCal
-- =============================================================================
create table if not exists public.blocked_dates (
  id               uuid primary key default gen_random_uuid(),

  accommodation_id uuid not null references public.accommodations (id)
                     on delete cascade,

  -- rango medio-abierto, mismo criterio que bookings
  date_range       daterange not null,

  -- "Mantenimiento", "Importado de Airbnb", "Reservado en Booking.com"
  reason           text,

  created_at       timestamptz not null default now()
);

create index if not exists idx_blocked_dates_accommodation
  on public.blocked_dates using gist (accommodation_id, date_range);


-- =============================================================================
-- 5. site_content — textos editables del sitio público
-- =============================================================================
create table if not exists public.site_content (
  -- clave legible: "home_hero", "home_about", "contact"
  key        text primary key,
  -- objeto jsonb libre por sección
  value      jsonb not null default '{}'::jsonb,
  /* Espejo PARCIAL en inglés: solo las claves de TEXTO. Lo que no traiga
     (fotos, direcciones, números) se hereda del español al fusionar, así que
     cambiar una imagen desde el panel la cambia en los dos idiomas. La fusión
     es profunda para objetos anidados y de reemplazo para arreglos; ver
     `mergeContent()` en src/lib/content.ts. */
  value_en   jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at_site_content on public.site_content;
create trigger set_updated_at_site_content
  before update on public.site_content
  for each row execute function public.set_updated_at();


-- =============================================================================
-- 6. ical_feeds — feeds de sincronización con Airbnb / Booking.com
-- =============================================================================
create table if not exists public.ical_feeds (
  id               uuid primary key default gen_random_uuid(),

  accommodation_id uuid not null references public.accommodations (id)
                     on delete cascade,

  platform         text not null check (platform in ('airbnb', 'booking', 'other')),

  -- URL del .ics a importar
  import_url       text not null,

  last_synced_at   timestamptz,

  created_at       timestamptz not null default now()
);

create index if not exists idx_ical_feeds_accommodation
  on public.ical_feeds (accommodation_id);


-- =============================================================================
-- 7. Row Level Security (RLS)
-- =============================================================================
--   - accommodations / experiences: lectura pública SOLO de visible = true;
--     lectura total y escritura solo para "authenticated" (panel admin).
--   - site_content: lectura pública; escritura solo "authenticated".
--   - bookings / blocked_dates / ical_feeds: sin políticas para "anon", así que
--     RLS deniega por defecto. El flujo público de reserva NO habla con la base
--     desde el navegador: pasa por una Server Action que usa
--     SUPABASE_SERVICE_ROLE_KEY y no devuelve jamás un dato personal (la
--     comprobación de disponibilidad devuelve un booleano). Ver
--     src/lib/booking/actions.ts y src/lib/booking/db.ts.

--   - rate_tiers / min_stay_rules / holidays / rate_plans: lectura pública
--     (son precios y reglas de catálogo, sin nada sensible); escritura solo
--     para "authenticated".

alter table public.accommodations enable row level security;
alter table public.experiences    enable row level security;
alter table public.bookings       enable row level security;
alter table public.blocked_dates  enable row level security;
alter table public.site_content   enable row level security;
alter table public.ical_feeds     enable row level security;
alter table public.rate_tiers     enable row level security;
alter table public.min_stay_rules enable row level security;
alter table public.holidays       enable row level security;
alter table public.rate_plans     enable row level security;

-- Nota sobre las policies de SELECT: se escribe UNA sola policy permisiva por
-- rol y acción. Dos policies permisivas para el mismo par (rol, acción)
-- obligan a Postgres a evaluar ambas en cada consulta, y el linter de Supabase
-- lo reporta como "multiple_permissive_policies". La subconsulta
-- `(select auth.uid())` se evalúa una vez por consulta en lugar de una vez por
-- fila (optimización "initplan").

-- --- accommodations ---------------------------------------------------------
drop policy if exists "accommodations_select"        on public.accommodations;
drop policy if exists "accommodations_insert_admin"  on public.accommodations;
drop policy if exists "accommodations_update_admin"  on public.accommodations;
drop policy if exists "accommodations_delete_admin"  on public.accommodations;

-- Anónimo: solo lo visible. Autenticado (admin): todo.
create policy "accommodations_select" on public.accommodations
  for select to anon, authenticated
  using (visible = true or (select auth.uid()) is not null);
create policy "accommodations_insert_admin" on public.accommodations
  for insert to authenticated with check (true);
create policy "accommodations_update_admin" on public.accommodations
  for update to authenticated using (true) with check (true);
create policy "accommodations_delete_admin" on public.accommodations
  for delete to authenticated using (true);

-- --- experiences ------------------------------------------------------------
drop policy if exists "experiences_select"       on public.experiences;
drop policy if exists "experiences_insert_admin" on public.experiences;
drop policy if exists "experiences_update_admin" on public.experiences;
drop policy if exists "experiences_delete_admin" on public.experiences;

create policy "experiences_select" on public.experiences
  for select to anon, authenticated
  using (visible = true or (select auth.uid()) is not null);
create policy "experiences_insert_admin" on public.experiences
  for insert to authenticated with check (true);
create policy "experiences_update_admin" on public.experiences
  for update to authenticated using (true) with check (true);
create policy "experiences_delete_admin" on public.experiences
  for delete to authenticated using (true);

-- --- site_content -----------------------------------------------------------
-- La escritura se parte en insert/update/delete (una policy "for all" incluiría
-- SELECT y se solaparía con la de lectura pública).
drop policy if exists "site_content_select_public" on public.site_content;
drop policy if exists "site_content_insert_admin"  on public.site_content;
drop policy if exists "site_content_update_admin"  on public.site_content;
drop policy if exists "site_content_delete_admin"  on public.site_content;

create policy "site_content_select_public" on public.site_content
  for select to anon, authenticated using (true);
create policy "site_content_insert_admin" on public.site_content
  for insert to authenticated with check (true);
create policy "site_content_update_admin" on public.site_content
  for update to authenticated using (true) with check (true);
create policy "site_content_delete_admin" on public.site_content
  for delete to authenticated using (true);

-- --- bookings / blocked_dates / ical_feeds ----------------------------------
drop policy if exists "bookings_all_admin"      on public.bookings;
drop policy if exists "blocked_dates_all_admin" on public.blocked_dates;
drop policy if exists "ical_feeds_all_admin"    on public.ical_feeds;

create policy "bookings_all_admin" on public.bookings
  for all to authenticated using (true) with check (true);
create policy "blocked_dates_all_admin" on public.blocked_dates
  for all to authenticated using (true) with check (true);
create policy "ical_feeds_all_admin" on public.ical_feeds
  for all to authenticated using (true) with check (true);

-- --- tarifas: rate_tiers / min_stay_rules / holidays / rate_plans -----------
-- Mismo patrón que site_content: una policy de lectura pública y la escritura
-- partida en insert/update/delete para no solaparse con ella.
do $$
declare
  rate_table text;
begin
  foreach rate_table in array
    array['rate_tiers', 'min_stay_rules', 'holidays', 'rate_plans']
  loop
    execute format('drop policy if exists %I on public.%I',
                   rate_table || '_select_public', rate_table);
    execute format('drop policy if exists %I on public.%I',
                   rate_table || '_insert_admin', rate_table);
    execute format('drop policy if exists %I on public.%I',
                   rate_table || '_update_admin', rate_table);
    execute format('drop policy if exists %I on public.%I',
                   rate_table || '_delete_admin', rate_table);

    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      rate_table || '_select_public', rate_table);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (true)',
      rate_table || '_insert_admin', rate_table);
    execute format(
      'create policy %I on public.%I for update to authenticated using (true) with check (true)',
      rate_table || '_update_admin', rate_table);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (true)',
      rate_table || '_delete_admin', rate_table);
  end loop;
end
$$;

-- =============================================================================
-- Pendiente para fases siguientes:
--   - Distinguir roles de admin ("owner" vs "staff") si el cliente lo pide.
--   - Validación cruzada bookings <-> blocked_dates al confirmar una reserva.
--   - Endpoint público de solo lectura /api/ical/[accommodation].ics (export).
-- =============================================================================


-- =============================================================================
-- B. STORAGE — bucket "gallery" y sus policies
-- =============================================================================
-- El bucket ya fue creado por la API de Storage con esta misma configuración;
-- el INSERT queda por si se corre este archivo sobre un proyecto limpio.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery', 'gallery', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública de las fotos; escritura solo para el panel (authenticated).
drop policy if exists "gallery_select_public" on storage.objects;
drop policy if exists "gallery_insert_admin"  on storage.objects;
drop policy if exists "gallery_update_admin"  on storage.objects;
drop policy if exists "gallery_delete_admin"  on storage.objects;

create policy "gallery_select_public" on storage.objects
  for select to anon, authenticated using (bucket_id = 'gallery');
create policy "gallery_insert_admin" on storage.objects
  for insert to authenticated with check (bucket_id = 'gallery');
create policy "gallery_update_admin" on storage.objects
  for update to authenticated
  using (bucket_id = 'gallery') with check (bucket_id = 'gallery');
create policy "gallery_delete_admin" on storage.objects
  for delete to authenticated using (bucket_id = 'gallery');


-- =============================================================================
-- C. DATOS (copiados del proyecto anterior, URLs ya reescritas)
-- =============================================================================
-- Se conservan los UUID originales para que las claves foráneas y cualquier
-- enlace guardado sigan siendo válidos.

-- accommodations: 6 filas
insert into public.accommodations ("id", "slug", "name", "short_description", "description", "capacity", "price_per_night_cop", "price_note", "amenities", "gallery", "visible", "sort_order", "created_at", "updated_at", "extra_person_price_cop", "extra_person_price_weekday_cop", "breakfast_included", "breakfast_price_cop", "weekday_discount_pct", "rate_note", "short_description_en", "description_en", "amenities_en", "price_note_en", "rate_note_en")
select "id", "slug", "name", "short_description", "description", "capacity", "price_per_night_cop", "price_note", "amenities", "gallery", "visible", "sort_order", "created_at", "updated_at", "extra_person_price_cop", "extra_person_price_weekday_cop", "breakfast_included", "breakfast_price_cop", "weekday_discount_pct", "rate_note", "short_description_en", "description_en", "amenities_en", "price_note_en", "rate_note_en"
from jsonb_populate_recordset(null::public.accommodations, $maima$[{"id":"b15ae22b-92b1-4b6b-9b88-20321ce2c855","slug":"casa-maima","name":"Casa Maima","short_description":"Nuestra gran cabaña de dos pisos: cuatro espacios para dormir, dos salas, dos comedores y cocina completa. Hasta 10 personas.","description":"Nuestra gran cabaña de dos pisos, la casa más amplia de la reserva.\n\nEn el segundo piso están la habitación principal, con cama doble Queen y baño con agua caliente; una segunda habitación con cama doble; y una tercera con cama doble, camarote de dos puestos y dos camas sencillas, además de un baño completo en el hall.\n\nEn el primer nivel hay dos salas, dos comedores, un salón de TV que se convierte en habitación con dos camas sencillas —accesible para personas de baja movilidad—, un baño completo, la cocina y el bar. La cocina está dotada con cafetera, microondas, nevera, estufa y lavaplatos, herramientas para cocinar y café, azúcar, sal y jabón.\n\nEl desayuno no está incluido en la tarifa: tiene un valor de $25.000 por persona y se sirve entre las 8:00 y las 9:30 de la mañana.","capacity":10,"price_per_night_cop":1400000,"price_note":"Hasta 8 personas · 25% menos de lunes a jueves","amenities":["Habitación principal con cama doble Queen y baño con agua caliente","Segunda habitación con cama doble","Tercera habitación con cama doble, camarote de dos puestos y dos camas sencillas","Salón de TV convertible en habitación, accesible para personas de baja movilidad","Tres baños completos con agua caliente","Dos salas y dos comedores","Cocina con cafetera, microondas, nevera, estufa y lavaplatos","Herramientas para cocinar y bar","Café, azúcar, sal y jabón de cortesía","Desayuno opcional: $25.000 por persona","Pet friendly, sin costo adicional"],"gallery":[{"alt":"Fachada de Casa Maima con techo azul, terraza de piedra y jardín de plantas tropicales","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/1.jpg"},{"alt":"Sala de Casa Maima con ventanales corridos y vista abierta al Valle del Cauca","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/2.jpg"},{"alt":"Habitación principal de Casa Maima con cama doble, ventanas de madera y techo en guadua","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/3.jpg"},{"alt":"Baño de Casa Maima con lavamanos de vasija sobre mesón de madera y azulejos artesanales","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/4.jpg"},{"alt":"Cocina de Casa Maima con mesón en granito y ventanal hacia la montaña","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/5.jpg"},{"alt":"Habitación de huéspedes de Casa Maima con cama doble y obras de arte sobre muro blanco","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/6.jpg"},{"alt":"Sala de Casa Maima con mecedoras de madera y escalera de caracol","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/7.jpg"},{"alt":"Casa Maima vista desde el prado, con su base en piedra y las escaleras del jardín","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/8.jpg"},{"alt":"Habitación de Casa Maima con dos camas sencillas en L y cuadros de arte popular","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/9.jpg"},{"alt":"Rincón de lectura de Casa Maima con biblioteca de madera y techo en guadua","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/10.jpg"},{"alt":"Baño de Casa Maima con tina azul bajo techo en guadua","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/11.jpg"},{"alt":"Comedor de Casa Maima con ventanales corridos hacia el jardín","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/12.jpg"},{"alt":"Habitación principal de Casa Maima con cama de hierro forjado, mesas de noche a juego y estante con pinturas sobre la cabecera","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/13.jpg"},{"alt":"Baño de Casa Maima con ducha en azulejo bajo repisa de hierro forjado con vasijas de barro y techo en madera oscura","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/14.jpg"},{"alt":"Segunda sala de Casa Maima con sofá de cuero, mecedora de madera, alacena con piezas antiguas y tapete de cuero de vaca","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/15.jpg"},{"alt":"Tercera habitación de Casa Maima con cama doble junto a muro en piedra, tapiz artesanal y cama sencilla adicional","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/16.jpg"},{"alt":"Tercera habitación de Casa Maima con camarote de madera, estantería con cobijas y camas sencillas adicionales junto a la ventana","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/17.jpg"}],"visible":true,"sort_order":1,"created_at":"2026-08-06T19:19:37.220308+00:00","updated_at":"2026-08-31T16:08:58.510779+00:00","extra_person_price_cop":null,"extra_person_price_weekday_cop":null,"breakfast_included":false,"breakfast_price_cop":25000,"weekday_discount_pct":25,"rate_note":"El desayuno no está incluido: $25.000 por persona. Descuento del 25% de lunes a jueves no festivos, salvo del 14 de diciembre al 15 de enero.","short_description_en":"Our big two-storey house: four places to sleep, two living rooms, two dining rooms and a full kitchen. Sleeps up to 10.","description_en":"Our big two-storey house, the largest on the reserve.\n\nUpstairs you will find the main bedroom, with a queen bed and an en-suite bathroom with hot water; a second bedroom with a double bed; and a third with a double bed, a two-person bunk and two single beds, plus a full bathroom off the hall.\n\nDownstairs there are two living rooms, two dining rooms, a TV room that turns into a bedroom with two single beds — step-free and suitable for guests with limited mobility —, a full bathroom, the kitchen and the bar. The kitchen comes with a coffee maker, microwave, fridge, stove and dishwasher, cooking equipment, and coffee, sugar, salt and washing-up liquid.\n\nBreakfast is not included in the rate: it costs $25.000 COP per person and is served between 8:00 and 9:30 in the morning.","amenities_en":["Main bedroom with a queen bed and en-suite bathroom with hot water","Second bedroom with a double bed","Third bedroom with a double bed, a two-person bunk and two single beds","TV room that converts into a bedroom, step-free and suitable for limited mobility","Three full bathrooms with hot water","Two living rooms and two dining rooms","Kitchen with coffee maker, microwave, fridge, stove and dishwasher","Cooking equipment and a bar","Complimentary coffee, sugar, salt and washing-up liquid","Optional breakfast: $25.000 COP per person","Pet friendly at no extra cost"],"price_note_en":"Up to 8 guests · 25 % less Monday to Thursday","rate_note_en":"Breakfast is not included: $25.000 COP per person. A 25 % discount applies Monday to Thursday, except on public holidays and between 14 December and 15 January."},{"id":"7a570eca-e5ef-4eae-8212-7d9aa7517bab","slug":"mirador","name":"Mirador","short_description":"La cabaña más alta de la reserva: gran ventanal, terraza y hamaca sobre el bosque. Hasta 4 personas y una más en sofá cama.","description":"Nuestra cabaña más alta, con un gran ventanal y una terraza que se abren sobre el bosque: de ahí le viene el nombre.\n\nTiene una habitación con cama doble Queen y una segunda habitación con dos camas sencillas. En la zona de estar hay un sofá cama donde se puede alojar una persona adicional.\n\nLa cocineta está dotada con cafetera, microondas, nevera, estufa y lavaplatos, herramientas para cocinar y café, azúcar, sal y jabón. Se completa con comedor, hamaca y baño con agua caliente.\n\nEl desayuno está incluido en la tarifa y se sirve entre las 8:00 y las 9:30 de la mañana.","capacity":5,"price_per_night_cop":545000,"price_note":"1 persona · desayuno incluido · 25% menos de lunes a jueves","amenities":["Habitación con cama doble Queen","Segunda habitación con dos camas sencillas","Sofá cama para una persona adicional","Gran ventanal y terraza sobre el bosque","Hamaca","Cocineta con cafetera, microondas, nevera, estufa y lavaplatos","Herramientas para cocinar y comedor","Café, azúcar, sal y jabón de cortesía","Baño con agua caliente","Desayuno incluido","Pet friendly, sin costo adicional"],"gallery":[{"alt":"Cabaña Mirador con su ventanal panorámico abierto al Valle del Cauca","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/1.jpg"},{"alt":"Sala de la cabaña Mirador con ventanal de piso a techo sobre el valle","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/2.jpg"},{"alt":"Habitación de la cabaña Mirador con cama doble y ventana hacia el bosque","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/3.jpg"},{"alt":"Baño de la cabaña Mirador con lavamanos de vasija y toallas blancas","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/4.jpg"},{"alt":"Interior de la cabaña Mirador con hamaca junto a la puerta de la terraza","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/5.jpg"},{"alt":"Cocineta de la cabaña Mirador con mesón en granito y ventana a la montaña","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/6.jpg"},{"alt":"Sala de la cabaña Mirador con sofá cama y ventanas al jardín","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/7.jpg"},{"alt":"Cabaña Mirador vista de frente entre el bosque, con su terraza y palmera junto a la entrada","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/8.jpg"},{"alt":"Habitación de la cabaña Mirador con techo de guadua a dos aguas y estantería de madera","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/9.jpg"},{"alt":"Baño de la cabaña Mirador con lavamanos de vasija en la esquina, ventana pequeña y piso en baldosa","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/10.jpg"}],"visible":true,"sort_order":2,"created_at":"2026-08-06T19:19:37.220308+00:00","updated_at":"2026-08-31T16:08:58.510779+00:00","extra_person_price_cop":75000,"extra_person_price_weekday_cop":null,"breakfast_included":true,"breakfast_price_cop":null,"weekday_discount_pct":25,"rate_note":"Desayuno incluido. Una persona adicional en sofá cama: $75.000. Descuento del 25% de lunes a jueves no festivos, salvo del 14 de diciembre al 15 de enero.","short_description_en":"The highest cabin on the reserve: a wide picture window, a terrace and a hammock over the forest. Sleeps 4, plus one on the sofa bed.","description_en":"Our highest cabin, with a wide picture window and a terrace that open onto the forest — which is where the name comes from (mirador means lookout).\n\nIt has one bedroom with a queen bed and a second bedroom with two single beds. In the living area there is a sofa bed for one extra guest.\n\nThe kitchenette comes with a coffee maker, microwave, fridge, stove and dishwasher, cooking equipment, and coffee, sugar, salt and washing-up liquid. It is completed by a dining table, a hammock and a bathroom with hot water.\n\nBreakfast is included in the rate and is served between 8:00 and 9:30 in the morning.","amenities_en":["Bedroom with a queen bed","Second bedroom with two single beds","Sofa bed for one extra guest","Wide picture window and terrace over the forest","Hammock","Kitchenette with coffee maker, microwave, fridge, stove and dishwasher","Cooking equipment and dining table","Complimentary coffee, sugar, salt and washing-up liquid","Bathroom with hot water","Breakfast included","Pet friendly at no extra cost"],"price_note_en":"1 guest · breakfast included · 25 % less Monday to Thursday","rate_note_en":"Breakfast is included. One extra guest on the sofa bed costs $75.000 COP. A 25 % discount applies Monday to Thursday, except on public holidays and between 14 December and 15 January."},{"id":"0895eef1-a784-41fb-836f-1e891188f024","slug":"casa-loma","name":"Casa Loma","short_description":"Dos habitaciones y dos camas sencillas en la zona de estar, con cocineta, comedor y baño con agua caliente. Hasta 6 personas.","description":"Una casa para hasta seis personas, con una habitación de cama doble Queen, una segunda habitación con cama doble y dos camas sencillas en la zona de estar.\n\nLa cocineta está dotada con cafetera, microondas, nevera, estufa y lavaplatos, herramientas para cocinar y café, azúcar, sal y jabón para platos. Se completa con comedor y baño con agua caliente.\n\nEl desayuno está incluido en la tarifa y se sirve entre las 8:00 y las 9:30 de la mañana.","capacity":6,"price_per_night_cop":540000,"price_note":"2 personas · desayuno incluido · 25% menos de lunes a jueves","amenities":["Habitación con cama doble Queen","Segunda habitación con cama doble","Dos camas sencillas en la zona de estar","Cocineta con cafetera, microondas, nevera, estufa y lavaplatos","Herramientas para cocinar y comedor","Café, azúcar, sal y jabón de cortesía","Baño con agua caliente","Desayuno incluido","Pet friendly, sin costo adicional"],"gallery":[{"alt":"Casa Loma entre los árboles, con el sendero de piedra que llega hasta la entrada","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-loma/1.jpg"},{"alt":"Interior de Casa Loma con techo en madera, piso de barro y ventanas al jardín","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-loma/2.jpg"},{"alt":"Habitación de Casa Loma con cama doble, lámpara de noche y ventana de madera","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-loma/3.jpg"},{"alt":"Baño de Casa Loma con ducha en vidrio y lavamanos de vasija","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-loma/4.jpg"},{"alt":"Casa Loma rodeada de heliconias y vegetación de bosque andino","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-loma/5.jpg"},{"alt":"Cocineta de Casa Loma con mesón de madera y banca artesanal","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-loma/6.jpg"},{"alt":"Segunda habitación de Casa Loma con dos ventanas hacia el bosque","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-loma/7.jpg"},{"alt":"Segunda habitación de Casa Loma con dos camas sencillas y ventana al jardín","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-loma/8.jpg"},{"alt":"Habitación de Casa Loma con amplio clóset de madera artesanal y cama doble","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-loma/9.jpg"},{"alt":"Segunda habitación de Casa Loma con clóset de madera artesanal junto a la cama y ventana con cortina oscura","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-loma/10.jpg"}],"visible":true,"sort_order":3,"created_at":"2026-08-06T19:19:37.220308+00:00","updated_at":"2026-08-31T16:08:58.510779+00:00","extra_person_price_cop":75000,"extra_person_price_weekday_cop":null,"breakfast_included":true,"breakfast_price_cop":null,"weekday_discount_pct":25,"rate_note":"Desayuno incluido. Persona adicional: $75.000. Descuento del 25% de lunes a jueves no festivos, salvo del 14 de diciembre al 15 de enero.","short_description_en":"Two bedrooms plus two single beds in the living area, with a kitchenette, dining table and bathroom with hot water. Sleeps up to 6.","description_en":"A house for up to six guests, with one bedroom with a queen bed, a second bedroom with a double bed and two single beds in the living area.\n\nThe kitchenette comes with a coffee maker, microwave, fridge, stove and dishwasher, cooking equipment, and coffee, sugar, salt and washing-up liquid. It is completed by a dining table and a bathroom with hot water.\n\nBreakfast is included in the rate and is served between 8:00 and 9:30 in the morning.","amenities_en":["Bedroom with a queen bed","Second bedroom with a double bed","Two single beds in the living area","Kitchenette with coffee maker, microwave, fridge, stove and dishwasher","Cooking equipment and dining table","Complimentary coffee, sugar, salt and washing-up liquid","Bathroom with hot water","Breakfast included","Pet friendly at no extra cost"],"price_note_en":"2 guests · breakfast included · 25 % less Monday to Thursday","rate_note_en":"Breakfast is included. Each extra guest costs $75.000 COP. A 25 % discount applies Monday to Thursday, except on public holidays and between 14 December and 15 January."},{"id":"0d031a3d-8dc5-4431-825f-4c4566c4086b","name":"Casa Uba","slug":"casa-uba","gallery":[{"alt":"Casa Uba con su techo azul bajo el cielo nublado de las montañas de Dapa","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-uba/1.jpg"},{"alt":"Cocineta y comedor de Casa Uba con luz cálida al atardecer","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-uba/2.jpg"},{"alt":"Habitación de Casa Uba con cabecera tallada en madera y ventana al jardín","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-uba/3.jpg"},{"alt":"Baño de Casa Uba con doble lavamanos de vasija y puerta de madera maciza","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-uba/4.jpg"},{"alt":"Casa Uba sobre el prado, con el bosque y un árbol centenario al fondo","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-uba/5.jpg"},{"alt":"Segunda habitación de Casa Uba con muro en ladrillo a la vista","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-uba/6.jpg"},{"alt":"Comedor de Casa Uba con mesa de madera junto a los ventanales del techo en guadua","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-uba/7.jpg"},{"alt":"Baño de Casa Uba con ducha en obra, repisa de hierro forjado artesanal y lavamanos de vasija al fondo","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-uba/8.jpg"}],"visible":false,"capacity":4,"amenities":["Cocineta equipada","Baño privado","Agua caliente","Balcón con vista a la montaña","Parqueadero","Ropa de cama y toallas","Acceso a senderos de la reserva"],"rate_note":null,"created_at":"2026-08-06T19:19:37.220308+00:00","price_note":"Tarifa por confirmar","sort_order":4,"updated_at":"2026-09-01T16:42:19.522837+00:00","description":"Casa Uba se apoya en la pendiente y se abre hacia afuera con un balcón corrido que recorre toda su fachada. Es el lugar donde el desayuno se demora, porque la niebla sube por la ladera y hay que quedarse a verla. Acoge hasta cuatro personas y conserva el espíritu de la casa de campo del Valle: paredes blancas, madera oscura y nada de ruido. Cocineta equipada, baño privado y agua caliente.","amenities_en":["Fitted kitchenette","Private bathroom","Hot water","Balcony with mountain views","Parking","Bed linen and towels","Access to the reserve trails"],"rate_note_en":null,"price_note_en":"Rate to be confirmed","description_en":"Casa Uba leans into the slope and opens outwards along a balcony that runs the full width of the house. It is the place where breakfast takes its time, because the mist climbs the hillside and you have to stay and watch it. It sleeps up to four and keeps the spirit of an old Valle del Cauca farmhouse: white walls, dark timber and no noise at all. Fitted kitchenette, private bathroom and hot water.","short_description":"Balcón corrido sobre la ladera: la casa para quienes quieren desayunar mirando la montaña.","breakfast_included":false,"breakfast_price_cop":null,"price_per_night_cop":450000,"short_description_en":"A long balcony over the hillside: the house for anyone who wants to have breakfast looking at the mountain.","weekday_discount_pct":null,"extra_person_price_cop":null,"extra_person_price_weekday_cop":null},{"id":"36dcd759-2ef5-4769-8940-727c1f9b0166","slug":"dos-casitas","name":"Dos Casitas","short_description":"Dos cabañas unidas por un corredor-balcón, entre un jardín y un pequeño bosque de guadua. Hasta 4 personas.","description":"Dos cabañas unidas por un corredor-balcón, rodeadas de un jardín y de un pequeño bosque de guadua.\n\nCada una tiene su habitación con cama doble Queen y dos camas sencillas en la zona de estar. La cocineta está dotada con cafetera, microondas, nevera, estufa y lavaplatos, herramientas para cocinar y café, azúcar, sal y jabón, y cada cabaña cuenta con baño con agua caliente.\n\nEl desayuno está incluido en la tarifa y se sirve entre las 8:00 y las 9:30 de la mañana.","capacity":4,"price_per_night_cop":495000,"price_note":"2 personas · desayuno incluido · 25% menos de lunes a jueves","amenities":["Dos cabañas unidas por un corredor-balcón","Habitación con cama doble Queen en cada cabaña","Dos camas sencillas en la zona de estar de cada cabaña","Jardín y pequeño bosque de guadua alrededor","Cocineta con cafetera, microondas, nevera, estufa y lavaplatos","Herramientas para cocinar","Café, azúcar, sal y jabón de cortesía","Baño con agua caliente","Desayuno incluido","Pet friendly, sin costo adicional"],"gallery":[{"alt":"Terraza cubierta de Dos Casitas con mesas de comedor y la entrada a los alojamientos","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/dos-casitas/1.jpg"},{"alt":"Interior de Dos Casitas con camas, cocineta y puertas abiertas a la terraza","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/dos-casitas/2.jpg"},{"alt":"Habitación de Dos Casitas con cama doble y ventana alargada hacia el bosque","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/dos-casitas/3.jpg"},{"alt":"Baño de Dos Casitas con lavamanos de vasija y azulejos artesanales","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/dos-casitas/4.jpg"},{"alt":"Zona de estar de Dos Casitas con salida directa a la terraza","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/dos-casitas/5.jpg"},{"alt":"Segunda habitación de Dos Casitas con clóset de madera","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/dos-casitas/6.jpg"},{"alt":"Cocineta de Dos Casitas con ventanal hacia los árboles","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/dos-casitas/7.jpg"},{"alt":"Baño de Dos Casitas con ducha, sanitario y lavamanos de vasija en granito","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/dos-casitas/8.jpg"}],"visible":true,"sort_order":5,"created_at":"2026-08-06T19:19:37.220308+00:00","updated_at":"2026-08-31T16:08:58.510779+00:00","extra_person_price_cop":75000,"extra_person_price_weekday_cop":null,"breakfast_included":true,"breakfast_price_cop":null,"weekday_discount_pct":25,"rate_note":"Desayuno incluido. Persona adicional: $75.000. Descuento del 25% de lunes a jueves no festivos, salvo del 14 de diciembre al 15 de enero.","short_description_en":"Two cabins joined by a balcony walkway, between a garden and a small stand of guadua bamboo. Sleeps up to 4.","description_en":"Two cabins joined by a balcony walkway, surrounded by a garden and a small stand of guadua — the native bamboo of the region.\n\nEach one has its own bedroom with a queen bed and two single beds in the living area. The kitchenette comes with a coffee maker, microwave, fridge, stove and dishwasher, cooking equipment, and coffee, sugar, salt and washing-up liquid, and each cabin has its own bathroom with hot water.\n\nBreakfast is included in the rate and is served between 8:00 and 9:30 in the morning.","amenities_en":["Two cabins joined by a balcony walkway","A bedroom with a queen bed in each cabin","Two single beds in the living area of each cabin","Garden and a small stand of guadua bamboo around them","Kitchenette with coffee maker, microwave, fridge, stove and dishwasher","Cooking equipment","Complimentary coffee, sugar, salt and washing-up liquid","Bathroom with hot water","Breakfast included","Pet friendly at no extra cost"],"price_note_en":"2 guests · breakfast included · 25 % less Monday to Thursday","rate_note_en":"Breakfast is included. Each extra guest costs $75.000 COP. A 25 % discount applies Monday to Thursday, except on public holidays and between 14 December and 15 January."},{"id":"d5ca9c13-a378-40d1-865c-530ae1616748","slug":"tres-casitas","name":"Tres Casitas","short_description":"Cabaña de un solo espacio con cama doble Queen, cama sencilla y una mesa en la terraza. Hasta 3 personas.","description":"Una cabaña de un solo espacio, con cama doble Queen y una cama sencilla.\n\nLa cocineta está dotada con cafetera, microondas, nevera, estufa y lavaplatos, herramientas para cocinar y café, azúcar, sal y jabón. Se completa con baño con agua caliente y una mesa en la terraza.\n\nEs la única cabaña con tarifas propias de lunes a jueves: los días no festivos la estadía cuesta bastante menos que en fin de semana.","capacity":3,"price_per_night_cop":290000,"price_note":"1 persona, de lunes a jueves · $390.000 en fin de semana","amenities":["Cama doble Queen y una cama sencilla en un solo espacio","Mesa en la terraza","Cocineta con cafetera, microondas, nevera, estufa y lavaplatos","Herramientas para cocinar","Café, azúcar, sal y jabón de cortesía","Baño con agua caliente","Tarifa reducida de lunes a jueves no festivos","Pet friendly, sin costo adicional"],"gallery":[{"alt":"Tres Casitas con su pérgola de madera y techo azul entre la vegetación","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/tres-casitas/1.jpg"},{"alt":"Corredor cubierto de Tres Casitas con baranda de madera sobre el bosque","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/tres-casitas/2.jpg"},{"alt":"Habitación de Tres Casitas con cama doble y ventana hacia la montaña","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/tres-casitas/3.jpg"},{"alt":"Baño de Tres Casitas con ducha en vidrio y lavamanos de vasija","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/tres-casitas/4.jpg"},{"alt":"Segunda habitación de Tres Casitas con dos camas y ventanal al jardín","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/tres-casitas/5.jpg"},{"alt":"Cocina de Tres Casitas con mesón en azulejo artesanal y ventana al bosque","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/tres-casitas/6.jpg"},{"alt":"Habitación de Tres Casitas con cama sencilla, cocineta al fondo y ventana con vista al jardín","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/tres-casitas/7.jpg"},{"alt":"Detalle del baño de Tres Casitas con lavamanos de vasija y toallas blancas","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/tres-casitas/8.jpg"}],"visible":true,"sort_order":6,"created_at":"2026-08-06T19:19:37.220308+00:00","updated_at":"2026-08-31T16:08:58.510779+00:00","extra_person_price_cop":75000,"extra_person_price_weekday_cop":55000,"breakfast_included":false,"breakfast_price_cop":null,"weekday_discount_pct":null,"rate_note":"Tarifas propias de lunes a jueves (no festivos) y de fin de semana. Persona adicional: $75.000 en fin de semana, $55.000 de lunes a jueves.","short_description_en":"A single-room cabin with a queen bed, a single bed and a table out on the terrace. Sleeps up to 3.","description_en":"A single-room cabin, with a queen bed and one single bed.\n\nThe kitchenette comes with a coffee maker, microwave, fridge, stove and dishwasher, cooking equipment, and coffee, sugar, salt and washing-up liquid. It is completed by a bathroom with hot water and a table out on the terrace.\n\nIt is the only cabin with its own Monday-to-Thursday rate: on non-holiday weekdays a stay here costs considerably less than at the weekend.","amenities_en":["Queen bed and one single bed in a single room","Table on the terrace","Kitchenette with coffee maker, microwave, fridge, stove and dishwasher","Cooking equipment","Complimentary coffee, sugar, salt and washing-up liquid","Bathroom with hot water","Reduced rate Monday to Thursday, excluding public holidays","Pet friendly at no extra cost"],"price_note_en":"1 guest, Monday to Thursday · $390.000 at the weekend","rate_note_en":"Separate rates for Monday to Thursday (excluding public holidays) and for the weekend. Each extra guest costs $75.000 COP at the weekend and $55.000 COP Monday to Thursday."}]$maima$::jsonb)
on conflict (id) do nothing;

-- rate_tiers: 18 filas
insert into public.rate_tiers ("id", "accommodation_id", "guests", "price_cop", "day_type", "sort", "created_at", "updated_at")
select "id", "accommodation_id", "guests", "price_cop", "day_type", "sort", "created_at", "updated_at"
from jsonb_populate_recordset(null::public.rate_tiers, $maima$[{"id":"1735f461-2e7f-44e5-8e1a-7d641fa31d2f","accommodation_id":"b15ae22b-92b1-4b6b-9b88-20321ce2c855","guests":10,"price_cop":1700000,"day_type":"any","sort":2,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-26T21:22:26.435395+00:00"},{"id":"d9cffa56-a4f5-4183-929c-6d6c32338008","accommodation_id":"b15ae22b-92b1-4b6b-9b88-20321ce2c855","guests":8,"price_cop":1400000,"day_type":"any","sort":1,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-26T21:22:26.435395+00:00"},{"id":"5fe8e3b6-6c56-4dc6-8356-0c727910a401","accommodation_id":"0895eef1-a784-41fb-836f-1e891188f024","guests":6,"price_cop":720000,"day_type":"any","sort":5,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-26T21:22:26.435395+00:00"},{"id":"d90a0993-b335-4aed-8024-1e19f267c691","accommodation_id":"0895eef1-a784-41fb-836f-1e891188f024","guests":5,"price_cop":665000,"day_type":"any","sort":4,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-26T21:22:26.435395+00:00"},{"id":"a6e590cd-a60d-4aa1-8ecb-e947ae17e728","accommodation_id":"0895eef1-a784-41fb-836f-1e891188f024","guests":4,"price_cop":615000,"day_type":"any","sort":3,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-26T21:22:26.435395+00:00"},{"id":"037b7bf0-e94a-443f-bdef-b5cb65db5d81","accommodation_id":"0895eef1-a784-41fb-836f-1e891188f024","guests":3,"price_cop":590000,"day_type":"any","sort":2,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-26T21:22:26.435395+00:00"},{"id":"0cf90181-226e-4ad7-97f0-18f97d1a9427","accommodation_id":"0895eef1-a784-41fb-836f-1e891188f024","guests":2,"price_cop":540000,"day_type":"any","sort":1,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-26T21:22:26.435395+00:00"},{"id":"f884b07f-ba09-41fe-8a70-6ffa4d14bac1","accommodation_id":"36dcd759-2ef5-4769-8940-727c1f9b0166","guests":4,"price_cop":570000,"day_type":"any","sort":3,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-26T21:22:26.435395+00:00"},{"id":"db5f151a-c758-45b8-8414-dd7b83b29405","accommodation_id":"36dcd759-2ef5-4769-8940-727c1f9b0166","guests":3,"price_cop":545000,"day_type":"any","sort":2,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-26T21:22:26.435395+00:00"},{"id":"82bd0040-aee8-40ad-817d-e284e814b1d2","accommodation_id":"36dcd759-2ef5-4769-8940-727c1f9b0166","guests":2,"price_cop":495000,"day_type":"any","sort":1,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-26T21:22:26.435395+00:00"},{"id":"703f9995-8924-4294-8738-2fd9e846a2fc","accommodation_id":"d5ca9c13-a378-40d1-865c-530ae1616748","guests":2,"price_cop":310000,"day_type":"weekday","sort":2,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-26T21:22:26.435395+00:00"},{"id":"a7d270cf-0c87-4f12-a173-98f8fcd0c228","accommodation_id":"d5ca9c13-a378-40d1-865c-530ae1616748","guests":1,"price_cop":290000,"day_type":"weekday","sort":1,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-26T21:22:26.435395+00:00"},{"id":"ee2ee739-a7e4-4547-9673-1aba63eccaf6","accommodation_id":"d5ca9c13-a378-40d1-865c-530ae1616748","guests":2,"price_cop":415000,"day_type":"weekend","sort":2,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-26T21:22:26.435395+00:00"},{"id":"d2c37038-ef6a-4c17-a357-df196423bb2b","accommodation_id":"d5ca9c13-a378-40d1-865c-530ae1616748","guests":1,"price_cop":390000,"day_type":"weekend","sort":1,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-26T21:22:26.435395+00:00"},{"id":"7c64885e-9cfd-49a9-ac59-c95c8701ef14","accommodation_id":"7a570eca-e5ef-4eae-8212-7d9aa7517bab","guests":1,"price_cop":545000,"day_type":"any","sort":0,"created_at":"2026-08-29T17:18:51.918217+00:00","updated_at":"2026-08-29T17:18:51.918217+00:00"},{"id":"1bff60d4-5203-4bc3-b990-083c10d51065","accommodation_id":"7a570eca-e5ef-4eae-8212-7d9aa7517bab","guests":2,"price_cop":570000,"day_type":"any","sort":1,"created_at":"2026-08-29T17:18:51.918217+00:00","updated_at":"2026-08-29T17:18:51.918217+00:00"},{"id":"58a8663a-6dd5-4101-8c77-9bd12218a24c","accommodation_id":"7a570eca-e5ef-4eae-8212-7d9aa7517bab","guests":3,"price_cop":620000,"day_type":"any","sort":2,"created_at":"2026-08-29T17:18:51.918217+00:00","updated_at":"2026-08-29T17:18:51.918217+00:00"},{"id":"c0136af0-af43-43be-88ac-6f2fc1518f44","accommodation_id":"7a570eca-e5ef-4eae-8212-7d9aa7517bab","guests":4,"price_cop":645000,"day_type":"any","sort":3,"created_at":"2026-08-29T17:18:51.918217+00:00","updated_at":"2026-08-29T17:18:51.918217+00:00"}]$maima$::jsonb)
on conflict (id) do nothing;

-- min_stay_rules: 25 filas
insert into public.min_stay_rules ("id", "accommodation_id", "label", "rule_type", "date_from", "date_to", "min_nights", "sort", "created_at", "updated_at", "label_en")
select "id", "accommodation_id", "label", "rule_type", "date_from", "date_to", "min_nights", "sort", "created_at", "updated_at", "label_en"
from jsonb_populate_recordset(null::public.min_stay_rules, $maima$[{"id":"baf4cb40-8432-48ed-aa5c-b8e1dbe76587","accommodation_id":"b15ae22b-92b1-4b6b-9b88-20321ce2c855","label":"Puentes festivos","rule_type":"holiday_bridge","date_from":null,"date_to":null,"min_nights":2,"sort":1,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"Long holiday weekends"},{"id":"daa067a5-7315-48eb-a560-8daf7bf2bed1","accommodation_id":"7a570eca-e5ef-4eae-8212-7d9aa7517bab","label":"Puentes festivos","rule_type":"holiday_bridge","date_from":null,"date_to":null,"min_nights":2,"sort":1,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"Long holiday weekends"},{"id":"d9fbebf9-0d69-40c3-8a52-c70cb5125f8f","accommodation_id":"0895eef1-a784-41fb-836f-1e891188f024","label":"Puentes festivos","rule_type":"holiday_bridge","date_from":null,"date_to":null,"min_nights":2,"sort":1,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"Long holiday weekends"},{"id":"397b1a78-1708-4885-8b52-8042770bc393","accommodation_id":"36dcd759-2ef5-4769-8940-727c1f9b0166","label":"Puentes festivos","rule_type":"holiday_bridge","date_from":null,"date_to":null,"min_nights":2,"sort":1,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"Long holiday weekends"},{"id":"e2c4254a-1b21-485b-b85a-2fef8f34bf32","accommodation_id":"d5ca9c13-a378-40d1-865c-530ae1616748","label":"Puentes festivos","rule_type":"holiday_bridge","date_from":null,"date_to":null,"min_nights":2,"sort":1,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"Long holiday weekends"},{"id":"25ac6e9c-4a30-43b3-94a9-d8a8002aa544","accommodation_id":"b15ae22b-92b1-4b6b-9b88-20321ce2c855","label":"Semana Santa 2027","rule_type":"date_range","date_from":"2027-03-21","date_to":"2027-03-28","min_nights":2,"sort":2,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"Easter Week 2027"},{"id":"abe70d57-4107-4328-ace6-1963150fba18","accommodation_id":"7a570eca-e5ef-4eae-8212-7d9aa7517bab","label":"Semana Santa 2027","rule_type":"date_range","date_from":"2027-03-21","date_to":"2027-03-28","min_nights":3,"sort":2,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"Easter Week 2027"},{"id":"4a6298ff-fb5c-40ba-8ae9-decaa7e23b62","accommodation_id":"0895eef1-a784-41fb-836f-1e891188f024","label":"Semana Santa 2027","rule_type":"date_range","date_from":"2027-03-21","date_to":"2027-03-28","min_nights":3,"sort":2,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"Easter Week 2027"},{"id":"2aa8b90d-daa4-4dd9-818a-e1c57f072be1","accommodation_id":"36dcd759-2ef5-4769-8940-727c1f9b0166","label":"Semana Santa 2027","rule_type":"date_range","date_from":"2027-03-21","date_to":"2027-03-28","min_nights":3,"sort":2,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"Easter Week 2027"},{"id":"aa356dfc-c533-4cb4-a721-e1d0257aedaa","accommodation_id":"d5ca9c13-a378-40d1-865c-530ae1616748","label":"Semana Santa 2027","rule_type":"date_range","date_from":"2027-03-21","date_to":"2027-03-28","min_nights":3,"sort":2,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"Easter Week 2027"},{"id":"be4ac2a4-c322-4b23-9004-f1a382e4043c","accommodation_id":"b15ae22b-92b1-4b6b-9b88-20321ce2c855","label":"Semana Santa 2028","rule_type":"date_range","date_from":"2028-04-09","date_to":"2028-04-16","min_nights":2,"sort":3,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"Easter Week 2028"},{"id":"79a6bfdb-dda4-4c26-bb9f-b96f9e5dfa51","accommodation_id":"7a570eca-e5ef-4eae-8212-7d9aa7517bab","label":"Semana Santa 2028","rule_type":"date_range","date_from":"2028-04-09","date_to":"2028-04-16","min_nights":3,"sort":3,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"Easter Week 2028"},{"id":"8d120c86-dc1d-4bde-848b-a835a503e2b1","accommodation_id":"0895eef1-a784-41fb-836f-1e891188f024","label":"Semana Santa 2028","rule_type":"date_range","date_from":"2028-04-09","date_to":"2028-04-16","min_nights":3,"sort":3,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"Easter Week 2028"},{"id":"cd9b98c8-9623-4578-922f-461c63746b75","accommodation_id":"36dcd759-2ef5-4769-8940-727c1f9b0166","label":"Semana Santa 2028","rule_type":"date_range","date_from":"2028-04-09","date_to":"2028-04-16","min_nights":3,"sort":3,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"Easter Week 2028"},{"id":"aae2dba4-1620-4333-ba21-6938a9152cc8","accommodation_id":"d5ca9c13-a378-40d1-865c-530ae1616748","label":"Semana Santa 2028","rule_type":"date_range","date_from":"2028-04-09","date_to":"2028-04-16","min_nights":3,"sort":3,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"Easter Week 2028"},{"id":"facb97fa-48ab-4c20-a8a1-0d6988bd1498","accommodation_id":"b15ae22b-92b1-4b6b-9b88-20321ce2c855","label":"Temporada 23 dic – 7 ene 2026/27","rule_type":"date_range","date_from":"2026-12-23","date_to":"2027-01-07","min_nights":3,"sort":4,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"High season, 23 Dec – 7 Jan 2026/27"},{"id":"01eb6649-4bff-4b11-b418-db590e392f0c","accommodation_id":"7a570eca-e5ef-4eae-8212-7d9aa7517bab","label":"Temporada 23 dic – 7 ene 2026/27","rule_type":"date_range","date_from":"2026-12-23","date_to":"2027-01-07","min_nights":4,"sort":4,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"High season, 23 Dec – 7 Jan 2026/27"},{"id":"427795b0-dff6-4183-8944-318a19dec33f","accommodation_id":"0895eef1-a784-41fb-836f-1e891188f024","label":"Temporada 23 dic – 7 ene 2026/27","rule_type":"date_range","date_from":"2026-12-23","date_to":"2027-01-07","min_nights":3,"sort":4,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"High season, 23 Dec – 7 Jan 2026/27"},{"id":"761b75dc-4f25-4597-87d9-fd9747731035","accommodation_id":"36dcd759-2ef5-4769-8940-727c1f9b0166","label":"Temporada 23 dic – 7 ene 2026/27","rule_type":"date_range","date_from":"2026-12-23","date_to":"2027-01-07","min_nights":3,"sort":4,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"High season, 23 Dec – 7 Jan 2026/27"},{"id":"a9b87e3c-8c97-4fcc-bf9e-720022e26aad","accommodation_id":"d5ca9c13-a378-40d1-865c-530ae1616748","label":"Temporada 23 dic – 7 ene 2026/27","rule_type":"date_range","date_from":"2026-12-23","date_to":"2027-01-07","min_nights":3,"sort":4,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"High season, 23 Dec – 7 Jan 2026/27"},{"id":"c2e3163a-c86f-455f-ba11-bd35c76a9fd0","accommodation_id":"b15ae22b-92b1-4b6b-9b88-20321ce2c855","label":"Temporada 23 dic – 7 ene 2027/28","rule_type":"date_range","date_from":"2027-12-23","date_to":"2028-01-07","min_nights":3,"sort":5,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"High season, 23 Dec – 7 Jan 2027/28"},{"id":"7f0b994a-073e-4025-814b-ebe7025176d0","accommodation_id":"7a570eca-e5ef-4eae-8212-7d9aa7517bab","label":"Temporada 23 dic – 7 ene 2027/28","rule_type":"date_range","date_from":"2027-12-23","date_to":"2028-01-07","min_nights":4,"sort":5,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"High season, 23 Dec – 7 Jan 2027/28"},{"id":"361c0bbb-1c86-476c-8782-877bfb69e9fc","accommodation_id":"0895eef1-a784-41fb-836f-1e891188f024","label":"Temporada 23 dic – 7 ene 2027/28","rule_type":"date_range","date_from":"2027-12-23","date_to":"2028-01-07","min_nights":3,"sort":5,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"High season, 23 Dec – 7 Jan 2027/28"},{"id":"58bd6679-fad1-44d7-b637-35e3db21fa5d","accommodation_id":"36dcd759-2ef5-4769-8940-727c1f9b0166","label":"Temporada 23 dic – 7 ene 2027/28","rule_type":"date_range","date_from":"2027-12-23","date_to":"2028-01-07","min_nights":3,"sort":5,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"High season, 23 Dec – 7 Jan 2027/28"},{"id":"ca6ed202-afe8-4f22-a26a-ed419a6b77d1","accommodation_id":"d5ca9c13-a378-40d1-865c-530ae1616748","label":"Temporada 23 dic – 7 ene 2027/28","rule_type":"date_range","date_from":"2027-12-23","date_to":"2028-01-07","min_nights":3,"sort":5,"created_at":"2026-08-26T21:22:26.435395+00:00","updated_at":"2026-08-31T16:09:26.853595+00:00","label_en":"High season, 23 Dec – 7 Jan 2027/28"}]$maima$::jsonb)
on conflict (id) do nothing;

-- experiences: 8 filas
insert into public.experiences ("id", "slug", "name", "short_description", "description", "duration", "capacity", "price_cop", "price_note", "gallery", "visible", "sort_order", "created_at", "updated_at", "name_en", "short_description_en", "description_en", "duration_en", "price_note_en")
select "id", "slug", "name", "short_description", "description", "duration", "capacity", "price_cop", "price_note", "gallery", "visible", "sort_order", "created_at", "updated_at", "name_en", "short_description_en", "description_en", "duration_en", "price_note_en"
from jsonb_populate_recordset(null::public.experiences, $maima$[{"id":"113a82ac-81d2-4a87-be01-d6b87d26911d","slug":"pasadia","name":"Pasadía","short_description":"Un día completo en la reserva: almuerzo, yoga, sendero al río, fuentes de agua y fogata.","description":"Disponible los domingos y festivos, de 10:00 a. m. a 6:00 p. m. Incluye almuerzo y acceso a todas las actividades y experiencias de la reserva: clase de yoga, sendero al río, ingreso a las fuentes de agua —la pileta natural y la chorrera— y permanencia hasta la fogata. También el uso de las duchas del salón de yoga y de la zona del restaurante. No incluye el ingreso ni el uso de las cabañas.","duration":"10:00 a. m. a 6:00 p. m., domingos y festivos","capacity":null,"price_cop":110000,"price_note":"$110.000 por persona","gallery":[{"alt":"Zona común de La Maima: pradera abierta entre árboles grandes, con el restaurante y las terrazas al fondo","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/pasadia/1.jpg"}],"visible":true,"sort_order":2,"created_at":"2026-08-31T15:32:06.036545+00:00","updated_at":"2026-08-31T17:20:41.323001+00:00","name_en":"Day pass","short_description_en":"A full day at the reserve: lunch, yoga, the trail down to the river, the water features and the fire pit.","description_en":"Available on Sundays and public holidays, from 10:00 a.m. to 6:00 p.m. It includes lunch and access to every activity on the reserve: the yoga class, the trail down to the river, the water features — the natural pool and the little waterfall — and staying on until the fire pit is lit. It also covers the use of the showers by the yoga room and the restaurant area. It does not include entry to, or use of, the cabins.","duration_en":"10:00 a.m. to 6:00 p.m., Sundays and public holidays","price_note_en":"$110.000 COP per person"},{"id":"0a703616-ab92-4dd9-bad8-edc436f52a58","slug":"piscina-de-rio","name":"Piscina de río","short_description":"Un pozo natural de agua fría y transparente, formado por la quebrada que cruza la reserva.","description":"La quebrada que baja de la montaña atraviesa la reserva y en un punto se abre entre piedras grandes formando un pozo natural. El agua es fría, clara y corre todo el año. Alrededor hay piedra plana para tenderse al sol y sombra de bosque cuando aprieta el mediodía. Está a pocos minutos a pie desde los alojamientos, por sendero señalizado. Recomendamos calzado con agarre y bajar acompañado.","duration":"Libre durante el día","capacity":null,"price_cop":null,"price_note":"Incluida en la estadía","gallery":[{"alt":"Quebrada de aguas claras entre piedras, en medio del bosque de la reserva","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/piscina-de-rio/1.jpg"}],"visible":true,"sort_order":7,"created_at":"2026-08-06T19:19:59.800803+00:00","updated_at":"2026-08-31T17:20:41.598217+00:00","name_en":"River pool","short_description_en":"A natural pool of cold, clear water formed by the stream that crosses the reserve.","description_en":"The stream that comes down the mountain crosses the reserve and, at one point, opens out among large rocks to form a natural pool. The water is cold, clear and runs all year round. There is flat rock around it to stretch out in the sun, and forest shade for when the midday heat sets in. It is a few minutes' walk from the houses along a signposted path. We recommend shoes with good grip, and going down with company.","duration_en":"Open throughout the day","price_note_en":"Included in your stay"},{"id":"372448e3-fc80-4ee0-9c05-aa07fe838404","slug":"senderos-por-la-reserva","name":"Senderos por la reserva","short_description":"Unos 45 minutos de bosque hasta un arroyo del río Arroyohondo, para bañarse entre grandes rocas.","description":"Sendero por el bosque de aproximadamente 45 minutos que llega a un arroyo del río Arroyohondo, donde las personas pueden bañarse en el río natural entre grandes rocas. Más que una caminata, es una invitación a disfrutar y contemplar el bosque que rodea el camino: el viento, las hojas, la tierra, las mariposas y la vida natural del lugar. El sendero está construido en escalones delimitados por la guadua del bosque. La dificultad es moderada y requiere buen calzado; no es recomendable para personas con movilidad reducida.","duration":"Unos 45 minutos hasta el río","capacity":null,"price_cop":null,"price_note":"Incluida en la estadía","gallery":[{"alt":"Escalones de piedra y madera que suben por el jardín tropical de la reserva","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/senderos-por-la-reserva/1.jpg"}],"visible":true,"sort_order":3,"created_at":"2026-08-06T19:19:59.800803+00:00","updated_at":"2026-08-31T17:20:41.421127+00:00","name_en":"Trails through the reserve","short_description_en":"About 45 minutes of forest down to a branch of the Arroyohondo river, to bathe among the big boulders.","description_en":"A forest trail of roughly 45 minutes that reaches a branch of the Arroyohondo river, where you can bathe in the natural stream among the big boulders. More than a hike, it is an invitation to take in the forest along the way: the wind, the leaves, the earth, the butterflies and the life of the place. The path is built as steps edged with guadua bamboo cut from the forest itself. The difficulty is moderate and good footwear is essential; it is not recommended for guests with reduced mobility.","duration_en":"About 45 minutes down to the river","price_note_en":"Included in your stay"},{"id":"f1e36973-09e2-49ca-856e-c5b1735c61fd","slug":"gastronomia","name":"Cocina casera de campo","short_description":"Comida como en casa: sencilla, abundante y preparada fresca cada día con productos del campo.","description":"Cocina casera de campo, preparada fresca cada día. En La Maima la comida es como en casa: sencilla, abundante y hecha con productos frescos. No manejamos pedidos a la carta —cada día preparamos un plato pensado para todos, aunque tenemos estandarizados cuatro platos— y los domingos y festivos nuestro clásico es el sancocho. Los almuerzos están disponibles los fines de semana, y entre semana para grupos de más de 6 personas. El desayuno está incluido en la estadía en todas las cabañas salvo Casa Maima: es un desayuno servido a la mesa, que inicia con fruta de temporada y jugo de naranja, y sigue con huevos al gusto, pan y arepa, café o chocolate, mantequilla, mermelada y queso cuajada. Si tienes alguna restricción alimentaria o alergia, cuéntanos al reservar y hacemos lo posible por acomodarla.","duration":"Desayuno de 8:00 a 9:30 a. m.","capacity":null,"price_cop":null,"price_note":"Desayuno incluido","gallery":[{"alt":"Comedor de La Maima bajo la pérgola al atardecer, con mesas de mosaico y sillas de madera","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/gastronomia/1.jpg"},{"alt":"Zona del restaurante de La Maima con luces cálidas colgantes y vista al bosque","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/gastronomia/2.jpg"}],"visible":true,"sort_order":1,"created_at":"2026-08-31T15:32:06.036545+00:00","updated_at":"2026-08-31T17:20:41.255661+00:00","name_en":"Farm-style home cooking","short_description_en":"Food like you would eat at home: simple, generous and cooked fresh every day with produce from the countryside.","description_en":"Farm-style home cooking, prepared fresh every day. At La Maima the food is the food of a family home: simple, generous and made with fresh produce. There is no à la carte menu — each day we cook one dish for everyone, although we keep four standard dishes in rotation — and on Sundays and public holidays our classic is sancocho, the slow-cooked Colombian chicken and plantain soup. Lunches are available at weekends and, midweek, for groups of more than six. Breakfast is included in every cabin except Casa Maima: it is served at the table, starting with seasonal fruit and orange juice and going on to eggs cooked to your liking, bread and arepa (a griddled corn cake), coffee or hot chocolate, butter, jam and fresh cuajada cheese. If you have any dietary restriction or allergy, tell us when you book and we will do our best to accommodate it.","duration_en":"Breakfast from 8:00 to 9:30 a.m.","price_note_en":"Breakfast included"},{"id":"27ca7fc4-e5ee-4206-8187-e6d7f5730695","slug":"pileta-natural-y-chorrera","name":"Pileta natural y chorrera","short_description":"Dos espacios de agua fría en las zonas comunes, para meditar, compartir o darse un chapuzón.","description":"Ubicadas en las zonas comunes principales, la pileta y la chorrera son dos espacios de agua separados entre sí. Ideales para meditar en el agua fría, disfrutar con amigos y un trago, o simplemente darse un chapuzón.","duration":"Libre durante el día","capacity":null,"price_cop":null,"price_note":"Incluida en la estadía","gallery":[{"alt":"Pileta natural de piedra con la chorrera cayendo al espejo de agua, en las zonas comunes de La Maima","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/pileta-natural-y-chorrera/1.jpg"},{"alt":"Vista abierta de la pileta natural rodeada de pradera y árboles altos","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/pileta-natural-y-chorrera/2.jpg"}],"visible":true,"sort_order":6,"created_at":"2026-08-31T15:32:06.036545+00:00","updated_at":"2026-08-31T17:20:41.68744+00:00","name_en":"Natural pool and waterfall","short_description_en":"Two cold-water spots in the common areas, for meditating, sharing a drink or simply taking a dip.","description_en":"Set in the main common areas, the pool and the little waterfall are two separate bodies of water. Perfect for meditating in the cold water, enjoying it with friends and a drink, or simply taking a dip.","duration_en":"Open throughout the day","price_note_en":"Included in your stay"},{"id":"78dcecbb-5a2b-4b62-8ff5-74c392b63858","slug":"avistamiento-de-flora-y-fauna","name":"Avistamiento de flora y fauna","short_description":"Treinta años de rehabilitación han traído de vuelta aves, orquídeas y mamíferos del bosque andino.","description":"La Maima empezó como un proyecto de recuperación hace treinta años, y el resultado se ve a simple vista: hoy la reserva alberga tucanes, pavas, colibríes de varias especies, guatines y una comunidad creciente de orquídeas, bromelias y helechos arbóreos. Las primeras horas de la mañana son las mejores para el avistamiento, sobre todo en los bordes de bosque y cerca del agua. Traiga binóculos; nosotros le indicamos dónde buscar.","duration":"Mejor entre 6:00 y 9:00 a. m.","capacity":null,"price_cop":null,"price_note":"Incluida en la estadía","gallery":[{"alt":"Tucán esmeralda posado en una rama del bosque de La Maima","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/avistamiento-de-flora-y-fauna/1.jpg"}],"visible":true,"sort_order":8,"created_at":"2026-08-06T19:19:59.800803+00:00","updated_at":"2026-08-31T17:20:41.792587+00:00","name_en":"Birdwatching and wildlife","short_description_en":"Thirty years of restoration have brought back the birds, orchids and mammals of the Andean forest.","description_en":"La Maima started out as a restoration project thirty years ago, and the result is plain to see: the reserve is now home to toucans, guans, several species of hummingbird, agoutis and a growing community of orchids, bromeliads and tree ferns. The first hours of the morning are the best for spotting them, especially along the forest edges and near the water. Bring binoculars; we will show you where to look.","duration_en":"Best between 6:00 and 9:00 a.m.","price_note_en":"Included in your stay"},{"id":"d87e6399-008f-4356-8100-726d21cfad1d","slug":"fogata","name":"Fogata","short_description":"Leña, cielo despejado y el frío de la montaña: el cierre natural del día en Dapa.","description":"Se enciende en las noches, alrededor de las 6:00 – 7:00 p. m.: un espacio para reunirse y compartir al final del día, y La Maima regala los marshmallows. A 1.800 metros sobre el nivel del mar la noche baja rápido y con ella el frío de Dapa, así que el fogón de la zona común se vuelve el sitio donde termina el día, con las luces del Valle del Cauca de fondo y —si el cielo está despejado, que es casi siempre— un cielo estrellado sin contaminación lumínica. Se coordina con la administración el mismo día.","duration":"Se enciende entre 6:00 y 7:00 p. m.","capacity":null,"price_cop":null,"price_note":"Bajo solicitud","gallery":[{"alt":"Fogata encendida al anochecer, rodeada de troncos que sirven de asiento","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/fogata/1.jpg"}],"visible":true,"sort_order":5,"created_at":"2026-08-06T19:19:59.800803+00:00","updated_at":"2026-08-31T17:20:41.88602+00:00","name_en":"Fire pit","short_description_en":"Firewood, a clear sky and the mountain cold: the natural way to close the day in Dapa.","description_en":"It is lit in the evening, at around 6:00 – 7:00 p.m.: a place to gather and share at the end of the day, and La Maima brings the marshmallows. At 1,800 metres above sea level night falls quickly and brings the Dapa cold with it, so the fire in the common area becomes the spot where the day ends, with the lights of the Cauca Valley below and — if the sky is clear, which it almost always is — a starry sky with no light pollution. It is arranged with the front desk on the day.","duration_en":"Lit between 6:00 and 7:00 p.m.","price_note_en":"On request"},{"id":"e19c201e-2fa9-4893-9a0f-b64ccd4e4795","slug":"clase-de-yoga","name":"Clase de yoga","short_description":"Yoga tradicional para sentir y mover el cuerpo a través de la respiración, en un espacio dispuesto para los huéspedes.","description":"Incluida en la tarifa de hospedaje y en el pasadía. Se ofrece principalmente los domingos y festivos, en un espacio dispuesto para los huéspedes, con un máximo de 15 personas por clase. Es una clase de una hora y media a dos horas de yoga tradicional, para sentir y mover el cuerpo a través de la respiración. Para quienes solo quieren tomar la clase, el valor es de $40.000 por persona y no incluye el acceso al resto de la reserva.","duration":"De hora y media a dos horas","capacity":15,"price_cop":40000,"price_note":"Incluida · solo clase $40.000","gallery":[{"alt":"Rincón tranquilo de las zonas comunes de La Maima: banca de madera junto al jardín y una terraza cubierta","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/clase-de-yoga/1.jpg"}],"visible":true,"sort_order":4,"created_at":"2026-08-31T15:32:06.036545+00:00","updated_at":"2026-08-31T17:20:41.514678+00:00","name_en":"Yoga class","short_description_en":"Traditional yoga to feel and move the body through the breath, in a room set aside for our guests.","description_en":"Included in the room rate and in the day pass. It is offered mainly on Sundays and public holidays, in a room set aside for our guests, with a maximum of 15 people per class. It runs from an hour and a half to two hours of traditional yoga, built around feeling and moving the body through the breath. For anyone who only wants the class, it costs $40.000 COP per person and does not include access to the rest of the reserve.","duration_en":"An hour and a half to two hours","price_note_en":"Included · class only $40.000 COP"}]$maima$::jsonb)
on conflict (id) do nothing;

-- holidays: 36 filas
insert into public.holidays ("holiday_date", "name", "created_at")
select "holiday_date", "name", "created_at"
from jsonb_populate_recordset(null::public.holidays, $maima$[{"holiday_date":"2026-01-01","name":"Año Nuevo","is_bridge":false,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2026-01-12","name":"Reyes Magos","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2026-03-23","name":"San José","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2026-04-02","name":"Jueves Santo","is_bridge":false,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2026-04-03","name":"Viernes Santo","is_bridge":false,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2026-05-01","name":"Día del Trabajo","is_bridge":false,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2026-05-18","name":"Ascensión del Señor","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2026-06-08","name":"Corpus Christi","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2026-06-15","name":"Sagrado Corazón","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2026-06-29","name":"San Pedro y San Pablo","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2026-07-20","name":"Día de la Independencia","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2026-08-07","name":"Batalla de Boyacá","is_bridge":false,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2026-08-17","name":"Asunción de la Virgen","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2026-10-12","name":"Día de la Raza","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2026-11-02","name":"Todos los Santos","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2026-11-16","name":"Independencia de Cartagena","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2026-12-08","name":"Inmaculada Concepción","is_bridge":false,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2026-12-25","name":"Navidad","is_bridge":false,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2027-01-01","name":"Año Nuevo","is_bridge":false,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2027-01-11","name":"Reyes Magos","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2027-03-22","name":"San José","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2027-03-25","name":"Jueves Santo","is_bridge":false,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2027-03-26","name":"Viernes Santo","is_bridge":false,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2027-05-01","name":"Día del Trabajo","is_bridge":false,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2027-05-10","name":"Ascensión del Señor","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2027-05-31","name":"Corpus Christi","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2027-06-07","name":"Sagrado Corazón","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2027-07-05","name":"San Pedro y San Pablo","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2027-07-20","name":"Día de la Independencia","is_bridge":false,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2027-08-07","name":"Batalla de Boyacá","is_bridge":false,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2027-08-16","name":"Asunción de la Virgen","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2027-10-18","name":"Día de la Raza","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2027-11-01","name":"Todos los Santos","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2027-11-15","name":"Independencia de Cartagena","is_bridge":true,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2027-12-08","name":"Inmaculada Concepción","is_bridge":false,"created_at":"2026-08-26T21:22:26.435395+00:00"},{"holiday_date":"2027-12-25","name":"Navidad","is_bridge":false,"created_at":"2026-08-26T21:22:26.435395+00:00"}]$maima$::jsonb)
on conflict (holiday_date) do nothing;

-- rate_plans: 0 filas en el origen (se deja vacía a propósito).

-- site_content: 6 filas
insert into public.site_content ("key", "value", "updated_at", "value_en")
select "key", "value", "updated_at", "value_en"
from jsonb_populate_recordset(null::public.site_content, $maima$[{"key":"seo","value":{"image":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/og.jpg","image_alt":"La Maima, hotel campestre y reserva natural en Dapa, Yumbo"},"updated_at":"2026-08-31T16:09:48.602442+00:00","value_en":{"image_alt":"La Maima, country hotel and nature reserve in Dapa, Yumbo, Colombia"}},{"key":"contact","value":{"note":"Reservas y consultas por WhatsApp mientras habilitamos el pago en línea.","phone":"+57 311 308 2813","region":"Valle del Cauca","address":"Km 12 Vía a Dapa","country":"Colombia","facebook":"https://facebook.com/lamaimahotel","latitude":3.5347,"locality":"Yumbo","maps_url":"https://www.google.com/maps/search/?api=1&query=La+Maima+Hotel+Campestre+Dapa+Yumbo","whatsapp":"573113082813","instagram":"https://instagram.com/lamaima","longitude":-76.5583,"business_name":"La Maima — Hotel Campestre","phone_display":"+57 311 308 2813","facebook_handle":"@lamaimahotel","instagram_handle":"@lamaima"},"updated_at":"2026-08-10T19:56:41.294194+00:00","value_en":{}},{"key":"home_hero","value":{"image":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/hero.jpg","title":"La naturaleza a tu alcance","eyebrow":"Reserva natural y hotel campestre","cta_href":"/alojamientos","subtitle":"Casas y cabañas independientes en medio de 30 años de bosque rehabilitado, a 20 minutos de Cali. La combinación perfecta entre lujo y naturaleza.","cta_label":"Ver alojamientos","image_alt":"Cabaña de La Maima con techo azul frente a la ladera de bosque nativo en las montañas de Dapa"},"updated_at":"2026-09-01T16:42:19.522837+00:00","value_en":{"title":"Nature within your reach","eyebrow":"Nature reserve and country hotel","subtitle":"Independent houses and cabins set in 30 years of restored forest, 20 minutes from Cali. The perfect balance of comfort and wilderness.","cta_label":"See our stays","image_alt":"A blue-roofed cabin at La Maima facing the native forest hillside in the mountains of Dapa"}},{"key":"listing_heroes","value":{"alojamientos":{"image":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/2.jpg","image_alt":"Ventanal del Mirador de La Maima abierto sobre el Valle del Cauca"},"experiencias":{"image":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/senderos.jpg","image_alt":"Sendero con escalones de madera entre guaduas y árboles del bosque de La Maima, con una banca de guadua a un lado"}},"updated_at":"2026-08-31T16:09:48.602442+00:00","value_en":{"alojamientos":{"image_alt":"The picture window at Mirador, La Maima, looking out over the Cauca Valley"},"experiencias":{"image_alt":"A trail with timber steps between guadua bamboo and forest trees at La Maima, with a bamboo bench to one side"}}},{"key":"instagram_strip","value":{"gallery":[{"alt":"El Valle del Cauca visto desde los jardines de La Maima, con el cielo cubierto de nubes","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/sobre-la-reserva.jpg"},{"alt":"Ventanal panorámico del Mirador abierto sobre el bosque y el valle","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/2.jpg"},{"alt":"Tucancito esmeralda posado en una rama del bosque de la reserva","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/avistamiento-de-flora-y-fauna/1.jpg"},{"alt":"Terraza del Mirador con una hamaca colgada frente a la montaña","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/5.jpg"},{"alt":"Quebrada de agua fría con pozos naturales entre las piedras del bosque","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/piscina-de-rio/1.jpg"},{"alt":"Fachada de Casa Maima con su techo azul y el jardín de plantas tropicales","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/1.jpg"}]},"updated_at":"2026-08-31T16:09:48.602442+00:00","value_en":{"gallery":[{"alt":"The Cauca Valley seen from the gardens at La Maima, under a cloudy sky","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/sobre-la-reserva.jpg"},{"alt":"The panoramic window at Mirador, open onto the forest and the valley","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/2.jpg"},{"alt":"An emerald toucanet perched on a branch in the forest of the reserve","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/avistamiento-de-flora-y-fauna/1.jpg"},{"alt":"The terrace at Mirador with a hammock hung facing the mountain","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/mirador/5.jpg"},{"alt":"A cold-water stream with natural pools among the rocks of the forest","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/piscina-de-rio/1.jpg"},{"alt":"The front of Casa Maima with its blue roof and its garden of tropical plants","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/1.jpg"}]}},{"key":"home_about","value":{"image":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/sobre-la-reserva.jpg","stats":[{"label":"años de rehabilitación","value":"30"},{"label":"casas y cabañas","value":"{{alojamientos}}"},{"label":"tipos de bosque","value":"3"}],"title":"Treinta años devolviéndole el bosque a la montaña","eyebrow":"Sobre la reserva","gallery":[{"alt":"El Valle del Cauca visto desde La Maima, con el bosque de la reserva en primer plano","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/sobre-la-reserva.jpg"},{"alt":"Interior del bosque de la reserva, con helechos y árboles altos cubiertos de musgo","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/bosque.jpg"},{"alt":"Quebrada de aguas frías con pozos naturales entre las piedras de la reserva","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/piscina-de-rio/1.jpg"},{"alt":"Tucancito esmeralda posado en una rama del bosque de La Maima","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/avistamiento-de-flora-y-fauna/1.jpg"},{"alt":"Sendero de tierra que atraviesa el bosque rehabilitado de la reserva","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/senderos.jpg"}],"image_alt":"El Valle del Cauca visto desde La Maima, con el bosque de la reserva en primer plano","paragraphs":["La Maima nació como un proyecto familiar de rehabilitación en las montañas de Dapa. Tres décadas después, lo que era potrero es hoy una reserva con bosque primario, secundario y terciario conviviendo en la misma ladera, y con la fauna del bosque andino de regreso: tucanes, pavas, colibríes y guatines.","Sobre ese bosque construimos casas y cabañas independientes, cada una con cocineta y baño privado. Nada de pasillos ni recepciones: cada alojamiento tiene su propia entrada, su terraza y su pedazo de montaña.","Estamos en el Km 12 de la Vía a Dapa, en Yumbo, a menos de una hora de Cali por carretera pavimentada. Suficientemente cerca para venir un fin de semana; suficientemente lejos para no oír la ciudad."]},"updated_at":"2026-09-01T16:42:19.522837+00:00","value_en":{"stats":[{"label":"years of restoration","value":"30"},{"label":"houses and cabins","value":"{{alojamientos}}"},{"label":"types of forest","value":"3"}],"title":"Thirty years giving the forest back to the mountain","eyebrow":"About the reserve","gallery":[{"alt":"The Cauca Valley seen from La Maima, with the forest of the reserve in the foreground","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/sobre-la-reserva.jpg"},{"alt":"Inside the reserve's forest, with ferns and tall moss-covered trees","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/bosque.jpg"},{"alt":"A cold-water stream with natural pools among the rocks of the reserve","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/piscina-de-rio/1.jpg"},{"alt":"An emerald toucanet perched on a branch in the forest at La Maima","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/experiencias/avistamiento-de-flora-y-fauna/1.jpg"},{"alt":"An earth trail running through the restored forest of the reserve","url":"https://ausqyfdglyxapeszkrck.supabase.co/storage/v1/object/public/gallery/sitio/senderos.jpg"}],"image_alt":"The Cauca Valley seen from La Maima, with the forest of the reserve in the foreground","paragraphs":["La Maima began as a family restoration project in the mountains of Dapa. Three decades later, what used to be pasture is a reserve where primary, secondary and tertiary forest grow side by side on the same hillside, with the wildlife of the Andean forest back home: toucans, guans, hummingbirds and agoutis.","On top of that forest we built independent houses and cabins, each with its own kitchenette and private bathroom. No corridors, no reception desk: every house has its own entrance, its own terrace and its own piece of mountain.","We are at kilometre 12 of the Dapa road, in Yumbo, less than an hour from Cali on paved road. Close enough to come for a weekend; far enough not to hear the city."]}}]$maima$::jsonb)
on conflict (key) do nothing;



-- =============================================================================
-- D. USUARIO ADMINISTRADOR
-- =============================================================================
-- YA ESTÁ CREADO: se dio de alta el 2026-09-01 con la API de administración de
-- Auth y se comprobó el inicio de sesión real. Este bloque NO hace nada si el
-- correo ya existe; queda por si algún día hay que rehacer el proyecto desde
-- cero con solo este archivo.
--
-- Detalle importante si alguna vez se crea un usuario por SQL: GoTrue exige
-- cadena vacía (NO null) en las columnas de token; si quedan en NULL el login
-- falla con un error de escaneo de tipos.
--
-- La contraseña es la temporal actual. CAMBIARLA antes de entregar el sitio.
do $admin$
declare
  v_user_id uuid := gen_random_uuid();
begin
  if exists (select 1 from auth.users where email = 'admin@lamaima.com') then
    raise notice 'El usuario admin@lamaima.com ya existe: no se toca.';
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token,
    reauthentication_token, is_super_admin, is_sso_user, is_anonymous
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated', 'authenticated',
    'admin@lamaima.com',
    extensions.crypt('Maima2026-Dapa#7Kx', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"nombre":"Administración La Maima"}'::jsonb,
    now(), now(),
    '', '', '', '', '', '', '', '',
    false, false, false
  );

  insert into auth.identities (
    id, user_id, provider, provider_id, identity_data,
    last_sign_in_at, created_at, updated_at
  )
  values (
    gen_random_uuid(), v_user_id, 'email', v_user_id::text,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', 'admin@lamaima.com',
      'email_verified', true,
      'phone_verified', false
    ),
    now(), now(), now()
  );
end
$admin$;


-- =============================================================================
-- E. VERIFICACIÓN — todas las filas deben decir OK
-- =============================================================================
select
  chk.etiqueta,
  chk.esperado,
  chk.real,
  case when chk.real = chk.esperado then 'OK' else 'REVISAR' end as estado
from (
  select 'accommodations' as etiqueta, 6 as esperado, (select count(*) from public.accommodations) as real
  union all select 'experiences',    8,    (select count(*) from public.experiences)
  union all select 'rate_tiers',     18,     (select count(*) from public.rate_tiers)
  union all select 'min_stay_rules', 25, (select count(*) from public.min_stay_rules)
  union all select 'holidays',       36,       (select count(*) from public.holidays)
  union all select 'rate_plans',     0,                                     (select count(*) from public.rate_plans)
  union all select 'site_content',   6,   (select count(*) from public.site_content)
  union all select 'bookings (vacía)',      0, (select count(*) from public.bookings)
  union all select 'blocked_dates (vacía)', 0, (select count(*) from public.blocked_dates)
  union all select 'ical_feeds (vacía)',    0, (select count(*) from public.ical_feeds)
  union all select 'admin user',            1, (select count(*) from auth.users where email = 'admin@lamaima.com')
  union all select 'bucket gallery',        1, (select count(*) from storage.buckets where id = 'gallery')
  union all select 'objetos en gallery',   76, (select count(*) from storage.objects where bucket_id = 'gallery')
  union all select 'URLs del host viejo (deben ser 0)', 0, (
      select count(*) from (
        select 1 from public.accommodations where gallery::text like '%mauolzwhergekdvigmaf%'
        union all select 1 from public.experiences   where gallery::text like '%mauolzwhergekdvigmaf%'
        union all select 1 from public.site_content
          where value::text like '%mauolzwhergekdvigmaf%' or value_en::text like '%mauolzwhergekdvigmaf%'
      ) s)
) chk
order by chk.etiqueta;


-- =============================================================================
-- F. GRANTS EXPLÍCITOS DE TABLA — completan la migración (2026-09-01)
-- =============================================================================
-- HALLAZGO: tras aplicar A-E, la BD quedó con los datos correctos pero la API
-- REST (PostgREST) devolvía "permission denied for table X" (42501) para
-- anon, authenticated E INCLUSO service_role en las 10 tablas de public.
--
-- CAUSA: este proyecto (ORYON, ausqyfdglyxapeszkrck) tiene, para el rol
-- "postgres" (el que ejecuta este script vía el pooler), un
-- ALTER DEFAULT PRIVILEGES en el esquema public que solo concede
-- REFERENCES/TRIGGER/TRUNCATE/MAINTAIN a anon/authenticated/service_role en
-- las tablas que ese rol cree — NO select/insert/update/delete. El proyecto
-- personal anterior de César tenía los defaults estándar de Supabase
-- (arwdDxtm para los tres roles), por eso allí nunca hizo falta este bloque.
--
-- Las políticas RLS de la sección 7 (arriba) están bien escritas, pero RLS es
-- una segunda capa: Postgres primero comprueba el GRANT de tabla y solo si
-- pasa evalúa las políticas. service_role tiene rolbypassrls=true (salta
-- RLS), pero eso NO lo exime de necesitar el GRANT — por eso también fallaba
-- en /api/availability, las Server Actions de reservas y el panel admin.
--
-- REGLA para el futuro: toda migración nueva que cree una tabla en ESTE
-- proyecto debe traer su propio GRANT explícito justo después del
-- CREATE TABLE. El ALTER DEFAULT PRIVILEGES de más abajo evita que se repita
-- el bloqueo total en tablas creadas desde ahora por el rol postgres, pero no
-- reemplaza la disciplina de ser explícito en cada migración.

-- USAGE sobre el esquema (defensivo). Ya estaba concedido en ORYON al
-- momento de este hallazgo — sin esto ni el SELECT de tabla funciona — pero
-- se deja explícito por si un hardening futuro lo retira.
grant usage on schema public to anon, authenticated, service_role;

-- Catálogo público: estas 7 tablas tienen policy "for select to anon,
-- authenticated" (accommodations/experiences filtran visible=true; las 5
-- restantes son precios/reglas/textos sin nada sensible). service_role
-- también necesita el SELECT explícito (bypassa RLS, no el GRANT).
grant select on
  public.accommodations,
  public.experiences,
  public.rate_tiers,
  public.min_stay_rules,
  public.holidays,
  public.rate_plans,
  public.site_content
  to anon, authenticated, service_role;

-- CRUD completo para el panel admin (rol "authenticated" tras login) y para
-- las rutas de servidor con SUPABASE_SERVICE_ROLE_KEY (disponibilidad,
-- Server Actions de reservas, futuro cron de iCal y webhook de pagos):
-- las 10 tablas de public, ninguna se salta el GRANT aunque su policy sea
-- "for all to authenticated" o RLS no aplique por service_role.
grant select, insert, update, delete on
  public.accommodations,
  public.experiences,
  public.rate_tiers,
  public.min_stay_rules,
  public.holidays,
  public.rate_plans,
  public.site_content,
  public.bookings,
  public.blocked_dates,
  public.ical_feeds
  to authenticated, service_role;

-- Para que las PRÓXIMAS tablas que se creen en este proyecto (rol postgres,
-- vía SQL Editor o el pooler) nazcan con los grants correctos y esto no se
-- repita: sumamos select/insert/update/delete al default privilege
-- restrictivo que ya existía (ALTER DEFAULT PRIVILEGES es aditivo, no lo
-- reemplaza). anon solo recibe select — nunca debe poder escribir.
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges for role postgres in schema public
  grant select on tables to anon;
