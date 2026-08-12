/**
 * Capa de acceso al contenido público (Supabase -> componentes de servidor).
 *
 * Todas las consultas usan el cliente público (sin cookies) para que las
 * páginas puedan generarse estáticamente y revalidarse con ISR. Ver
 * `src/lib/supabase/public.ts`.
 *
 * Cada consulta va envuelta en `cache()` de React: dentro de un mismo render,
 * varias llamadas a `getAccommodations()` reutilizan el mismo resultado.
 */
import { cache } from "react";
import { createPublicClient } from "./supabase/public";
import { media, SITE } from "./site";

/* ---------------------------------------------------------------------------
 * Tipos
 * ------------------------------------------------------------------------- */

export type GalleryImage = {
  url: string;
  alt: string;
};

export type Accommodation = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  capacity: number;
  price_per_night_cop: number;
  price_note: string | null;
  amenities: string[];
  gallery: GalleryImage[];
  sort_order: number;
};

export type Experience = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  duration: string | null;
  capacity: number | null;
  price_cop: number | null;
  price_note: string | null;
  gallery: GalleryImage[];
  sort_order: number;
};

export type HomeHero = {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  image: string;
  image_alt: string;
};

export type HomeAbout = {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  image: string;
  image_alt: string;
  stats: { value: string; label: string }[];
};

/**
 * Datos de contacto públicos: teléfono, dirección y redes.
 *
 * Se editan en `/admin/contenido` (fila `site_content.contact`) y con
 * fallback campo a campo a `SITE.contact` / `SITE.social` / `SITE.maps` en
 * `src/lib/site.ts`, para que el sitio nunca se quede sin estos datos aunque
 * la fila no exista todavía o venga incompleta.
 */
export type ContactInfo = {
  /** Solo dígitos con indicativo, listo para enlaces wa.me / tel:+ */
  whatsapp: string;
  phoneDisplay: string;
  phoneHref: string;
  street: string;
  locality: string;
  region: string;
  country: string;
  /** Dirección en una sola línea, para el footer y el JSON-LD */
  addressLine: string;
  social: {
    instagram: string;
    instagramHandle: string;
    facebook: string;
    facebookHandle: string;
  };
  maps: {
    url: string;
    /** El iframe embebido no se edita desde el panel: siempre viene de SITE. */
    embedUrl: string;
  };
};

/* ---------------------------------------------------------------------------
 * Fallbacks
 * ------------------------------------------------------------------------- */
// Si Supabase no responde durante un build, preferimos publicar el sitio con
// los textos por defecto antes que romper el despliegue. Los listados sí se
// devuelven vacíos (una tarjeta inventada sería peor que ninguna).

const FALLBACK_HERO: HomeHero = {
  eyebrow: "Reserva natural y hotel campestre",
  title: "La naturaleza a tu alcance",
  subtitle:
    "Seis casas y cabañas en medio de 30 años de bosque rehabilitado, a menos de una hora de Cali.",
  cta_label: "Ver alojamientos",
  cta_href: "/alojamientos",
  image: media("sitio/hero.jpg"),
  image_alt:
    "Cabaña de La Maima frente a la ladera de bosque nativo en las montañas de Dapa",
};

const FALLBACK_ABOUT: HomeAbout = {
  eyebrow: "Sobre la reserva",
  title: "Treinta años devolviéndole el bosque a la montaña",
  paragraphs: [
    "La Maima nació como un proyecto familiar de rehabilitación en las montañas de Dapa. Tres décadas después, la reserva combina bosque primario, secundario y terciario en la misma ladera.",
    "Sobre ese bosque construimos seis casas y cabañas independientes, cada una con cocineta y baño privado.",
  ],
  image: media("sitio/sobre-la-reserva.jpg"),
  image_alt: "Jardines de La Maima con vista abierta al Valle del Cauca",
  stats: [
    { value: "30", label: "años de rehabilitación" },
    { value: "6", label: "casas y cabañas" },
    { value: "3", label: "tipos de bosque" },
  ],
};

/* ---------------------------------------------------------------------------
 * Normalizadores (el jsonb de Postgres llega como `unknown`)
 * ------------------------------------------------------------------------- */

function toGallery(value: unknown): GalleryImage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const { url, alt } = item as Record<string, unknown>;
    if (typeof url !== "string" || url.length === 0) return [];
    return [{ url, alt: typeof alt === "string" ? alt : "" }];
  });
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

/** Texto no vacío de una clave del jsonb, o el valor por defecto. */
function textOr(
  source: Record<string, unknown> | null,
  key: string,
  fallback: string,
): string {
  const raw = source?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback;
}

/**
 * Deja solo dígitos, para construir enlaces `wa.me/` y `tel:+`.
 *
 * El panel ya guarda el WhatsApp limpio, pero esta fila también se puede
 * editar a mano (SQL, migraciones) sin pasar por esa validación, así que se
 * vuelve a normalizar aquí antes de usarlo.
 */
function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Acepta lo que el panel pueda guardar en "Instagram"/"Facebook" -- una URL
 * completa o solo el usuario (con o sin `@`) -- y devuelve tanto el enlace
 * como el texto corto para mostrar. `null` si no hay nada que normalizar.
 */
function normalizeSocialHandle(
  rawValue: string,
  host: "instagram.com" | "facebook.com",
): { url: string; handle: string } | null {
  const value = rawValue.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    try {
      const segment = new URL(value).pathname.split("/").filter(Boolean).pop();
      return { url: value, handle: segment ? `@${segment}` : value };
    } catch {
      return { url: value, handle: value };
    }
  }

  const handle = value.replace(/^[@/]+/, "").replace(/\/+$/, "");
  if (!handle) return null;
  return { url: `https://${host}/${handle}`, handle: `@${handle}` };
}

/* ---------------------------------------------------------------------------
 * Consultas
 * ------------------------------------------------------------------------- */

const ACCOMMODATION_COLUMNS =
  "id, slug, name, short_description, description, capacity, price_per_night_cop, price_note, amenities, gallery, sort_order";

const EXPERIENCE_COLUMNS =
  "id, slug, name, short_description, description, duration, capacity, price_cop, price_note, gallery, sort_order";

export const getAccommodations = cache(async (): Promise<Accommodation[]> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("accommodations")
    .select(ACCOMMODATION_COLUMNS)
    .eq("visible", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[content] getAccommodations:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    ...row,
    amenities: toStringList(row.amenities),
    gallery: toGallery(row.gallery),
  }));
});

export const getAccommodationBySlug = cache(
  async (slug: string): Promise<Accommodation | null> => {
    const all = await getAccommodations();
    return all.find((item) => item.slug === slug) ?? null;
  },
);

export const getExperiences = cache(async (): Promise<Experience[]> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("experiences")
    .select(EXPERIENCE_COLUMNS)
    .eq("visible", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[content] getExperiences:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    ...row,
    gallery: toGallery(row.gallery),
  }));
});

const getSiteContent = cache(
  async (key: string): Promise<Record<string, unknown> | null> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error(`[content] site_content("${key}"):`, error.message);
      return null;
    }

    const value = data?.value;
    return typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : null;
  },
);

export const getHomeHero = cache(async (): Promise<HomeHero> => {
  const value = await getSiteContent("home_hero");
  if (!value) return FALLBACK_HERO;
  return { ...FALLBACK_HERO, ...(value as Partial<HomeHero>) };
});

export const getHomeAbout = cache(async (): Promise<HomeAbout> => {
  const value = await getSiteContent("home_about");
  if (!value) return FALLBACK_ABOUT;
  const merged = { ...FALLBACK_ABOUT, ...(value as Partial<HomeAbout>) };
  return {
    ...merged,
    paragraphs: toStringList(merged.paragraphs).length
      ? toStringList(merged.paragraphs)
      : FALLBACK_ABOUT.paragraphs,
    stats: Array.isArray(merged.stats) ? merged.stats : FALLBACK_ABOUT.stats,
  };
});

export const getContactInfo = cache(async (): Promise<ContactInfo> => {
  const value = await getSiteContent("contact");

  const whatsapp =
    normalizePhoneDigits(textOr(value, "whatsapp", "")) || SITE.contact.whatsapp;
  const phoneDisplay = textOr(value, "phone_display", SITE.contact.phoneDisplay);
  const phoneHref = whatsapp ? `tel:+${whatsapp}` : SITE.contact.phoneHref;

  const street = textOr(value, "address", SITE.contact.street);
  const locality = textOr(value, "locality", SITE.contact.locality);
  const region = textOr(value, "region", SITE.contact.region);
  const country = textOr(value, "country", SITE.contact.country);
  const addressLine = [street, locality, region, country]
    .filter(Boolean)
    .join(", ");

  const instagram =
    normalizeSocialHandle(textOr(value, "instagram", ""), "instagram.com") ?? {
      url: SITE.social.instagram,
      handle: SITE.social.instagramHandle,
    };
  const facebook =
    normalizeSocialHandle(textOr(value, "facebook", ""), "facebook.com") ?? {
      url: SITE.social.facebook,
      handle: SITE.social.facebookHandle,
    };

  const mapsUrl = textOr(value, "maps_url", SITE.maps.url);

  return {
    whatsapp,
    phoneDisplay,
    phoneHref,
    street,
    locality,
    region,
    country,
    addressLine,
    social: {
      instagram: instagram.url,
      instagramHandle: instagram.handle,
      facebook: facebook.url,
      facebookHandle: facebook.handle,
    },
    maps: {
      url: mapsUrl,
      embedUrl: SITE.maps.embedUrl,
    },
  };
});

/** Primera imagen de la galería, con un placeholder seguro si viene vacía. */
export function coverImage(
  gallery: GalleryImage[],
  fallbackAlt: string,
): GalleryImage {
  return gallery[0] ?? { url: media("sitio/bosque.jpg"), alt: fallbackAlt };
}
