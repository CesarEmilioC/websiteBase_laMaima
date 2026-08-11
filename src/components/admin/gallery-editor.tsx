"use client";

import { useRef, useState, useTransition } from "react";

import { INPUT_CLASS } from "./ui";
import type { GalleryImage } from "@/lib/admin/types";

/**
 * Editor de la galería de un alojamiento o de una experiencia.
 *
 * Dos formas de añadir imágenes:
 *   1. Subiéndolas al bucket "gallery" de Supabase Storage. La subida NO se
 *      hace desde el navegador con la clave anónima, sino contra el route
 *      handler /admin/api/gallery/upload, que usa el cliente de servidor con
 *      la sesión del administrador: así la política de Storage
 *      ("solo authenticated escribe") se aplica sobre un JWT verificado.
 *   2. Pegando una URL externa (el proyecto contempla mover las fotos a
 *      Cloudinary más adelante sin cambiar la forma del dato).
 *
 * La primera imagen de la lista es la PORTADA: es la que usan las tarjetas del
 * sitio público (`coverImage()` en @/lib/content).
 *
 * El valor que viaja al servidor es el JSON de la lista, en un input oculto.
 */

type Props = {
  name: string;
  initial: GalleryImage[];
  /** Carpeta dentro del bucket: "alojamientos" | "experiencias". */
  folder: string;
};

const MAX_BYTES = 10 * 1024 * 1024;

export function GalleryEditor({ name, initial, folder }: Props) {
  const [items, setItems] = useState<GalleryImage[]>(initial);
  const [externalUrl, setExternalUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  function update(next: GalleryImage[]) {
    startTransition(() => setItems(next));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  }

  function makeCover(index: number) {
    if (index === 0) return;
    const next = [...items];
    const [picked] = next.splice(index, 1);
    update([picked, ...next]);
  }

  function remove(index: number) {
    update(items.filter((_, i) => i !== index));
  }

  function setAlt(index: number, alt: string) {
    const next = [...items];
    next[index] = { ...next[index], alt };
    setItems(next);
  }

  function addExternal() {
    const url = externalUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) {
      setError(
        "La dirección debe empezar por https:// (o por / si la imagen ya está en el sitio).",
      );
      return;
    }
    setError(null);
    update([...items, { url, alt: "" }]);
    setExternalUrl("");
  }

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    const added: GalleryImage[] = [];
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_BYTES) {
          throw new Error(
            `"${file.name}" pesa más de 10 MB. Comprímela antes de subirla.`,
          );
        }
        const body = new FormData();
        body.append("file", file);
        body.append("folder", folder);

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

        const url =
          typeof payload === "object" &&
          payload !== null &&
          typeof (payload as { url?: unknown }).url === "string"
            ? (payload as { url: string }).url
            : null;

        if (!url) {
          // Sin JSON en una respuesta "correcta" lo habitual es que el
          // middleware haya redirigido al login por sesión caducada.
          throw new Error(
            "No se pudo completar la subida. Es posible que tu sesión haya expirado: recarga la página y vuelve a entrar.",
          );
        }
        added.push({ url, alt: "" });
      }

      setItems((current) => [...current, ...added]);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo subir la imagen.",
      );
      // Las que sí alcanzaron a subir se conservan: repetir la subida crearía
      // duplicados en el bucket.
      if (added.length) setItems((current) => [...current, ...added]);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(items)} />

      {error && (
        <p className="mb-3 rounded-2xl bg-red-600/8 px-4 py-2.5 text-[0.8125rem] font-medium text-red-800 ring-1 ring-red-600/20">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className="mb-4 rounded-2xl bg-black/[0.03] px-4 py-6 text-center text-[0.875rem] text-ink-muted">
          Todavía no hay imágenes. Sube una foto o pega una dirección.
        </p>
      ) : (
        <ul className="mb-4 space-y-2.5">
          {items.map((item, index) => (
            <li
              key={`${item.url}-${index}`}
              className="flex flex-wrap items-start gap-3 rounded-card bg-black/[0.025] p-2.5 sm:flex-nowrap"
            >
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-black/10">
                {/* <img> y no next/image: las direcciones externas que pegue el
                    cliente (Cloudinary u otro CDN) no están en la lista blanca
                    de next.config.ts y el optimizador las rechazaría. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {index === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-forest-600 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-white">
                    Portada
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.75rem] text-ink-muted" title={item.url}>
                  {item.url}
                </p>
                <input
                  type="text"
                  value={item.alt}
                  onChange={(event) => setAlt(index, event.target.value)}
                  placeholder="Descripción de la foto (accesibilidad y SEO)"
                  className={`${INPUT_CLASS} mt-1.5 py-2 text-[0.8125rem]`}
                />
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <IconButton
                  label="Subir en el orden"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                >
                  <path d="m6 14 6-6 6 6" />
                </IconButton>
                <IconButton
                  label="Bajar en el orden"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                >
                  <path d="m6 10 6 6 6-6" />
                </IconButton>
                <button
                  type="button"
                  onClick={() => makeCover(index)}
                  disabled={index === 0}
                  className="rounded-full px-2.5 py-1.5 text-[0.75rem] font-semibold text-forest-700 transition-colors hover:bg-forest-600/10 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Portada
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="rounded-full px-2.5 py-1.5 text-[0.75rem] font-semibold text-red-700 transition-colors hover:bg-red-600/10"
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-card bg-black/[0.025] p-3.5">
          <p className="text-[0.8125rem] font-semibold text-ink">Subir imágenes</p>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-ink-muted">
            JPG, PNG o WebP. Máximo 10 MB por archivo.
          </p>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            disabled={uploading}
            onChange={(event) => void upload(event.target.files)}
            className="mt-2.5 block w-full text-[0.8125rem] text-ink-muted file:mr-3 file:rounded-full file:border-0 file:bg-forest-600 file:px-4 file:py-2 file:text-[0.8125rem] file:font-semibold file:text-white hover:file:bg-forest-700"
          />
          {uploading && (
            <p className="mt-2 text-[0.75rem] font-medium text-forest-700">
              Subiendo…
            </p>
          )}
        </div>

        <div className="rounded-card bg-black/[0.025] p-3.5">
          <p className="text-[0.8125rem] font-semibold text-ink">
            Añadir por dirección
          </p>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-ink-muted">
            Para fotos alojadas en otro servicio (Cloudinary, por ejemplo).
          </p>
          <div className="mt-2.5 flex gap-2">
            <input
              type="url"
              value={externalUrl}
              onChange={(event) => setExternalUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addExternal();
                }
              }}
              placeholder="https://…"
              className={`${INPUT_CLASS} py-2 text-[0.8125rem]`}
            />
            <button
              type="button"
              onClick={addExternal}
              className="shrink-0 rounded-2xl bg-black/[0.06] px-4 text-[0.8125rem] font-semibold text-ink transition-colors hover:bg-black/[0.1]"
            >
              Añadir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-black/[0.06] disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}
