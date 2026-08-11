# La Maima — Sitio web con reservas y pagos

Sitio web de **La Maima**, reserva natural y hotel campestre ubicado en el
Km 12 Vía a Dapa, Yumbo (Valle del Cauca, Colombia). Reemplaza el sitio
actual en Wix (no responsive, reservas rotas, sin pagos en línea) por una
plataforma propia con:

- Sitio público (home, alojamientos, experiencias) optimizado para SEO.
- Motor de reservas con calendario en tiempo real (Supabase como fuente de
  verdad) y pagos en línea vía Wompi.
- Sincronización de disponibilidad con Airbnb y Booking.com (iCal, para
  evitar sobreventa).
- Panel de administración para el cliente: CRUD de alojamientos y
  experiencias, y gestión de reservas.

Este proyecto (`website/`) es la app Next.js. El resto del contexto de
negocio (propuestas, briefs, memoria) vive en la raíz del repo, en
`../docs/` y `../memoria/MEMORIA.md`.

## Stack

- **Framework:** Next.js 15 (App Router) + TypeScript + Tailwind CSS v4.
- **BD / Auth / Storage:** [Supabase](https://supabase.com) (Postgres +
  Auth + Storage para imágenes).
- **Pagos:** Wompi (Bancolombia) — a integrar más adelante.
- **Emails transaccionales:** Resend — a integrar más adelante.
- **Hosting:** Vercel.

> Estado actual: **Fase 1 completa — sitio público navegable**. El esquema
> está aplicado en Supabase con datos iniciales, y la home, el listado y
> detalle de alojamientos, y las experiencias se renderizan desde la base de
> datos. **Todavía no hay** motor de reservas, pagos, sincronización iCal ni
> panel de administración (fases siguientes del roadmap).
>
> Todo el contenido cargado es **provisional**: fotos tomadas del sitio Wix
> actual y tarifas placeholder marcadas como "Tarifa por confirmar". Se
> reemplazan cuando el cliente entregue fotos y precios reales.

## Requisitos

- Node.js 22+ y npm 11+ (usar `node -v` / `npm -v` para confirmar).
- Una cuenta y proyecto de Supabase (ya existe el proyecto "La Maima",
  activo en la región `ca-central-1`).

## Comandos

Ejecutar siempre dentro de la carpeta `website/`:

```bash
npm run dev      # servidor de desarrollo (http://localhost:3000)
npm run build    # build de producción
npm run start    # sirve el build de producción (requiere build previo)
npm run lint     # ESLint
```

## Variables de entorno

1. `website/.env.local` ya existe en este entorno con las credenciales
   reales del proyecto Supabase "La Maima" (URL pública y clave `anon`).
   `website/.env.local.example` es la plantilla versionada en git, con
   placeholders (úsala como base si se recrea `.env.local` desde cero en
   otra máquina).
2. Origen de los valores: **Supabase Dashboard** del proyecto "La Maima"
   → `Project Settings → API`.
   - `NEXT_PUBLIC_SUPABASE_URL` → campo "Project URL".
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → campo "anon public" en
     "Project API keys" (formato JWT legacy, es la que usa hoy
     `@supabase/ssr`).
   - Supabase también expone una "publishable key" moderna
     (`sb_publishable_...`), pensada para reemplazar a la `anon` key a
     futuro; se deja anotada en `.env.local` como referencia, sin usarla
     todavía en el código.
   - `SUPABASE_SERVICE_ROLE_KEY` → campo "service_role" en
     "Project API keys". **Pendiente:** hoy en `.env.local` queda como
     `REEMPLAZAR`; César debe copiarla manualmente desde el Dashboard.
     **Nunca** debe exponerse al cliente ni llevar el prefijo
     `NEXT_PUBLIC_`; solo se usa en código de servidor (Route Handlers,
     Server Actions, cron jobs).
3. `.env.local` está excluido de git (ver `.gitignore`, patrón `.env*`).
   `.env.local.example` sí se versiona (excepción explícita en
   `.gitignore`) para que cualquiera que clone el repo sepa qué variables
   necesita, sin exponer secretos reales.
4. Variables futuras (Wompi, Resend) están documentadas como comentarios en
   `.env.local.example`; se activarán cuando se implementen esas fases.

## Estructura de carpetas

```
website/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # fuentes, metadata base, JSON-LD LodgingBusiness
│   │   ├── globals.css       # tokens de diseño (Tailwind v4 @theme) y base
│   │   ├── not-found.tsx     # 404 personalizada
│   │   ├── sitemap.ts        # sitemap dinámico (incluye los 6 alojamientos)
│   │   ├── robots.ts         # robots.txt (bloquea /admin)
│   │   ├── (public)/         # rutas públicas (route group, no afecta la URL)
│   │   │   ├── layout.tsx      # SiteHeader + SiteFooter + WhatsAppFloat
│   │   │   ├── page.tsx        # Home
│   │   │   ├── alojamientos/page.tsx
│   │   │   ├── alojamientos/[slug]/page.tsx
│   │   │   └── experiencias/page.tsx
│   │   ├── admin/            # [convención, aún vacía] panel administrativo
│   │   │   ├── login/page.tsx
│   │   │   ├── page.tsx         # dashboard
│   │   │   ├── alojamientos/page.tsx  # CRUD
│   │   │   ├── experiencias/page.tsx  # CRUD
│   │   │   └── reservas/page.tsx      # gestión de reservas
│   │   └── api/               # [a crear] Route Handlers:
│   │                             #  - webhooks de pago (Wompi)
│   │                             #  - cron de sincronización iCal (Vercel Cron)
│   ├── components/          # UI compartida: header, footer, tarjetas,
│   │                          galería, botones de WhatsApp, iconos SVG
│   └── lib/
│       ├── content.ts       # acceso tipado al contenido público de Supabase
│       ├── format.ts        # formato de precios COP ($350.000) y huéspedes
│       ├── site.ts          # constantes: contacto, redes, mapa, navegación
│       ├── whatsapp.ts      # construcción de enlaces wa.me con mensaje
│       └── supabase/
│           ├── client.ts    # cliente para el navegador (Client Components)
│           ├── server.ts    # cliente con cookies (sesión / panel admin)
│           └── public.ts    # cliente sin cookies para lectura pública (ISR)
├── public/
│   ├── logo-lamaima.png     # logo azul con fondo transparente
│   └── images/              # fotos beta descargadas del Wix actual
├── supabase/
│   ├── schema.sql           # esquema aplicado (migración `initial_schema`)
│   └── seed.sql             # datos iniciales aplicados (contenido provisional)
├── .env.local.example       # plantilla de variables de entorno (versionada)
├── .env.local                # variables reales de este entorno (ignorado por git)
└── README.md                  # este archivo
```

`admin/` se deja documentada como convención; se implementa en la Fase 4
(ver su `README.md` para más detalle).

### Por qué hay tres clientes de Supabase

`server.ts` lee cookies con `next/headers` para mantener la sesión de
Supabase Auth, y eso obliga a Next a renderizar la ruta de forma dinámica en
cada request. Las páginas públicas no dependen de ninguna sesión, así que
usan `public.ts` (cliente plano con la clave `anon`, sin cookies): eso
permite `generateStaticParams` + `export const revalidate` y sirve el sitio
estático con revalidación cada hora. `server.ts` se reserva para el panel
admin y `client.ts` para componentes de navegador que consulten en vivo.

## Base de datos (Supabase)

`supabase/schema.sql` es el reflejo del esquema **ya aplicado** al proyecto
"La Maima" (ref `mauolzwhergekdvigmaf`, región `ca-central-1`) como la
migración `initial_schema`. Tablas: `accommodations`, `experiences`,
`bookings` (con restricción `EXCLUDE ... USING gist` que impide el solape de
fechas por alojamiento, apoyada en `btree_gist`), `blocked_dates`,
`site_content` e `ical_feeds`, más RLS en las seis.

Reglas de RLS vigentes:

- `accommodations` / `experiences`: lectura pública **solo** de las filas con
  `visible = true`; lectura total y escritura solo para `authenticated`.
- `site_content`: lectura pública, escritura solo `authenticated`.
- `bookings` / `blocked_dates` / `ical_feeds`: sin políticas para `anon`, así
  que RLS deniega por defecto. El flujo público de reserva (Fase 3) escribirá
  desde el servidor con `SUPABASE_SERVICE_ROLE_KEY` después de validar el
  pago, nunca desde el navegador.

`supabase/seed.sql` contiene los datos iniciales (6 alojamientos, 4
experiencias y 3 bloques de `site_content`), también ya aplicados. Es
idempotente (`on conflict ... do update`), así que puede re-ejecutarse.

**Cualquier cambio posterior debe hacerse como una migración nueva**, no
editando estos archivos a ciegas, para no perder el historial.

## Notas de entorno (Windows / OneDrive)

El repo vive dentro de una carpeta sincronizada por OneDrive
(`...\OneDrive\Escritorio\FREELANCE\MAIMA\website`). En el scaffolding
inicial (`create-next-app`, `npm install`, `npm run build`, `tsc --noEmit`,
`eslint`) **no se presentó ningún problema** de locks de archivos ni de
symlinks causado por OneDrive; todo corrió limpio. Si en el futuro
aparecen errores intermitentes tipo `EBUSY`/`EPERM` durante `npm install` o
`next build` (típico de antivirus/OneDrive re-indexando `node_modules`
mientras se escribe), las mitigaciones recomendadas son:

- Pausar temporalmente la sincronización de OneDrive mientras se corre
  `npm install` / `npm run build`.
- Excluir las carpetas `node_modules/` y `.next/` desde Configuración de
  OneDrive → Sincronización y copia de seguridad.
- Como alternativa más robusta a largo plazo, mover el repo fuera de
  OneDrive (ej. `C:\dev\MAIMA`) y dejar OneDrive solo para los documentos
  de `docs/` e `Insumos/`.

## Roadmap (resumen, 5 semanas)

1. ~~**Semana 1 — Fundaciones:** scaffold del proyecto, esquema de base de
   datos aplicado en Supabase, diseño de UI/UX y sistema de componentes
   base, home con contenido real.~~ **Hecho.**
2. ~~**Semana 2 — Catálogo público:** páginas de alojamientos
   (`/alojamientos/[slug]`) y experiencias conectadas a Supabase, galería
   de imágenes, SEO técnico base (metadata, sitemap, JSON-LD
   `LodgingBusiness`).~~ **Hecho**, salvo mover las imágenes a Supabase
   Storage (hoy se sirven desde `public/images`) y reemplazar fotos y
   tarifas provisionales por las reales del cliente.
3. **Semana 3 — Motor de reservas:** flujo `/reservar` (selección de
   fechas con disponibilidad real, cálculo de precio, datos del huésped),
   integración de pagos con Wompi, bloqueo de fechas al confirmar pago,
   emails transaccionales con Resend.
4. **Semana 4 — Panel admin y sincronización externa:** login con
   Supabase Auth, CRUD de alojamientos/experiencias y gestión de reservas,
   sincronización iCal bidireccional con Airbnb/Booking vía Vercel Cron.
5. **Semana 5 — QA, performance y lanzamiento:** pruebas end-to-end del
   flujo de reserva y pago, revisión de Core Web Vitals y responsive
   completo, contenido final del cliente, despliegue en Vercel (dominio
   propio) y handoff.

Este roadmap es un resumen orientativo; el detalle comercial/de alcance
vive en `../docs/propuestas/BRIEF-PROPUESTAS.md` y el estado real del
proyecto en `../memoria/MEMORIA.md`.
