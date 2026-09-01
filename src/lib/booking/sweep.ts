/**
 * Barrido de holds vencidos.
 *
 * Contraparte con base de datos de las reglas puras de `holds.ts`. Se apoya en
 * la función `public.release_expired_holds()` (ver la migración
 * `release_expired_holds_function`), que hace el trabajo en **una sola
 * sentencia UPDATE**: entre un SELECT y un UPDATE hechos por separado cabría
 * otra transacción, y el barrido es justo lo que tiene que ser atómico.
 *
 * CUÁNDO SE LLAMA: antes de toda creación o reactivación de reserva —la
 * pública y la manual del panel—, porque la restricción `bookings_no_overlap`
 * no puede leer `now()` y sin el barrido rechazaría fechas que en realidad
 * están libres.
 *
 * CUÁNDO NO: en los caminos de solo lectura (disponibilidad, iCal, listados
 * del panel). Esos aplican `occupiesCalendar()` en memoria y dan la respuesta
 * correcta sin escribir en la base durante un render.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { EXPIRED_HOLD_NOTE } from "./holds";

/**
 * Cancela los holds vencidos y devuelve cuántos cayeron.
 *
 * Nunca lanza: un fallo aquí no puede tumbar la reserva que se está creando.
 * Lo peor que pasa si el barrido falla es que la restricción de la base
 * rechace unas fechas que estaban libres, y el huésped vea el mensaje de
 * "esas fechas se acaban de ocupar" — molesto, pero no una sobreventa.
 *
 * @param accommodationId Solo ese alojamiento. Sin él, barre la tabla entera.
 */
export async function releaseExpiredHolds(
  supabase: SupabaseClient,
  accommodationId?: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("release_expired_holds", {
    p_note: EXPIRED_HOLD_NOTE,
    p_accommodation_id: accommodationId ?? null,
  });

  if (error) {
    console.error("[reservas] no se pudieron liberar los holds vencidos:", error.message);
    return 0;
  }

  const released = typeof data === "number" ? data : 0;
  if (released > 0) {
    console.info(
      `[reservas] ${released} hold(s) vencido(s) liberado(s)` +
        (accommodationId ? ` en el alojamiento ${accommodationId}.` : "."),
    );
  }
  return released;
}
