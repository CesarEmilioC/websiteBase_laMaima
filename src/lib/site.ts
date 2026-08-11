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

/** Imagen por defecto para OpenGraph / Twitter Cards. */
export const OG_IMAGE = {
  url: "/images/mirador-1.jpg",
  width: 3000,
  height: 2000,
  alt: "Cabaña de La Maima frente al bosque nativo en las montañas de Dapa",
} as const;
