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

  capacity            integer not null check (capacity > 0),

  -- precio por noche en COP (sin decimales)
  price_per_night_cop integer not null check (price_per_night_cop >= 0),
  -- aclaración visible junto al precio, ej. "Tarifa por confirmar"
  price_note          text,

  -- ["Cocineta equipada", "Baño privado", ...]
  amenities           jsonb not null default '[]'::jsonb,
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
-- 3. bookings — reservas (web propia + registro manual de Airbnb/Booking)
-- =============================================================================
-- NOTA: esta tabla se usará en la Fase 3 (motor de reservas + Wompi). Se crea
-- desde ya para dejar fija la restricción anti-solape.
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

  -- pending: creada, esperando pago (Wompi)
  -- paid: pago confirmado, fechas bloqueadas en firme
  -- cancelled: cancelada (no bloquea fechas)
  -- external: registrada manualmente desde Airbnb/Booking/otro canal
  status           text not null default 'pending'
                     check (status in ('pending', 'paid', 'cancelled', 'external')),

  source           text not null default 'web'
                     check (source in ('web', 'airbnb', 'booking', 'manual')),

  -- referencia de la transacción en Wompi o del canal externo
  payment_ref      text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint bookings_checkout_after_checkin check (check_out > check_in)
);

drop trigger if exists set_updated_at_bookings on public.bookings;
create trigger set_updated_at_bookings
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- Restricción anti-solape: para un mismo alojamiento no pueden coexistir dos
-- reservas activas (pending o paid) con rangos de fechas que se crucen.
-- Rango medio-abierto [check_in, check_out) para que el día de salida de un
-- huésped pueda ser el día de entrada del siguiente.
-- Las "cancelled" y "external" quedan fuera: la primera ya no ocupa calendario
-- y la segunda se refleja en blocked_dates (importado por iCal).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_no_overlap'
  ) then
    alter table public.bookings
      add constraint bookings_no_overlap
      exclude using gist (
        accommodation_id with =,
        daterange(check_in, check_out, '[)') with &&
      )
      where (status in ('pending', 'paid'));
  end if;
end
$$;

create index if not exists idx_bookings_accommodation_dates
  on public.bookings (accommodation_id, check_in, check_out);

create index if not exists idx_bookings_status
  on public.bookings (status);


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
--     RLS deniega por defecto. El flujo público de reserva (Fase 3) insertará
--     desde el servidor con SUPABASE_SERVICE_ROLE_KEY tras validar el pago.

alter table public.accommodations enable row level security;
alter table public.experiences    enable row level security;
alter table public.bookings       enable row level security;
alter table public.blocked_dates  enable row level security;
alter table public.site_content   enable row level security;
alter table public.ical_feeds     enable row level security;

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

-- =============================================================================
-- Pendiente para fases siguientes:
--   - Distinguir roles de admin ("owner" vs "staff") si el cliente lo pide.
--   - Validación cruzada bookings <-> blocked_dates al confirmar una reserva.
--   - Endpoint público de solo lectura /api/ical/[accommodation].ics (export).
-- =============================================================================
