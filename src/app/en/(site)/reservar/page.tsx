import type { Metadata } from "next";

import {
  BookingHubPage,
  bookingHubMetadata,
} from "@/components/pages/booking-hub-page";
import { STAY_QUERY_PARAM } from "@/lib/booking/select";

/**
 * Página de reservas en inglés: el espejo exacto de `/reservar`, con la misma
 * ruta y el mismo parámetro (`?cabana=`, en español como todos los slugs del
 * sitio). Ver la nota del árbol español.
 */
export const revalidate = 3600;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateMetadata(): Promise<Metadata> {
  return bookingHubMetadata("en");
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  return <BookingHubPage locale="en" cabana={params[STAY_QUERY_PARAM]} />;
}
