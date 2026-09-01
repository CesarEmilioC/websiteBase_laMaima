import type { Metadata } from "next";

import {
  BookingHubPage,
  bookingHubMetadata,
} from "@/components/pages/booking-hub-page";
import { STAY_QUERY_PARAM } from "@/lib/booking/select";

/**
 * Página de reservas en español. Todo vive en
 * `@/components/pages/booking-hub-page`, compartido con `/en/reservar`.
 *
 * A diferencia del resto de rutas públicas, esta LEE LA DIRECCIÓN: el
 * parámetro `?cabana=` decide si se enseña el selector o el calendario de una
 * casa concreta, así que Next la renderiza en cada petición. Las consultas a
 * Supabase siguen pasando por la Data Cache de una hora (ver
 * `supabase/public.ts`), de modo que la página es dinámica pero no vuelve a la
 * base en cada visita.
 */
export const revalidate = 3600;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateMetadata(): Promise<Metadata> {
  return bookingHubMetadata("es");
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  return <BookingHubPage locale="es" cabana={params[STAY_QUERY_PARAM]} />;
}
