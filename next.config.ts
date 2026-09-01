import type { NextConfig } from "next";

/**
 * Host del proyecto de Supabase. Todas las fotos editables del sitio se sirven
 * desde el bucket público "gallery" de su Storage, así que su dominio tiene que
 * estar en la lista blanca del optimizador de imágenes de Next.
 */
const supabaseHostname = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "https://ausqyfdglyxapeszkrck.supabase.co",
).hostname;

/**
 * Redirecciones 301 desde las direcciones del sitio anterior (Wix).
 *
 * El dominio lamaima.com lleva años publicado y esas direcciones tienen
 * historial y enlaces entrantes. Si al cambiar de sitio devolvieran 404, ese
 * historial se pierde: una 301 se lo traspasa a la página nueva.
 *
 * Están ACTIVAS desde ya —ninguna choca con una ruta real del sitio nuevo— y
 * son permanentes (`permanent: true` = 308, que Google trata igual que la 301
 * y conserva el método). Cuando el dominio apunte a Vercel empiezan a
 * trabajar solas.
 *
 * Si aparecen más direcciones antiguas en Search Console ("Páginas" →
 * "No encontradas (404)"), se añaden aquí. Ver README, "SEO al publicar".
 */
const wixRedirects = [
  // Listado de alojamientos (Wix lo tenía en singular).
  { source: "/alojamiento", destination: "/alojamientos" },
  { source: "/alojamiento/:slug", destination: "/alojamientos" },
  // Reservas.
  // ---------------------------------------------------------------------
  // OJO: `/reservar` YA NO SE REDIRIGE. Aquí había una 301 a `/alojamientos`
  // heredada de cuando el motor solo vivía dentro de cada ficha; ahora
  // `/reservar` es una página real del sitio (selector de casa + calendario) y
  // una redirección se la comería antes de que Next llegara a renderizarla.
  // Las redirecciones de `next.config` ganan SIEMPRE a las rutas del App
  // Router, así que esto no habría fallado con un error visible: la página
  // nueva simplemente no existiría.
  //
  // Es, además, el destino que la dirección del Wix quería decir: quien
  // guardó `lamaima.com/reservar` en favoritos buscaba reservar, no un
  // catálogo. Lo mismo vale para `/book-online`, que era su versión en inglés.
  { source: "/book-online", destination: "/reservar" },
  // El calendario del Wix era una pantalla de disponibilidad: su equivalente
  // es el motor, no el listado.
  { source: "/booking-calendar", destination: "/reservar" },
  { source: "/booking-calendar/:path*", destination: "/reservar" },
  // Tarifas: hoy cada ficha publica su propia tabla por ocupación.
  { source: "/plans-pricing", destination: "/alojamientos" },
  // Contacto y "nosotros": secciones de la portada.
  { source: "/contacto", destination: "/#contacto" },
  { source: "/contact", destination: "/#contacto" },
  { source: "/nosotros", destination: "/#reserva-natural" },
  { source: "/about", destination: "/#reserva-natural" },
  // Experiencias y galería.
  { source: "/experiencia", destination: "/experiencias" },
  { source: "/galeria", destination: "/alojamientos" },
] as const;

const nextConfig: NextConfig = {
  /**
   * Sin barra final, que es el valor por defecto y el que ya usan los
   * canónicos y el sitemap. Se declara explícitamente porque cambiarlo
   * duplicaría todas las direcciones del sitio.
   */
  trailingSlash: false,

  async redirects() {
    return wixRedirects.map((rule) => ({ ...rule, permanent: true }));
  },

  images: {
    formats: ["image/avif", "image/webp"],

    /**
     * ---------------------------------------------------------------------
     * PRESUPUESTO DE TRANSFORMACIONES
     * ---------------------------------------------------------------------
     * Vercel factura el optimizador por *imagen transformada*, y una "imagen
     * transformada" es cada combinación distinta de (archivo × ancho ×
     * calidad × formato) que alguien llegue a pedir. Con las listas por
     * defecto de Next —8 deviceSizes y 8 imageSizes— una sola fotografía
     * puede generar decenas de variantes, y este sitio sirve 76 fotos.
     *
     * Las dos listas de abajo recortan el espacio de variantes a los anchos
     * que el diseño realmente usa. La regla al tocarlas: un ancho solo entra
     * si algún `sizes` del sitio lo pide de verdad; sobra cualquiera que
     * únicamente exista "por si acaso".
     */

    /**
     * Anchos para las imágenes que ocupan un porcentaje del viewport
     * (`sizes` con `vw`, típicamente `100vw`). Seis escalones cubren el
     * parque real de pantallas sin escalones intermedios que solo duplican
     * el recuento:
     *   390  — iPhone y la mayoría de móviles (es el ancho con el que se
     *          verifica el sitio en móvil).
     *   640  — móviles grandes y tablets en vertical.
     *   768  — tablets.
     *   1080 — portátiles.
     *   1280 — el ancho de referencia del diseño de escritorio.
     *   1920 — pantallas grandes y Retina de portátil.
     * Fuera quedan 750, 828, 1200, 2048 y 3840: sus pantallas reciben el
     * escalón inmediatamente superior, que se ve igual y ya está en caché.
     */
    deviceSizes: [390, 640, 768, 1080, 1280, 1920],

    /**
     * Anchos para las imágenes de tamaño fijo (`sizes` en píxeles): los
     * logotipos del encabezado y el pie, las miniaturas del selector de
     * casa y las tarjetas. El `sizes` más pequeño del sitio es de 36 px y el
     * mayor de esta familia es de 384 px, así que cuatro escalones bastan.
     */
    imageSizes: [64, 128, 256, 384],

    /**
     * 31 días. Las fotos del sitio NO se editan en caliente: el panel no
     * sobrescribe un archivo, sube uno nuevo con otra ruta y guarda la
     * dirección nueva en la base. Es decir, una URL de imagen es inmutable
     * en la práctica, así que una caché corta no protege de nada y sí
     * obliga a re-transformar lo mismo cada pocos días. Alargarla es la
     * palanca que más baja el recuento mensual.
     */
    minimumCacheTTL: 2678400,

    /**
     * Calidades permitidas por el optimizador. Next exige declararlas desde la
     * 15.5: cualquier `quality` que no esté en esta lista se rechaza (para que
     * nadie pueda pedir mil variantes distintas de la misma foto por URL).
     *
     *   90 — SOLO el visor de galería a pantalla completa. Ahí la fotografía
     *        se ve al ancho entero de la ventana y con el ojo puesto en ella:
     *        el follaje, que es lo que más abunda en este material, es
     *        justamente el patrón que peor encaja un JPEG a 75 (el ruido de
     *        alta frecuencia se emborrona en manchas). Es una imagen que el
     *        visitante ha pedido ver, no algo que se le sirve de paso, así que
     *        el peso extra está justificado. Los originales del bucket están a
     *        2400 px con calidad 82-85: pedir 90 al optimizador no inventa
     *        detalle, pero deja de destruir el que hay.
     *   75 — por defecto. La portada, las bandas de encabezado y la galería de
     *        la ficha, que son las imágenes que marcan el LCP de su página.
     *   68 — fotografía que SIEMPRE queda por debajo del pliegue (zigzag de la
     *        portada, tarjetas, franja de Instagram, galería de "Sobre la
     *        reserva"). Pesa un tercio menos y a ese tamaño no se distingue.
     */
    qualities: [68, 75, 90],
    remotePatterns: [
      // Supabase Storage: origen de TODAS las fotos del sitio (galerías de
      // alojamientos y experiencias, portada y banderas de sección). El cliente
      // las reemplaza desde el panel sin tocar el código.
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      },
      // Cloudinary: previsto en el roadmap para cuando el cliente quiera servir
      // las fotos desde un CDN propio. El editor de galería ya admite pegar
      // direcciones externas, así que se deja habilitado de antemano.
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
