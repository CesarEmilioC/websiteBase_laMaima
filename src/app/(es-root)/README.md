# Árbol `(es-root)` — el sitio en español

Rutas públicas en **español**, que viven en la raíz del dominio. Los paréntesis
crean un *route group* de Next.js: no agregan segmento a la URL, así que
`(es-root)/(site)/alojamientos/page.tsx` sigue siendo `/alojamientos`.

Que el español no lleve prefijo (`/alojamientos`, no `/es/alojamientos`) es la
condición de partida del sitio bilingüe: esas direcciones ya están indexadas y
son el destino de las redirecciones 301 del Wix anterior. El inglés es un espejo
exacto bajo `/en` (ver `src/app/en/`).

```
src/app/(es-root)/
├── layout.tsx                # LAYOUT RAÍZ: <html lang="es-CO">, fuentes,
│                             #   globals.css y metadatos de marca
├── not-found.tsx             # 404 de la casa (sin nav ni pie)
├── [...ruta]/page.tsx        # comodín: manda a esa 404 cualquier dirección
│                             #   que no exista (ver la nota del archivo)
└── (site)/                   # armazón público
    ├── layout.tsx            #   PublicShell: isla de nav + pie + WhatsApp
    │                         #   + JSON-LD del negocio
    ├── page.tsx              #   Home
    ├── alojamientos/page.tsx, alojamientos/[slug]/page.tsx
    ├── experiencias/page.tsx
    └── legal/{privacidad,terminos,cancelacion}/page.tsx
```

## Por qué hay dos niveles de layout

`layout.tsx` es el layout **raíz** de este árbol: pinta `<html>` y `<body>`. Hay
tres en el proyecto —este, el de `app/en/` y el de `app/admin/`— porque solo un
layout raíz puede pintar `<html>`, y cada árbol necesita declarar su propio
`lang`. La nota larga está en `src/components/root-document.tsx`.

`(site)/layout.tsx` es el que aporta la cabecera y el pie. Está un nivel más
abajo a propósito: así `not-found.tsx` y el comodín, que son sus hermanos y no
sus hijos, se pintan a pantalla completa sin nav ni pie, como corresponde a una
página de error.

## Las páginas no tienen cuerpo aquí

Cada `page.tsx` de este árbol son tres líneas: importa el componente de
`src/components/pages/` y lo llama con `locale="es"`. El maquetado, las
consultas y los metadatos existen UNA sola vez y los comparten los dos idiomas
—`app/en/(site)/page.tsx` llama al mismo componente con `locale="en"`—, que es
lo que evita el problema clásico de los sitios bilingües: dos copias de la misma
página que a los dos meses ya no dicen lo mismo.

Todas son Server Components y leen de Supabase con el cliente público
(`@/lib/supabase/public`), que no toca cookies para que Next pueda generarlas
estáticamente y revalidarlas con ISR (`export const revalidate`).

Ver `website/README.md` para el detalle completo de la estructura y el roadmap.
