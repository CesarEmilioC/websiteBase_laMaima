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
import { addDays, todayInBogota } from "./dates";
import type {
  Holiday,
  MinStayRule,
  RateConfig,
  RatePlan,
  RateTier,
  TierDayType,
} from "./pricing";
import { media, OG_IMAGE, SITE } from "./site";

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
  /**
   * Tarifa "Desde" de respaldo. La real se calcula con `lowestRate(tiers, …)`:
   * la columna solo manda cuando el alojamiento aún no tiene tabla publicada.
   */
  price_per_night_cop: number;
  price_note: string | null;
  amenities: string[];
  gallery: GalleryImage[];
  sort_order: number;

  /* --- Modelo de tarifas por ocupación (documento oficial del cliente) --- */
  /** Tabla de precios por número de huéspedes. Vacía = tarifa por confirmar. */
  tiers: RateTier[];
  extra_person_price_cop: number | null;
  extra_person_price_weekday_cop: number | null;
  breakfast_included: boolean;
  breakfast_price_cop: number | null;
  weekday_discount_pct: number | null;
  rate_note: string | null;
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
  /** Foto única de respaldo: se usa cuando `gallery` está vacía. */
  image: string;
  image_alt: string;
  /**
   * Galería que se pasa sola en la portada (ver `AboutGallery`). La edita el
   * cliente en `/admin/contenido` con el mismo editor que las galerías de
   * alojamientos y experiencias. Si queda vacía, la sección vuelve a mostrar
   * la foto única de `image`.
   */
  gallery: GalleryImage[];
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

/**
 * Imagen por defecto para OpenGraph/Twitter Card y el `image` del JSON-LD.
 *
 * Se edita en `/admin/contenido` (fila `site_content.seo`), con fallback a
 * `OG_IMAGE` de `src/lib/site.ts`. El ancho y el alto quedan fijos: son solo
 * una pista de tamaño para los lectores de OpenGraph y no vale la pena
 * pedirle esos números al administrador.
 */
export type OgImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

/**
 * Foto de cabecera de `/alojamientos` y `/experiencias` (la banda a sangre de
 * `PageHero`).
 *
 * Se editan en `/admin/contenido` (fila `site_content.listing_heroes`), con
 * fallback a las fotos que llevaban fijas en cada página. Antes de esta fila
 * solo se podían cambiar editando código y volviendo a desplegar.
 */
export type ListingHero = {
  image: string;
  image_alt: string;
};

export type ListingHeroes = {
  alojamientos: ListingHero;
  experiencias: ListingHero;
};

/**
 * Fotos de la franja de Instagram al final de la portada (`InstagramStrip`).
 *
 * Se editan en `/admin/contenido` (fila `site_content.instagram_strip`), con
 * el mismo `GalleryEditor` que la galería de "Sobre la reserva". El enlace y
 * el usuario que se muestran junto a las fotos NO viven aquí: salen de
 * `getContactInfo().social.instagram`, que ya se edita en la misma pantalla.
 */
export type InstagramStripContent = {
  gallery: GalleryImage[];
};

/**
 * Foto de fondo de la página 404 (`app/not-found.tsx`).
 *
 * Se edita en `/admin/contenido` (fila `site_content.not_found`), con
 * fallback a la foto que llevaba fija en el archivo. La imagen es puramente
 * decorativa (`aria-hidden`), así que el texto alternativo es opcional.
 */
export type NotFoundContent = {
  image: string;
  image_alt: string;
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
  gallery: [],
  stats: [
    { value: "30", label: "años de rehabilitación" },
    { value: "6", label: "casas y cabañas" },
    { value: "3", label: "tipos de bosque" },
  ],
};

/** Fotos de cabecera que llevaban fijas en cada página antes del panel. */
export const FALLBACK_LISTING_HEROES: ListingHeroes = {
  alojamientos: {
    image: media("alojamientos/mirador/2.jpg"),
    image_alt:
      "Ventanal del Mirador de La Maima abierto sobre el Valle del Cauca",
  },
  experiencias: {
    image: media("sitio/senderos.jpg"),
    image_alt:
      "Sendero con escalones de madera entre guaduas y árboles del bosque de La Maima, con una banca de guadua a un lado",
  },
};

/**
 * Seis fotos del bucket "gallery", elegidas por variedad de tema y de luz.
 * Eran la selección fija en código de `InstagramStrip` antes de esta fila.
 */
export const FALLBACK_INSTAGRAM_GALLERY: GalleryImage[] = [
  {
    url: media("sitio/sobre-la-reserva.jpg"),
    alt: "El Valle del Cauca visto desde los jardines de La Maima, con el cielo cubierto de nubes",
  },
  {
    url: media("alojamientos/mirador/2.jpg"),
    alt: "Ventanal panorámico del Mirador abierto sobre el bosque y el valle",
  },
  {
    url: media("experiencias/avistamiento-de-flora-y-fauna/1.jpg"),
    alt: "Tucancito esmeralda posado en una rama del bosque de la reserva",
  },
  {
    url: media("alojamientos/mirador/5.jpg"),
    alt: "Terraza del Mirador con una hamaca colgada frente a la montaña",
  },
  {
    url: media("experiencias/piscina-de-rio/1.jpg"),
    alt: "Quebrada de agua fría con pozos naturales entre las piedras del bosque",
  },
  {
    url: media("alojamientos/casa-maima/1.jpg"),
    alt: "Fachada de Casa Maima con su techo azul y el jardín de plantas tropicales",
  },
];

/** Foto de fondo de la página 404 antes de esta fila. */
export const FALLBACK_NOT_FOUND: NotFoundContent = {
  image: media("sitio/bosque.jpg"),
  image_alt: "",
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
  "id, slug, name, short_description, description, capacity, price_per_night_cop, price_note, amenities, gallery, sort_order, extra_person_price_cop, extra_person_price_weekday_cop, breakfast_included, breakfast_price_cop, weekday_discount_pct, rate_note";

const EXPERIENCE_COLUMNS =
  "id, slug, name, short_description, description, duration, capacity, price_cop, price_note, gallery, sort_order";

/**
 * Tramos de precio por ocupación, agrupados por alojamiento.
 *
 * Son datos de catálogo (públicos, sin RLS restrictiva) y caben de sobra en
 * una sola consulta: el sitio entero tiene menos de treinta tramos.
 */
const getRateTiersByAccommodation = cache(
  async (): Promise<Map<string, RateTier[]>> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("rate_tiers")
      .select("accommodation_id, guests, price_cop, day_type")
      .order("guests", { ascending: true });

    const grouped = new Map<string, RateTier[]>();
    if (error) {
      console.error("[content] getRateTiers:", error.message);
      return grouped;
    }

    for (const row of data ?? []) {
      const list = grouped.get(row.accommodation_id) ?? [];
      list.push({
        guests: row.guests,
        price_cop: row.price_cop,
        day_type: row.day_type as TierDayType,
      });
      grouped.set(row.accommodation_id, list);
    }
    return grouped;
  },
);

export const getAccommodations = cache(async (): Promise<Accommodation[]> => {
  const supabase = createPublicClient();
  const [{ data, error }, tiersByAccommodation] = await Promise.all([
    supabase
      .from("accommodations")
      .select(ACCOMMODATION_COLUMNS)
      .eq("visible", true)
      .order("sort_order", { ascending: true }),
    getRateTiersByAccommodation(),
  ]);

  if (error) {
    console.error("[content] getAccommodations:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    ...row,
    amenities: toStringList(row.amenities),
    gallery: toGallery(row.gallery),
    tiers: tiersByAccommodation.get(row.id) ?? [],
  }));
});

/**
 * Festivos de Colombia desde hoy en adelante.
 *
 * Se recortan al futuro porque el motor solo los usa para tipificar noches
 * reservables y para detectar puentes; los pasados solo engordarían la carga
 * útil que viaja al navegador. Se dejan tres días de margen hacia atrás para
 * que el puente que empieza este mismo fin de semana no se pierda.
 */
export const getHolidays = cache(async (): Promise<Holiday[]> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("holidays")
    .select("holiday_date, is_bridge")
    .gte("holiday_date", addDays(todayInBogota(), -3))
    .order("holiday_date", { ascending: true });

  if (error) {
    console.error("[content] getHolidays:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    date: row.holiday_date as string,
    is_bridge: Boolean(row.is_bridge),
  }));
});

const getMinStayRulesByAccommodation = cache(
  async (): Promise<Map<string, MinStayRule[]>> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("min_stay_rules")
      .select("accommodation_id, label, rule_type, date_from, date_to, min_nights")
      .order("sort", { ascending: true });

    const grouped = new Map<string, MinStayRule[]>();
    if (error) {
      console.error("[content] getMinStayRules:", error.message);
      return grouped;
    }

    for (const row of data ?? []) {
      const list = grouped.get(row.accommodation_id) ?? [];
      list.push({
        label: row.label,
        rule_type: row.rule_type as MinStayRule["rule_type"],
        date_from: row.date_from,
        date_to: row.date_to,
        min_nights: row.min_nights,
      });
      grouped.set(row.accommodation_id, list);
    }
    return grouped;
  },
);

/**
 * Paquetes vigentes (`rate_plans`). Hoy la tabla está vacía a propósito: es la
 * base para los que el cliente cree más adelante ("San Valentín" y compañía).
 * Los de `accommodation_id` nulo valen para todos los alojamientos.
 */
const getRatePlans = cache(
  async (): Promise<{ accommodationId: string | null; plan: RatePlan }[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("rate_plans")
      .select(
        "accommodation_id, name, description, date_from, date_to, price_per_night_cop, guests_included, sort",
      )
      .eq("active", true)
      .gte("date_to", addDays(todayInBogota(), -1))
      .order("sort", { ascending: true });

    if (error) {
      console.error("[content] getRatePlans:", error.message);
      return [];
    }

    return (data ?? []).map((row) => ({
      accommodationId: row.accommodation_id,
      plan: {
        name: row.name,
        description: row.description,
        date_from: row.date_from as string,
        date_to: row.date_to as string,
        price_per_night_cop: row.price_per_night_cop,
        guests_included: row.guests_included,
        sort: row.sort ?? 0,
        // Los planes sin alojamiento valen para todos, y por eso pierden
        // contra uno hecho para esta cabaña (ver `comparePlans`).
        appliesToAll: row.accommodation_id === null,
      },
    }));
  },
);

/**
 * Todo lo que el widget de reservas necesita para cotizar un alojamiento.
 *
 * Viaja con la página prerenderizada (son precios de catálogo, públicos), así
 * que el navegador puede recalcular el total mientras el huésped mueve fechas
 * y huéspedes sin pedirle nada al servidor.
 */
export const getRateConfig = cache(
  async (accommodation: Accommodation): Promise<RateConfig> => {
    const [holidays, rulesByAccommodation, plans] = await Promise.all([
      getHolidays(),
      getMinStayRulesByAccommodation(),
      getRatePlans(),
    ]);

    return {
      capacity: accommodation.capacity,
      basePriceCop: accommodation.price_per_night_cop,
      tiers: accommodation.tiers,
      extraPersonPriceCop: accommodation.extra_person_price_cop,
      extraPersonPriceWeekdayCop: accommodation.extra_person_price_weekday_cop,
      breakfastIncluded: accommodation.breakfast_included,
      breakfastPriceCop: accommodation.breakfast_price_cop,
      weekdayDiscountPct: accommodation.weekday_discount_pct,
      rateNote: accommodation.rate_note,
      minStayRules: rulesByAccommodation.get(accommodation.id) ?? [],
      ratePlans: plans
        .filter(
          (entry) =>
            entry.accommodationId === null ||
            entry.accommodationId === accommodation.id,
        )
        .map((entry) => entry.plan),
      holidays,
    };
  },
);

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
    gallery: toGallery(merged.gallery),
    stats: Array.isArray(merged.stats) ? merged.stats : FALLBACK_ABOUT.stats,
  };
});

/**
 * Fotos que muestra la sección "Sobre la reserva" de la portada.
 *
 * La galería manda; si el cliente la deja vacía desde el panel, se cae con
 * elegancia a la foto única de siempre en vez de dejar un hueco.
 */
export function aboutImages(about: HomeAbout): GalleryImage[] {
  if (about.gallery.length > 0) return about.gallery;
  if (!about.image) return [];
  return [{ url: about.image, alt: about.image_alt }];
}

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

export const getOgImage = cache(async (): Promise<OgImage> => {
  const value = await getSiteContent("seo");
  if (!value) return OG_IMAGE;
  return {
    url: textOr(value, "image", OG_IMAGE.url),
    alt: textOr(value, "image_alt", OG_IMAGE.alt),
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
  };
});

/** Lectura segura de una sub-fila `{ image, image_alt }` dentro de un jsonb. */
function toListingHero(value: unknown, fallback: ListingHero): ListingHero {
  const source =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : null;
  return {
    image: textOr(source, "image", fallback.image),
    image_alt: textOr(source, "image_alt", fallback.image_alt),
  };
}

/** Cabeceras de `/alojamientos` y `/experiencias` (`site_content.listing_heroes`). */
export const getListingHeroes = cache(async (): Promise<ListingHeroes> => {
  const value = await getSiteContent("listing_heroes");
  return {
    alojamientos: toListingHero(
      value?.alojamientos,
      FALLBACK_LISTING_HEROES.alojamientos,
    ),
    experiencias: toListingHero(
      value?.experiencias,
      FALLBACK_LISTING_HEROES.experiencias,
    ),
  };
});

/**
 * Fotos de la franja de Instagram de la portada (`site_content.instagram_strip`).
 *
 * Igual que `aboutImages()`: si el panel deja la galería vacía, se cae con
 * elegancia a la selección fija original en vez de dejar la franja sin fotos.
 */
export const getInstagramGallery = cache(async (): Promise<GalleryImage[]> => {
  const value = await getSiteContent("instagram_strip");
  const gallery = toGallery(value?.gallery);
  return gallery.length > 0 ? gallery : FALLBACK_INSTAGRAM_GALLERY;
});

/** Foto de fondo de la página 404 (`site_content.not_found`). */
export const getNotFoundContent = cache(async (): Promise<NotFoundContent> => {
  const value = await getSiteContent("not_found");
  if (!value) return FALLBACK_NOT_FOUND;
  return {
    image: textOr(value, "image", FALLBACK_NOT_FOUND.image),
    image_alt: textOr(value, "image_alt", FALLBACK_NOT_FOUND.image_alt),
  };
});

/* ---------------------------------------------------------------------------
 * Fechas de última modificación (sitemap)
 * ------------------------------------------------------------------------- */

/**
 * Cuándo cambió por última vez lo que se ve en cada página.
 *
 * El sitemap publicaba `new Date()` en las doce entradas, o sea la hora del
 * último despliegue: le decía al buscador que las páginas legales cambian cada
 * vez que se toca una coma del código. Un `lastmod` que miente es peor que no
 * ponerlo —Google deja de fiarse de él para todo el sitio—, así que sale de las
 * columnas `updated_at` que ya mantiene el panel.
 *
 * La fecha de una ficha es la más reciente entre la del alojamiento y la de su
 * tabla de tarifas: cambiar un precio cambia la página aunque el texto siga
 * igual.
 */
export type LastModified = {
  /** Por slug de alojamiento. */
  accommodations: Map<string, Date>;
  /** Lo más reciente de todos los alojamientos y sus tarifas. */
  accommodationsLatest: Date | null;
  /** Lo más reciente de las experiencias. */
  experiences: Date | null;
  /** Lo más reciente del contenido editable de la portada. */
  siteContent: Date | null;
};

/** Mayor de varias fechas, ignorando las nulas. */
function latest(...dates: (Date | null | undefined)[]): Date | null {
  const valid = dates.filter((date): date is Date => date instanceof Date);
  if (valid.length === 0) return null;
  return new Date(Math.max(...valid.map((date) => date.getTime())));
}

function toDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const getLastModified = cache(async (): Promise<LastModified> => {
  const supabase = createPublicClient();

  const [accommodations, tiers, experiences, content] = await Promise.all([
    supabase
      .from("accommodations")
      .select("id, slug, updated_at")
      .eq("visible", true),
    supabase.from("rate_tiers").select("accommodation_id, updated_at"),
    supabase.from("experiences").select("updated_at").eq("visible", true),
    supabase.from("site_content").select("updated_at"),
  ]);

  const tiersByAccommodation = new Map<string, Date>();
  for (const row of tiers.data ?? []) {
    const date = toDate(row.updated_at);
    if (!date) continue;
    const current = tiersByAccommodation.get(row.accommodation_id);
    tiersByAccommodation.set(
      row.accommodation_id,
      latest(current, date) ?? date,
    );
  }

  const bySlug = new Map<string, Date>();
  for (const row of accommodations.data ?? []) {
    const date = latest(toDate(row.updated_at), tiersByAccommodation.get(row.id));
    if (date) bySlug.set(row.slug, date);
  }

  return {
    accommodations: bySlug,
    accommodationsLatest: latest(...bySlug.values()),
    experiences: latest(...(experiences.data ?? []).map((row) => toDate(row.updated_at))),
    siteContent: latest(...(content.data ?? []).map((row) => toDate(row.updated_at))),
  };
});

/** Primera imagen de la galería, con un placeholder seguro si viene vacía. */
export function coverImage(
  gallery: GalleryImage[],
  fallbackAlt: string,
): GalleryImage {
  return gallery[0] ?? { url: media("sitio/bosque.jpg"), alt: fallbackAlt };
}
