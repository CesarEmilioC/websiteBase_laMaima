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
│   │   ├── layout.tsx        # fuentes y metadata base (título, OG, Twitter)
│   │   ├── globals.css       # tokens de diseño (Tailwind v4 @theme) y base
│   │   ├── not-found.tsx     # 404 personalizada
│   │   ├── sitemap.ts        # sitemap con lastmod reales (incluye legales)
│   │   ├── robots.ts         # robots.txt (bloquea /admin y /api)
│   │   ├── (public)/         # rutas públicas (route group, no afecta la URL)
│   │   │   ├── layout.tsx      # header + footer + WhatsApp + JSON-LD del hotel
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
│       ├── seo.ts           # metadatos por página (canónica + OG + Twitter),
│       │                      descripciones compuestas y datos estructurados
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

## SEO al publicar

El SEO técnico del sitio ya está resuelto en el código: cada ruta publica su
propio `title`, su descripción, su canónica y su tarjeta social con la foto que
le corresponde; el grafo de datos estructurados (`LodgingBusiness`, `WebSite`,
`Accommodation`/`Product` con oferta y `BreadcrumbList`) sale de la base de
datos, y el sitemap lleva fechas de modificación reales. Nada de eso hay que
tocarlo al lanzar.

Lo que sí depende del dominio y de las cuentas del cliente es esta lista. **En
orden**, porque los pasos 2 y 3 no sirven de nada antes del 1.

### 1. Apuntar el sitio al dominio real

Todo lo canónico —`<link rel="canonical">`, `og:url`, el sitemap, el
`robots.txt` y los `@id` del JSON-LD— cuelga de una sola constante:
`SITE.url` en `src/lib/site.ts`, que lee `NEXT_PUBLIC_SITE_URL` y cae en
`https://www.lamaima.com` si no existe.

- En **Vercel → Project Settings → Environment Variables**, definir
  `NEXT_PUBLIC_SITE_URL` con el dominio definitivo **exactamente como se va a
  servir**: con `https://`, con o sin `www` según lo que se elija, y **sin
  barra final**. Si el dominio queda en `https://lamaima.com` (sin `www`) y la
  variable dice `https://www.lamaima.com`, todas las canónicas apuntarán a una
  dirección que redirige, que es la forma más común de perder posicionamiento
  en una migración.
- En **Vercel → Domains**, dejar UNA sola versión como principal y la otra como
  redirección (Vercel lo hace solo al marcar el dominio primario).
- Volver a desplegar: la variable se compila en las páginas estáticas.
- Comprobar después: `https://<dominio>/robots.txt` y
  `https://<dominio>/sitemap.xml` deben mostrar el dominio nuevo, y el
  `view-source` de la portada debe tener `rel="canonical"` con ese mismo
  dominio.

### 2. Redirecciones 301 desde el sitio anterior (Wix)

Ya están escritas y **activas** en `next.config.ts` (`wixRedirects`), así que
empiezan a funcionar solas en cuanto el DNS apunte a Vercel:

| Dirección antigua (Wix)              | Destino nuevo         |
| ------------------------------------ | --------------------- |
| `/alojamiento`, `/alojamiento/:slug`  | `/alojamientos`       |
| `/reservar`, `/book-online`           | `/alojamientos`       |
| `/booking-calendar`, `/booking-calendar/*` | `/alojamientos` |
| `/plans-pricing`                      | `/alojamientos`       |
| `/contacto`, `/contact`               | `/#contacto`          |
| `/nosotros`, `/about`                 | `/#reserva-natural`   |
| `/experiencia`                        | `/experiencias`       |
| `/galeria`                            | `/alojamientos`       |

Cuando el sitio lleve unos días publicado, entrar a **Search Console →
Páginas → No encontradas (404)**: ahí aparecerán las direcciones antiguas que
falten (Wix suele generar rutas del tipo `/copy-of-...`, `/blank-1` o con
prefijo de idioma). Añadirlas al mismo array. **Nunca encadenar** una
redirección con otra: cada dirección vieja debe llegar a su destino final en un
solo salto.

### 3. Search Console y sitemap

1. Entrar a [Google Search Console](https://search.google.com/search-console)
   con la cuenta que vaya a quedarse el cliente (o la corporativa de ORYON).
2. Añadir una propiedad de tipo **dominio** (verificación por registro `TXT`
   en el DNS: cubre `http`, `https`, `www` y subdominios de una vez). Si no hay
   acceso al DNS, usar propiedad de **prefijo de URL** y verificar subiendo el
   archivo HTML que da Google a `public/`.
3. **Sitemaps → Añadir sitemap:** `sitemap.xml`.
4. **Inspección de URLs → Solicitar indexación** para la portada,
   `/alojamientos` y las seis fichas: acelera el primer rastreo.
5. Repetir el registro en [Bing Webmaster Tools](https://www.bing.com/webmasters),
   que importa la propiedad desde Search Console en dos clics.

### 4. Perfil de empresa en Google (lo que más tráfico local trae)

Para "hotel campestre Dapa" o "cabañas cerca de Cali", el perfil pesa tanto
como el sitio.

- Reclamar o crear el perfil en
  [business.google.com](https://business.google.com) con la categoría
  **"Hotel"** y la secundaria **"Alojamiento con desayuno"**.
- Que **coincidan exactamente** con lo que publica el sitio (y con el JSON-LD)
  el nombre `La Maima — Hotel Campestre`, la dirección `Km 12 Vía a Dapa,
  Yumbo, Valle del Cauca` y el teléfono `+57 311 308 2813`. Google cruza esos
  tres datos entre fuentes; si no cuadran, desconfía de las dos.
- Sitio web del perfil: el dominio nuevo. Horario de check-in 3:00 p. m. y
  check-out 1:00 p. m., atributos "admite mascotas" y "prohibido fumar".
- Subir las mismas fotos del sitio y enlazar Instagram y Facebook.

### 5. Verificación del dominio para los correos (Resend)

Los correos de confirmación se envían desde el dominio del cliente, y sin
verificar acaban en spam.

- En [Resend → Domains](https://resend.com/domains), añadir `lamaima.com` y
  crear en el DNS los registros que indique: **SPF** (`TXT`), **DKIM**
  (`CNAME`) y el `MX` de la subdirección de rebotes.
- Añadir también un registro **DMARC** (`_dmarc.lamaima.com`, `TXT`), empezando
  por `v=DMARC1; p=none; rua=mailto:<correo del cliente>` para observar sin
  bloquear, y endurecerlo a `p=quarantine` cuando el informe salga limpio.
- Cargar `RESEND_API_KEY` en las variables de entorno de Vercel. Sin ella el
  código no falla: registra el envío y no manda nada (ver `src/lib/email/`).

### 6. Repaso final antes de anunciar

- [ ] `NEXT_PUBLIC_SITE_URL` con el dominio definitivo y sin barra final.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` cargada en Vercel (sin ella el calendario de
      disponibilidad no responde).
- [ ] Los datos en ámbar de las páginas legales (NIT, RNT, correo oficial,
      vigencia del crédito de reprogramación) reemplazados por los reales.
- [ ] Las URLs iCal para Airbnb y Booking apuntando al dominio nuevo:
      `https://<dominio>/api/ical/<slug>`.
- [ ] Contraseña de `admin@lamaima.com` cambiada antes de entregar el panel.
- [ ] Lighthouse móvil de portada, listado y ficha por encima de 90 (medido
      contra producción, no contra `next start` local: sin CDN ni HTTP/2 las
      fotos del optimizador salen entre 5 y 10 puntos por debajo).

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
