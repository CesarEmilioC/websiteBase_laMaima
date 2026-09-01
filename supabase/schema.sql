-- =============================================================================
-- La Maima — Esquema de base de datos (Postgres / Supabase)
-- =============================================================================
-- APLICADO al proyecto Supabase "La Maima" (ref mauolzwhergekdvigmaf) como
-- migración `initial_schema` (Fase 1, 2026-08-06).
--
-- Este archivo es el reflejo del esquema real. Cualquier cambio posterior debe
-- hacerse como una migración incremental nueva (no editando este archivo a
-- ciegas) para no perder el historial.
--
-- Convenciones:
--   - Claves primarias: uuid con default gen_random_uuid() (pgcrypto).
--   - Montos en pesos colombianos (COP) como integer: en COP no se usan
--     centavos, así que no hace falta numeric/decimal.
--   - Timestamps en timestamptz (UTC).
--   - Todas las tablas de contenido llevan created_at / updated_at; updated_at
--     lo mantiene un trigger genérico.
--   - Galerías: jsonb con forma [{ "url": "...", "alt": "..." }, ...].
--     Hoy apuntan a /public/images (fotos beta tomadas del sitio Wix actual);
--     al recibir las fotos reales pasarán a Supabase Storage sin cambiar la
--     forma del dato.
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

  -- [{ "url": "https://mauolzwhergekdvigmaf.supabase.co/storage/v1/object/public/gallery/alojamientos/casa-maima/1.jpg", "alt": "..." }, ...]
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
