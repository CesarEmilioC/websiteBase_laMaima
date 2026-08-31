/**
 * Constantes del sitio: identidad, contacto y redes de La Maima.
 *
 * `contact`, `social` y `maps` se mantienen en código porque son el FALLBACK
 * de `getContactInfo()` (`src/lib/content.ts`): el panel `/admin/contenido`
 * edita la fila `contact` de `site_content`, pero el header, el footer, el
 * botón de WhatsApp y el JSON-LD deben renderizar SIEMPRE, incluso si esa
 * fila no existe todavía, viene incompleta o la consulta a Supabase falla.
 */
import { dict } from "./i18n";
import { localePath, type Locale } from "./i18n/config";

export const SITE = {
  name: "La Maima",
  legalName: "La Maima — Hotel Campestre",
  tagline: "La naturaleza a tu alcance",
  /**
   * Descripción canónica del sitio: la de la portada, la del `og:description`
   * y la del JSON-LD. Mide 152 caracteres —Google recorta a partir de unos
   * 160— y empieza por las dos cosas que se buscan ("hotel campestre",
   * "Dapa"), porque la primera línea es la que sobrevive en móvil.
   */
  description:
    "Hotel campestre y reserva natural en el Km 12 vía a Dapa, Yumbo: seis casas y cabañas entre 30 años de bosque rehabilitado, a menos de una hora de Cali.",

  /**
   * La misma descripción en inglés, con la misma disciplina: por debajo de 160
   * caracteres y empezando por lo que se busca ("country hotel", "Dapa").
   */
  descriptionEn:
    "Country hotel and nature reserve on the Dapa road, Yumbo: six houses and cabins in 30 years of restored forest, less than an hour from Cali, Colombia.",

  /** Titular de la portada en inglés (el español lo edita el panel). */
  taglineEn: "Nature within your reach",

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

  /**
   * Condiciones de estadía del documento oficial del cliente. Están aquí
   * porque las publica el JSON-LD (`checkinTime`, `checkoutTime`,
   * `petsAllowed`, `smokingAllowed`) además de leerse en los términos: si
   * mañana cambia el horario, tiene que cambiar en un solo sitio.
   *
   * Las horas van en formato de 24 h, que es lo que espera schema.org.
   */
  stay: {
    checkIn: "15:00",
    checkOut: "13:00",
    petsAllowed: true,
    smokingAllowed: false,
    /** Total de casas y cabañas publicadas. */
    units: 6,
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

/* ---------------------------------------------------------------------------
 * Navegación y documentos legales
 * -------------------------------------------------------------------------
 * Las rutas se declaran UNA sola vez, en su forma canónica (la española, sin
 * prefijo), y las funciones de abajo las traducen al árbol del idioma que toque
 * con `localePath()`. Ningún componente compone direcciones de idioma a mano:
 * es la única forma de que las dos versiones del sitio no se desincronicen
 * cuando mañana se añada una sección.
 *
 * Las ETIQUETAS no viven aquí sino en el diccionario (`@/lib/i18n`), porque son
 * texto de interfaz como cualquier otro.
 */

/** Destinos de la navegación principal, en orden. */
export const NAV_ITEMS = [
  { path: "/", key: "home" },
  { path: "/alojamientos", key: "accommodations" },
  { path: "/experiencias", key: "experiences" },
  { path: "/#contacto", key: "contact" },
] as const;

export type NavKey = (typeof NAV_ITEMS)[number]["key"];

/** Navegación principal ya resuelta para un idioma (header, menú y pie). */
export function navLinks(locale: Locale): { href: string; label: string }[] {
  const t = dict(locale);
  return NAV_ITEMS.map((item) => ({
    href: localePath(locale, item.path),
    label: t.nav[item.key],
  }));
}

/**
 * Documentos legales del sitio.
 *
 * No son opcionales: Wompi (y cualquier pasarela colombiana) exige que el
 * comercio publique política de tratamiento de datos, términos de la
 * transacción y política de cancelación/reembolso antes de aprobar la cuenta.
 * Además dan confianza al huésped y aportan páginas indexables al SEO.
 *
 * `label` es el título completo (encabezado de la página y `title` del
 * metadata); `short` es la versión corta de la fila del pie. Los dos salen del
 * diccionario, así que el documento se titula en el idioma de la página.
 *
 * Las direcciones (`/legal/privacidad`…) se mantienen en ESPAÑOL también en el
 * árbol inglés (`/en/legal/privacidad`). Es a propósito: son las direcciones
 * que ya están publicadas y enlazadas desde la pasarela de pagos y desde los
 * correos, y un espejo con las mismas rutas hace que el `hreflang` de cada
 * documento sea trivial de verificar (misma cola, distinto prefijo).
 */
export const LEGAL_DOCS = [
  { path: "/legal/privacidad", key: "privacy" },
  { path: "/legal/terminos", key: "terms" },
  { path: "/legal/cancelacion", key: "cancellation" },
] as const;

export type LegalKey = (typeof LEGAL_DOCS)[number]["key"];

export type LegalLink = {
  /** Ruta canónica en español, sin prefijo de idioma. */
  path: string;
  /** Ruta real dentro del árbol del idioma pedido. */
  href: string;
  key: LegalKey;
  /** Título completo del documento. */
  label: string;
  /** Versión corta, para la fila del pie. */
  short: string;
};

/** Los tres documentos legales resueltos para un idioma. */
export function legalLinks(locale: Locale): LegalLink[] {
  const t = dict(locale);
  return LEGAL_DOCS.map((doc) => ({
    path: doc.path,
    href: localePath(locale, doc.path),
    key: doc.key,
    label: t.legal.links[doc.key],
    short: t.legal.short[doc.key],
  }));
}

/** Un documento legal concreto, por clave. */
export function legalLink(key: LegalKey, locale: Locale): LegalLink {
  return legalLinks(locale).find((doc) => doc.key === key) as LegalLink;
}

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
  if (/^https?:\/\//i.test(url)) return url;
  // La portada es "/" en el código pero su dirección canónica no lleva barra
  // final: si la miga de pan publicara ".../" y el `<link rel=canonical>"
  // ".../", serían dos formas distintas de nombrar la misma página.
  if (url === "/") return SITE.url;
  return `${SITE.url}${url}`;
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
