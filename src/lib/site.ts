/**
 * Constantes del sitio: identidad, contacto y redes de La Maima.
 *
 * `contact`, `social` y `maps` se mantienen en código porque son el FALLBACK
 * de `getContactInfo()` (`src/lib/content.ts`): el panel `/admin/contenido`
 * edita la fila `contact` de `site_content`, pero el header, el footer, el
 * botón de WhatsApp y el JSON-LD deben renderizar SIEMPRE, incluso si esa
 * fila no existe todavía, viene incompleta o la consulta a Supabase falla.
 */

export const SITE = {
  name: "La Maima",
  legalName: "La Maima — Hotel Campestre",
  tagline: "La naturaleza a tu alcance",
  description:
    "Reserva natural y hotel campestre en el Km 12 Vía a Dapa, Yumbo (Valle del Cauca). Seis casas y cabañas entre 30 años de bosque en rehabilitación, a menos de una hora de Cali.",

  /** URL canónica de producción. Se sobreescribe con NEXT_PUBLIC_SITE_URL. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lamaima.com",

  contact: {
    /** Número en formato internacional sin signos, para enlaces wa.me */
    whatsapp: "573113082813",
    phoneDisplay: "+57 311 308 2813",
    phoneHref: "tel:+573113082813",
    street: "Km 12 Vía a Dapa",
    locality: "Yumbo",
    region: "Valle del Cauca",
    country: "Colombia",
    /** Dirección en una línea, para el footer y el JSON-LD */
    addressLine: "Km 12 Vía a Dapa, Yumbo, Valle del Cauca, Colombia",
  },

  /** Coordenadas aproximadas del corregimiento de Dapa (Yumbo). */
  geo: {
    latitude: 3.5347,
    longitude: -76.5583,
  },

  maps: {
    /** Enlace "Cómo llegar" */
    url: "https://www.google.com/maps/search/?api=1&query=La+Maima+Hotel+Campestre+Dapa+Yumbo",
    /** Iframe embebido (modo búsqueda pública, no requiere API key) */
    embedUrl:
      "https://maps.google.com/maps?q=La%20Maima%20Hotel%20Campestre%20Dapa%20Yumbo&t=&z=13&ie=UTF8&iwloc=&output=embed",
  },

  social: {
    instagram: "https://instagram.com/lamaima",
    instagramHandle: "@lamaima",
    facebook: "https://facebook.com/lamaimahotel",
    facebookHandle: "@lamaimahotel",
  },
} as const;

/** Navegación principal (header y footer). */
export const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/alojamientos", label: "Alojamientos" },
  { href: "/experiencias", label: "Experiencias" },
  { href: "/#contacto", label: "Contacto" },
] as const;

/**
 * Documentos legales del sitio.
 *
 * No son opcionales: Wompi (y cualquier pasarela colombiana) exige que el
 * comercio publique política de tratamiento de datos, términos de la
 * transacción y política de cancelación/reembolso antes de aprobar la cuenta.
 * Además dan confianza al huésped y aportan páginas indexables al SEO.
 *
 * `label` es el título completo (encabezado de la página y `title` del
 * metadata); `short` es la versión corta de la fila del pie.
 */
export const LEGAL_LINKS = [
  {
    href: "/legal/privacidad",
    label: "Política de privacidad y tratamiento de datos",
    short: "Privacidad",
  },
  {
    href: "/legal/terminos",
    label: "Términos y condiciones de reserva",
    short: "Términos",
  },
  {
    href: "/legal/cancelacion",
    label: "Política de cancelación y reembolsos",
    short: "Cancelaciones",
  },
] as const;

export type LegalLink = (typeof LEGAL_LINKS)[number];

/* ---------------------------------------------------------------------------
 * Imágenes
 * ------------------------------------------------------------------------- */

/**
 * TODAS las fotos del sitio viven en el bucket público "gallery" de Supabase
 * Storage, no en `/public`. Así el cliente puede reemplazar cualquiera de
 * ellas desde el panel de administración (o desde el propio Storage) sin
 * tocar el código ni volver a desplegar, y el panel nunca muestra rutas
 * locales que él no puede cambiar.
 *
 * En `/public` solo queda el logotipo, que es identidad de marca y no
 * contenido editable.
 */
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://mauolzwhergekdvigmaf.supabase.co";

export const MEDIA_BASE = `${SUPABASE_URL}/storage/v1/object/public/gallery`;

/** Dirección pública de una foto del bucket: `media("sitio/hero.jpg")`. */
export function media(path: string): string {
  return `${MEDIA_BASE}/${path}`;
}

/**
 * Convierte a dirección absoluta lo que los metadatos y el JSON-LD necesitan
 * servir con dominio completo. Las fotos del bucket ya son absolutas; las
 * rutas propias del sitio (`/algo`) se prefijan con el dominio canónico.
 */
export function absoluteUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${SITE.url}${url}`;
}

/**
 * Imagen por defecto para OpenGraph / Twitter Cards.
 *
 * `sitio/og.jpg` es un recorte dedicado a 1200x630 (la proporción 1.91:1 que
 * esperan WhatsApp, Facebook y X), no el hero: el hero es casi cuadrado en
 * móvil y las plataformas lo recortarían por el centro perdiendo la cabaña.
 * Las medidas de aquí se publican tal cual en `og:image:width/height`, así que
 * deben coincidir con el archivo real del bucket.
 */
export const OG_IMAGE = {
  url: media("sitio/og.jpg"),
  width: 1200,
  height: 630,
  alt: "La Maima, hotel campestre y reserva natural en Dapa, Yumbo",
} as const;
