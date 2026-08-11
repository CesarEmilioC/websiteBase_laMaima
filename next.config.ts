import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Fotos del sitio Wix actual. Hoy las servimos desde /public/images
      // (descargadas), pero se deja habilitado por si alguna galería apunta
      // temporalmente al CDN de Wix mientras llegan las fotos definitivas.
      { protocol: "https", hostname: "static.wixstatic.com" },
      // Supabase Storage: destino final de las imágenes que suba el cliente
      // desde el panel de administración.
      { protocol: "https", hostname: "mauolzwhergekdvigmaf.supabase.co" },
    ],
  },
};

export default nextConfig;
