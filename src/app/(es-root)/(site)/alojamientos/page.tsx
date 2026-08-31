import type { Metadata } from "next";

import {
  AccommodationsPage,
  accommodationsMetadata,
} from "@/components/pages/accommodations-page";

export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return accommodationsMetadata("es");
}

export default function Page() {
  return <AccommodationsPage locale="es" />;
}
