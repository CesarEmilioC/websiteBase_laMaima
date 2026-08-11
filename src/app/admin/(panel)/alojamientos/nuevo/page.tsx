import type { Metadata } from "next";

import { AccommodationForm } from "../accommodation-form";
import { PageHeading } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listAccommodations } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Nuevo alojamiento" };
export const dynamic = "force-dynamic";

export default async function NewAccommodationPage() {
  await requireAdmin();
  const existing = await listAccommodations();

  // Se propone la última posición para que el nuevo alojamiento no se cuele en
  // medio del listado sin querer.
  const nextSortOrder =
    existing.reduce((max, item) => Math.max(max, item.sort_order), 0) + 1;

  return (
    <>
      <PageHeading
        title="Nuevo alojamiento"
        description="Puedes crearlo oculto, añadirle las fotos con calma y publicarlo cuando esté listo."
      />
      <AccommodationForm accommodation={null} nextSortOrder={nextSortOrder} />
    </>
  );
}
