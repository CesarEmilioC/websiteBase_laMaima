"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "./icons";
import type { GalleryImage } from "@/lib/content";
import { dict } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

type Props = {
  /** TODAS las fotos del alojamiento, no solo las cuatro que se ven en la ficha. */
  images: GalleryImage[];
  /** Nombre del alojamiento: alimenta el nombre accesible del diálogo. */
  name: string;
  locale: Locale;
  /** Foto por la que se abre el visor. */
  startIndex: number;
  onClose: () => void;
};

/**
 * Desplazamiento horizontal mínimo (en px) para que un gesto cuente como
 * "pasar foto". Por debajo de esto casi siempre es un toque con la mano algo
 * movida, y cambiar de foto por accidente es de lo que más molesta en un visor.
 */
const SWIPE_THRESHOLD = 48;

/**
 * Calidad del optimizador DENTRO del visor.
 *
 * En el resto del sitio la fotografía va a 68 o 75 porque se ve pequeña y
 * recortada dentro de una tarjeta. Aquí no: ocupa el ancho entero de la
 * ventana y el visitante la está mirando a propósito. El material de La Maima
 * es casi todo follaje —hojas, helechos, dosel— y ese es exactamente el patrón
 * de alta frecuencia que un JPEG a 75 convierte en manchas.
 *
 * 90 es el punto donde el detalle fino deja de perderse sin que el archivo se
 * dispare (por encima el peso sube mucho más rápido que la calidad visible).
 * Los originales del bucket están a 2400 px con calidad 82-85, así que este
 * número no inventa detalle: simplemente deja de destruir el que ya hay.
 *
 * Debe estar declarado en `images.qualities` de `next.config.ts` o el
 * optimizador rechaza la petición.
 */
const VIEWER_QUALITY = 90;

/**
 * `sizes` del visor.
 *
 * La foto se pinta con `object-contain` dentro de una caja que ocupa toda la
 * ventana (menos el aire de la barra y el pie), así que el ancho que hay que
 * declarar es el de la VENTANA ENTERA. Con `100vw` el navegador elige del
 * `srcset` la variante inmediatamente superior al ancho del viewport por su
 * densidad de píxeles: en un portátil de 1280 pide la de 1920, y en un móvil
 * de 390 con DPR 3 la de 1200. Cualquier medida más pequeña (la caja real, el
 * `max-w-6xl`) haría que el navegador se conformara con una variante menor y
 * la ampliara: es la causa habitual de que un visor "se vea peor" que la
 * miniatura desde la que se abrió.
 */
const VIEWER_SIZES = "100vw";

/**
 * Visor de galería a pantalla completa.
 *
 * Se monta SOLO cuando el visitante toca una foto (ver `gallery-viewer.tsx`,
 * que lo carga con `next/dynamic`): ni este archivo ni sus imágenes cuestan un
 * byte mientras nadie abra la galería. Es la razón de que sea un componente
 * aparte y no un `hidden` dentro de la ficha.
 *
 * SIN LIBRERÍAS. Todo lo que necesita un visor serio está escrito aquí:
 *
 *   · Navegación con flechas en pantalla, teclado (←/→) y deslizamiento táctil.
 *   · Cierre con la X, con `Esc` y tocando fuera de la foto.
 *   · Contador "3 / 12" y pie con el texto alternativo de la foto.
 *   · `role="dialog"` + `aria-modal` + trampa de foco entre sus botones, y
 *     devolución del foco a la miniatura de origen al cerrar (eso último lo
 *     hace `gallery-viewer.tsx`, que es quien conoce la miniatura).
 *   · Bloqueo del scroll del cuerpo mientras está abierto, compensando el ancho
 *     de la barra de scroll para que la página no dé un salto lateral.
 *   · Precarga de la foto anterior y la siguiente: se pintan en el mismo hueco
 *     con opacidad cero, así que el navegador las descarga con el tamaño y el
 *     formato exactos con los que se van a ver y el cambio es instantáneo.
 *
 * FUNCIONA CON CUALQUIER NÚMERO DE FOTOS: con una sola no pinta flechas ni
 * contador; con dos, "anterior" y "siguiente" apuntan a la misma y no pasa
 * nada. El cliente añade y quita fotos desde el panel, así que nada aquí
 * supone una cantidad concreta.
 */
export function GalleryLightbox({
  images,
  name,
  locale,
  startIndex,
  onClose,
}: Props) {
  const t = dict(locale);
  const total = images.length;
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(startIndex, 0), Math.max(total - 1, 0)),
  );

  /* El portal necesita `document`, que en el primer render del servidor no
     existe. Este componente ya se carga con `ssr: false`, pero React sigue
     ejecutando el primer render en el cliente antes de montar: hasta entonces
     no se pinta nada. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  /**
   * Momento del último deslizamiento.
   *
   * Un gesto táctil termina disparando también eventos de ratón sintéticos
   * (`mouseup`, `click`) sobre el punto donde se levantó el dedo, y a veces más
   * de uno: sin esta marca, pasar de foto con el dedo acaba cerrando el visor.
   * Se guarda un INSTANTE y no un booleano a propósito —un booleano lo consume
   * el primer clic y el segundo ya cierra— y no se limpia: basta con que
   * caduque solo.
   */
  const swipedAt = useRef(0);

  const go = useCallback(
    (delta: number) => {
      if (total < 2) return;
      setIndex((current) => (current + delta + total) % total);
    },
    [total],
  );

  /* --- Teclado: ←, → y Esc --------------------------------------------- */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [go, onClose]);

  /* --- Scroll del cuerpo bloqueado -------------------------------------- */
  useEffect(() => {
    const { body, documentElement } = document;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;

    body.style.overflow = "hidden";
    /* En escritorio, ocultar el scroll ensancha la página el ancho de la barra
       y todo el contenido de debajo se desplaza. Se compensa con relleno. */
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, []);

  /* --- Foco inicial ------------------------------------------------------ */
  useEffect(() => {
    /* Al botón de cerrar y no al diálogo: es la salida, y quien navega con
       teclado necesita encontrarla en el primer tabulador. */
    closeRef.current?.focus();
  }, [mounted]);

  /**
   * Trampa de foco: mientras el visor está abierto, el tabulador no puede
   * salirse a la página de debajo (que está oculta tras el velo y sigue siendo
   * navegable para el lector de pantalla si no se hace esto).
   */
  function onDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
      "button:not([disabled])",
    );
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === dialogRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* --- Gestos táctiles --------------------------------------------------- */
  function onTouchStart(event: React.TouchEvent) {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    /* Se exige que el gesto sea claramente horizontal: si el dedo baja más de
       lo que se mueve de lado, el visitante quería otra cosa. */
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;

    swipedAt.current = Date.now();
    go(dx < 0 ? 1 : -1);
  }

  /**
   * ¿El punto pulsado cae sobre la fotografía que se ve?
   *
   * No basta con mirar si el evento salió del `<img>`: con `fill` el elemento
   * ocupa TODA la caja, y `object-contain` solo pinta dentro de ella una
   * fotografía centrada y con bandas a los lados (o arriba y abajo). Las bandas
   * son parte del `<img>` pero para el visitante son fondo, y tocarlas tiene
   * que cerrar. Así que se calcula el rectángulo realmente pintado a partir de
   * las medidas naturales de la imagen, que es exactamente lo que hace
   * `object-contain`.
   */
  function hitsPhoto(event: React.MouseEvent): boolean {
    const img = event.currentTarget.querySelector<HTMLImageElement>(
      "img[data-current]",
    );
    if (!img) return false;

    const box = img.getBoundingClientRect();
    const { naturalWidth, naturalHeight } = img;
    // Todavía sin cargar: no se cierra, que es el fallo seguro.
    if (!naturalWidth || !naturalHeight) return true;

    const scale = Math.min(box.width / naturalWidth, box.height / naturalHeight);
    const width = naturalWidth * scale;
    const height = naturalHeight * scale;
    const left = box.left + (box.width - width) / 2;
    const top = box.top + (box.height - height) / 2;

    return (
      event.clientX >= left &&
      event.clientX <= left + width &&
      event.clientY >= top &&
      event.clientY <= top + height
    );
  }

  /**
   * Cerrar al tocar fuera de la foto (el velo y las bandas del encuadre).
   *
   * Tres guardas, y las tres hacen falta:
   *   · Un clic que llega justo detrás de un deslizamiento se ignora. Es el
   *     evento de ratón sintético que el navegador emite al final de un gesto
   *     táctil, y cerraría el visor cada vez que alguien pasa una foto.
   *   · Los botones se gobiernan solos.
   *   · La FOTO no cierra; el resto de la pantalla, sí.
   */
  function onBackdropClick(event: React.MouseEvent) {
    if (Date.now() - swipedAt.current < 600) return;
    if ((event.target as HTMLElement).closest("button")) return;
    if (hitsPhoto(event)) return;
    onClose();
  }

  if (!mounted || total === 0) return null;

  const current = images[index];
  const previous = images[(index - 1 + total) % total];
  const next = images[(index + 1) % total];
  const caption = current.alt || t.gallery.fallbackAlt(name);

  const controlClass =
    "inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-white ring-1 ring-inset ring-white/25 backdrop-blur-md transition-[background-color,transform] duration-200 ease-ios hover:bg-white/25 active:scale-95";

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={t.gallery.label(name)}
      onKeyDown={onDialogKeyDown}
      /* `touch-action: pan-y pinch-zoom` desactiva el gesto HORIZONTAL del
         navegador —el "deslizar para volver atrás" de Chrome y Safari— dentro
         del visor: sin esto, pasar a la foto anterior con el dedo saca al
         visitante de la página. Se conservan a propósito el desplazamiento
         vertical y el pellizco para ampliar, que son gestos que sí se esperan
         sobre una fotografía. `overscroll-contain` remata: ningún gesto se
         encadena a la página de debajo.

         Por encima del header fijo (z-50) y del botón flotante de WhatsApp. */
      className="fixed inset-0 z-[120] overscroll-contain [touch-action:pan-y_pinch-zoom]"
    >
      {/* Velo: azul marino translúcido con desenfoque, no negro. La página que
          queda detrás sigue insinuándose, que es la estética de transparencias
          que pidió el cliente. */}
      <div
        aria-hidden="true"
        className="lightbox-veil absolute inset-0 bg-navy/90 backdrop-blur-xl"
      />

      {/* Escenario: ocupa todo y deja aire arriba (barra) y abajo (pie). */}
      <div
        className="absolute inset-0"
        onClick={onBackdropClick}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* El pie va ANCLADO abajo, no pegado a la foto.
            -----------------------------------------------------------------
            Colgándolo de la foto se descuadraba en vertical: una foto apaisada
            dentro de una pantalla de móvil solo ocupa un tercio del alto (es lo
            que hace `object-contain`, y es lo correcto), así que el pie
            quedaba flotando en mitad de la nada. Anclado abajo se lee como lo
            que es —una barra de información del visor, como el contador de
            arriba— y la foto se centra en todo el hueco libre. */}
        <figure className="lightbox-figure absolute inset-0 flex items-center justify-center px-4 pb-24 pt-20 sm:px-20">
          <div className="relative h-full w-full max-w-6xl">
            {/* Anterior y siguiente, invisibles: el navegador las descarga ya
                optimizadas al tamaño real, y pasar de foto no espera a la red.
                `pointer-events-none` para que no roben el clic.

                Van con la MISMA calidad y el mismo `sizes` que la actual a
                propósito: si difirieran, la dirección optimizada sería otra y
                al pasar de foto el navegador tendría que volver a descargar la
                variante buena — la precarga no serviría de nada. */}
            {total > 1 && (
              <>
                <Image
                  key={`prev-${previous.url}`}
                  src={previous.url}
                  alt=""
                  aria-hidden="true"
                  fill
                  loading="eager"
                  fetchPriority="low"
                  sizes={VIEWER_SIZES}
                  quality={VIEWER_QUALITY}
                  className="pointer-events-none object-contain opacity-0"
                />
                <Image
                  key={`next-${next.url}`}
                  src={next.url}
                  alt=""
                  aria-hidden="true"
                  fill
                  loading="eager"
                  fetchPriority="low"
                  sizes={VIEWER_SIZES}
                  quality={VIEWER_QUALITY}
                  className="pointer-events-none object-contain opacity-0"
                />
              </>
            )}

            <Image
              key={`current-${current.url}`}
              src={current.url}
              alt={caption}
              fill
              priority
              sizes={VIEWER_SIZES}
              quality={VIEWER_QUALITY}
              /* Marca para `hitsPhoto()`: de las tres imágenes apiladas, esta
                 es la que se ve. */
              data-current=""
              className="object-contain"
            />
          </div>

          <figcaption className="absolute inset-x-0 bottom-6 mx-auto max-w-3xl px-6 text-center text-[0.8125rem] leading-relaxed text-white/70">
            {caption}
          </figcaption>
        </figure>
      </div>

      {/* Barra superior: contador a la izquierda, cerrar a la derecha. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-4 sm:p-5">
        {total > 1 ? (
          <p
            aria-hidden="true"
            className="eyebrow pointer-events-auto rounded-full bg-white/12 px-3.5 py-2 tabular-nums text-white ring-1 ring-inset ring-white/25 backdrop-blur-md"
          >
            {index + 1} / {total}
          </p>
        ) : (
          <span />
        )}

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t.gallery.close}
          className={`pointer-events-auto ${controlClass}`}
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Flechas. Solo con dos o más fotos, y con área táctil de 48 px. */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t.gallery.previous}
            className={`absolute left-3 top-1/2 -translate-y-1/2 sm:left-5 ${controlClass}`}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t.gallery.next}
            className={`absolute right-3 top-1/2 -translate-y-1/2 sm:right-5 ${controlClass}`}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </>
      )}

      {/* El contador visible es un "3 / 12" que un lector de pantalla leería
          como "tres barra doce". Este anuncio, invisible, dice la frase entera
          y se actualiza solo al cambiar de foto. */}
      <p role="status" aria-live="polite" className="sr-only">
        {t.gallery.counter(index + 1, total)}
      </p>
    </div>,
    document.body,
  );
}
