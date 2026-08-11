import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Subida de imágenes al bucket "gallery" de Supabase Storage.
 *
 * Se hace en el servidor y no directamente desde el navegador para que la
 * escritura viaje con la sesión verificada del administrador: la política de
 * Storage solo permite INSERT al rol `authenticated`, y aquí `getUser()`
 * confirma el JWT contra el servidor de Auth antes de tocar el bucket.
 *
 * Devuelve la URL pública definitiva, que el editor de galería guarda dentro
 * del jsonb `gallery` de la fila correspondiente.
 */

const BUCKET = "gallery";
const MAX_BYTES = 10 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

const FOLDERS = new Set(["alojamientos", "experiencias", "sitio"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Tu sesión expiró. Vuelve a entrar al panel." },
      { status: 401 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer el archivo enviado." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No se recibió ninguna imagen." },
      { status: 400 },
    );
  }

  const extension = EXTENSIONS[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Formato no admitido. Usa JPG, PNG, WebP o AVIF." },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "La imagen supera los 10 MB. Comprímela antes de subirla." },
      { status: 413 },
    );
  }

  const rawFolder = String(form.get("folder") ?? "");
  const folder = FOLDERS.has(rawFolder) ? rawFolder : "sitio";

  // Nombre opaco: evita colisiones y no expone el nombre original del archivo
  // (que a veces trae rutas o datos del equipo del cliente).
  const stamp = new Date().toISOString().slice(0, 10);
  const unique = globalThis.crypto.randomUUID().slice(0, 8);
  const path = `${folder}/${stamp}-${unique}.${extension}`;

  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    // Un año: el nombre es único, así que el archivo nunca cambia de contenido.
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    console.error("[admin] error subiendo a Storage:", error.message);
    return NextResponse.json(
      { error: `No se pudo subir la imagen: ${error.message}` },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl, path });
}
