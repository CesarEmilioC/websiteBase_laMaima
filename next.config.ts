import type { NextConfig } from "next";

/**
 * Host del proyecto de Supabase. Todas las fotos editables del sitio se sirven
 * desde el bucket público "gallery" de su Storage, así que su dominio tiene que
 * estar en la lista blanca del optimizador de imágenes de Next.
 */
const supabaseHostname = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "https://mauolzwhergekdvigmaf.supabase.co",
).hostname;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
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
