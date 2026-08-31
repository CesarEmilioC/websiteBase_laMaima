# Árbol `en` — el sitio en inglés

Espejo exacto del árbol español bajo `/en`. Mismas rutas, mismos componentes,
mismos datos: lo único que cambia es el `locale` con el que se llaman.

```
src/app/en/
├── layout.tsx                # LAYOUT RAÍZ: <html lang="en">
├── not-found.tsx             # 404 en inglés
├── [...ruta]/page.tsx        # comodín de este árbol (gana al de la raíz por
│                             #   ser más específico: /en/... )
└── (site)/                   # mismo armazón, con locale="en"
    ├── layout.tsx            #   PublicShell locale="en"
    ├── page.tsx              #   /en
    ├── alojamientos/page.tsx, alojamientos/[slug]/page.tsx
    ├── experiencias/page.tsx
    └── legal/{privacidad,terminos,cancelacion}/page.tsx
```

## Detalles que conviene no perder

- **Las rutas legales se quedan en español** (`/en/legal/privacidad`). El espejo
  es más útil idéntico: cada par de páginas se corresponde una a una y el
  `hreflang` es trivial de comprobar (misma cola, distinto prefijo). Además esas
  direcciones ya circulan en enlaces y en los trámites de la pasarela de pagos.

- **Es un layout RAÍZ, no anidado.** Como no existe `app/layout.tsx`, este es el
  primero del árbol `/en` y por eso puede declarar `<html lang="en">`. El precio
  es que navegar entre árboles recarga la página entera; solo pasa al pulsar el
  conmutador de banderas, que es cuando una recarga se espera.

- **No hay páginas duplicadas.** Los `page.tsx` de aquí llaman a los mismos
  componentes de `src/components/pages/` que el árbol español. El contenido
  (nombres, descripciones, titulares) sale de las columnas `*_en` de Supabase y
  cae al español donde falte; los textos de interfaz, del diccionario tipado de
  `src/lib/i18n/`.

Ver `website/README.md` → “SEO al publicar / 0. El sitio es bilingüe”.
