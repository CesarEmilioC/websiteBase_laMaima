# Route group `(public)`

Rutas públicas del sitio. Los paréntesis crean un *route group* de Next.js:
no agregan segmento a la URL, solo permiten compartir un `layout.tsx`
(header + footer + botón flotante de WhatsApp) sin afectar las rutas.

Estado actual (Fase 1 — sitio público navegable):

```
src/app/(public)/
├── layout.tsx                    # SiteHeader + SiteFooter + WhatsAppFloat
├── page.tsx                      # Home (hero, sobre la reserva, alojamientos,
│                                 #   experiencias, ubicación/contacto + mapa)
├── alojamientos/
│   ├── page.tsx                  # Listado de los 6 alojamientos
│   └── [slug]/page.tsx           # Detalle (galería, amenidades, WhatsApp)
└── experiencias/
    └── page.tsx                  # Listado de experiencias
```

Pendiente para fases siguientes:

```
└── reservar/page.tsx             # Flujo de reserva (fechas + huéspedes + Wompi)
```

Todas las páginas son Server Components y leen de Supabase con el cliente
público (`@/lib/supabase/public`), que no toca cookies para que Next pueda
generarlas estáticamente y revalidarlas con ISR (`export const revalidate`).

El 404 (`src/app/not-found.tsx`) vive en la raíz de `app/` porque debe
capturar también las rutas que no caen dentro de este grupo.

Ver `website/README.md` para el detalle completo de la estructura y el
roadmap del proyecto.
