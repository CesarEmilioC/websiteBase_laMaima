/**
 * Freno básico a las solicitudes de reserva.
 *
 * Explícitamente **sin servicios externos** (nada de Turnstile, reCAPTCHA ni
 * Upstash): esto es un formulario de reserva de un hotel de seis cabañas, no
 * un registro de cuentas. Lo que hay que evitar es el rellenador automático que
 * mete cincuenta solicitudes en un minuto y deja el calendario bloqueado; para
 * eso bastan dos cosas baratas.
 *
 *   1. **Cookie de cortesía.** Cuenta las solicitudes de ESTE navegador en una
 *      ventana de una hora. Se borra abriendo una ventana privada, y no pasa
 *      nada: es la primera barrera, no la única.
 *   2. **Memoria del proceso por IP.** Sobrevive al borrado de cookies, pero se
 *      pierde en cada arranque en frío y no se comparte entre las instancias de
 *      Vercel. Es un colchón, no una garantía.
 *
 * La tercera barrera, la que de verdad limita el daño, no está aquí: es el
 * **hold de 48 horas**. Aunque alguien consiga colar solicitudes, las fechas se
 * liberan solas y el equipo ve las solicitudes basura juntas en el panel.
 *
 * El campo trampa (honeypot) vive en `guest.ts`, con el resto del formulario.
 */
import "server-only";

import { cookies, headers } from "next/headers";

/** Nombre de la cookie. Deliberadamente opaco. */
const COOKIE = "lamaima_rq";

/** Ventana de conteo. */
const WINDOW_MS = 60 * 60 * 1000;

/** Solicitudes permitidas por ventana. Un grupo grande puede pedir dos o tres
 *  cabañas para las mismas fechas: cinco deja margen sin abrir la puerta. */
const MAX_PER_WINDOW = 5;

/** Segundos que hay que esperar entre dos solicitudes seguidas. */
const COOLDOWN_MS = 20 * 1000;

type Window = {
  /** Inicio de la ventana, en milisegundos. */
  start: number;
  /** Solicitudes aceptadas dentro de ella. */
  count: number;
  /** Momento de la última aceptada. */
  last: number;
};

/* --- Memoria del proceso ---------------------------------------------------- */

const byIp = new Map<string, Window>();

/** Purga perezosa: sin ella el mapa crecería sin fin en un proceso longevo. */
function prune(now: number) {
  if (byIp.size < 500) return;
  for (const [key, window] of byIp) {
    if (now - window.start > WINDOW_MS) byIp.delete(key);
  }
}

/* --- Serialización de la cookie --------------------------------------------- */

function parseWindow(raw: string | undefined, now: number): Window {
  if (raw) {
    const [start, count, last] = raw.split(".").map(Number);
    if (
      Number.isFinite(start) &&
      Number.isFinite(count) &&
      Number.isFinite(last) &&
      now - start < WINDOW_MS
    ) {
      return { start, count, last };
    }
  }
  return { start: now, count: 0, last: 0 };
}

function serializeWindow({ start, count, last }: Window): string {
  return `${start}.${count}.${last}`;
}

/**
 * Primera IP de `x-forwarded-for`. En Vercel la cabecera la pone la
 * plataforma; en local no existe y todos comparten la clave "local", que es
 * exactamente lo que se quiere para poder probar el freno.
 */
async function clientIp(): Promise<string> {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return list.get("x-real-ip")?.trim() || "local";
}

export type ThrottleVerdict = { allowed: boolean };

/**
 * ¿Se acepta una solicitud más?
 *
 * Cuenta el intento en las dos barreras y devuelve el veredicto. Se llama
 * DESPUÉS de validar el formulario (no tiene sentido gastar una unidad de cuota
 * en alguien que solo escribió mal su correo) y ANTES de escribir en la base.
 */
export async function allowBookingRequest(
  now: number = Date.now(),
): Promise<ThrottleVerdict> {
  prune(now);

  const jar = await cookies();
  const cookieWindow = parseWindow(jar.get(COOKIE)?.value, now);

  const ip = await clientIp();
  const ipWindow = byIp.get(ip);
  const ipCurrent =
    ipWindow && now - ipWindow.start < WINDOW_MS
      ? ipWindow
      : { start: now, count: 0, last: 0 };

  const tooSoon =
    now - cookieWindow.last < COOLDOWN_MS || now - ipCurrent.last < COOLDOWN_MS;
  const tooMany =
    cookieWindow.count >= MAX_PER_WINDOW || ipCurrent.count >= MAX_PER_WINDOW;

  if (tooSoon || tooMany) {
    return { allowed: false };
  }

  const next: Window = {
    start: cookieWindow.start,
    count: cookieWindow.count + 1,
    last: now,
  };

  jar.set(COOKIE, serializeWindow(next), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.ceil(WINDOW_MS / 1000),
  });

  byIp.set(ip, { start: ipCurrent.start, count: ipCurrent.count + 1, last: now });

  return { allowed: true };
}
