# `admin/` — Panel de administración

Panel privado de La Maima: contenido del sitio público y gestión del
calendario de reservas. Acceso con Supabase Auth (correo y contraseña).

> El motor de reservas **público** con pago en línea (Wompi) es una fase
> aparte y no vive aquí. Lo que sí vive aquí es el **registro manual** de las
> reservas que llegan por teléfono, WhatsApp, Airbnb o Booking.

## Estructura

```
src/app/admin/
├── layout.tsx                     # Aísla /admin del sitio público + noindex
├── (auth)/login/
│   ├── page.tsx                   # /admin/login (tarjeta centrada)
│   ├── login-form.tsx             # Formulario (useActionState)
│   └── actions.ts                 # signInAction
├── (panel)/                       # Todo lo que exige sesión
│   ├── layout.tsx                 # requireAdmin() + cabecera + navegación
│   ├── actions.ts                 # signOutAction
│   ├── page.tsx                   # /admin — resumen
│   ├── alojamientos/              # CRUD + galería + orden + visibilidad
│   │   ├── page.tsx  nuevo/  [id]/  accommodation-form.tsx  actions.ts
│   ├── experiencias/              # CRUD equivalente
│   │   ├── page.tsx  nueva/  [id]/  experience-form.tsx  actions.ts
│   ├── reservas/                  # Listado con filtros, ficha, alta manual
│   │   ├── page.tsx  nueva/  [id]/  booking-form.tsx  actions.ts
│   ├── bloqueos/                  # Rangos de fechas no disponibles
│   │   ├── page.tsx  block-form.tsx  actions.ts
│   └── contenido/                 # site_content: portada, "sobre", contacto
│       ├── page.tsx  actions.ts
└── api/gallery/upload/route.ts    # Subida al bucket "gallery" de Storage
```

Piezas compartidas en `src/components/admin/` (tarjetas, campos, pastillas,
banner, editor de galería, editor de chips) y lógica en `src/lib/admin/`
(consultas, validación, fechas, disponibilidad, revalidación).

## Seguridad

Tres capas, a propósito:

1. **`src/middleware.ts`** — corre antes de cada request a `/admin/*`,
   refresca el token y redirige a `/admin/login` a quien no tenga sesión.
2. **`requireAdmin()`** (`src/lib/admin/auth.ts`) — se vuelve a comprobar en
   cada página y en cada Server Action. El middleware es una conveniencia de
   navegación, no una frontera: una Server Action se puede invocar por POST
   directo.
3. **RLS en Supabase** — las políticas solo dan escritura al rol
   `authenticated`. Todas las consultas del panel viajan con el JWT del
   usuario, así que la base de datos es la última palabra.

El panel **nunca** usa `SUPABASE_SERVICE_ROLE_KEY`.

## Publicación de cambios

El sitio público es estático con ISR (`revalidate = 3600`). Tras cada
mutación, las acciones llaman a `revalidatePublicSite()`
(`src/lib/admin/revalidate.ts`), que invalida **las dos** cachés:

- `revalidateTag(PUBLIC_CONTENT_TAG)` → las respuestas de Supabase guardadas
  en la Data Cache (la etiqueta la pone `src/lib/supabase/public.ts`).
- `revalidatePath(...)` → el HTML ya generado.

Detalle comprobado contra `next start` en Next 15.5: para una ruta estática
hay que pasar **solo la ruta** a `revalidatePath`; añadirle el segundo
argumento `"page"` no purga nada. Ese segundo argumento sí hace falta en el
patrón `/alojamientos/[slug]`.

## Cuenta de acceso

Se crea desde el Dashboard de Supabase (Authentication → Users → Add user,
con "Auto Confirm User" activado) o con la Admin API. No hay registro público:
`/admin/login` solo permite iniciar sesión.
