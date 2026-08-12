"use client";

import { useRef, useState } from "react";

import { INPUT_CLASS } from "./ui";

/**
 * Campo de imagen para el CRUD de contenido del sitio (`/admin/contenido`).
 *
 * A diferencia de `GalleryEditor` (una lista de fotos), este campo guarda UNA
 * sola dirección en un input oculto `name`, con:
 *   1. Miniatura de la imagen actual.
 *   2. Subida al bucket "gallery" contra /admin/api/gallery/upload (misma
 *      ruta que usa el editor de galería), carpeta fija "sitio".
 *   3. Un campo para pegar una URL externa.
 *
 * El valor que viaja al servidor es siempre el string de la URL vigente.
 */

type Props = {
  name: string;
  initialUrl: string;
};

const MAX_BYTES = 10 * 1024 * 1024;

export function ImageField({ name, initialUrl }: Props) {
  const [url, setUrl] = useState(initialUrl);
  const [pasteValue, setPasteValue] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function applyUrl(next: string) {
    setUrl(next);
    setPasteValue(next);
    setBroken(false);
  }

  function applyPasted() {
    const value = pasteValue.trim();
    if (!value) return;
    if (!/^https?:\/\//i.test(value) && !value.startsWith("/")) {
      setError(
        "La dirección debe empezar por https:// (o por / si la imagen ya está en el sitio).",
      );
      return;
    }
    setError(null);
    applyUrl(value);
  }

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    setError(null);

    if (file.size > MAX_BYTES) {
      setError(`"${file.name}" pesa más de 10 MB. Comprímela antes de subirla.`);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", "sitio");

      const response = await fetch("/admin/api/gallery/upload", {
        method: "POST",
        body,
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          typeof (payload as { error?: unknown }).error === "string"
            ? (payload as { error: string }).error
            : "No se pudo subir la imagen.";
        throw new Error(message);
      }

      const newUrl =
        typeof payload === "object" &&
        payload !== null &&
        typeof (payload as { url?: unknown }).url === "string"
          ? (payload as { url: string }).url
          : null;

      if (!newUrl) {
        throw new Error(
          "No se pudo completar la subida. Es posible que tu sesión haya expirado: recarga la página y vuelve a entrar.",
        );
      }

      applyUrl(newUrl);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo subir la imagen.",
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />

      <div className="flex flex-wrap items-start gap-3.5 rounded-card bg-black/[0.025] p-3 sm:flex-nowrap">
        <div className="relative h-[120px] w-[120px] shrink-0 overflow-hidden rounded-xl bg-black/10">
          {url && !broken ? (
            // <img> y no next/image: las direcciones externas que se peguen
            // (Cloudinary u otro CDN) no están en la lista blanca de
            // next.config.ts y el optimizador las rechazaría.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setBroken(true)}
              onLoad={() => setBroken(false)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-2 text-center text-[0.6875rem] leading-snug text-ink-muted">
              {url ? "No se pudo cargar" : "Sin imagen"}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          {error && (
            <p className="rounded-2xl bg-red-600/8 px-3 py-2 text-[0.75rem] font-medium text-red-800 ring-1 ring-red-600/20">
              {error}
            </p>
          )}

          <div>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              disabled={uploading}
              onChange={(event) => void upload(event.target.files)}
              className="block w-full text-[0.8125rem] text-ink-muted file:mr-3 file:rounded-full file:border-0 file:bg-forest-600 file:px-4 file:py-2 file:text-[0.8125rem] file:font-semibold file:text-white hover:file:bg-forest-700"
            />
            {uploading && (
              <p className="mt-1.5 text-[0.75rem] font-medium text-forest-700">
                Subiendo…
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={pasteValue}
              onChange={(event) => setPasteValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyPasted();
                }
              }}
              placeholder="O pega una dirección https://…"
              className={`${INPUT_CLASS} py-2 text-[0.8125rem]`}
            />
            <button
              type="button"
              onClick={applyPasted}
              className="shrink-0 rounded-2xl bg-black/[0.06] px-4 text-[0.8125rem] font-semibold text-ink transition-colors hover:bg-black/[0.1]"
            >
              Usar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
