import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AccommodationForm } from "../accommodation-form";
import { Flash } from "@/components/admin/flash";
import { PageHeading, Pill } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getAccommodation, listBookings } from "@/lib/admin/data";
import { isUuid } from "@/lib/admin/validation";

export const metadata: Metadata = { title: "Editar alojamiento" };
export const dynamic = "force-dynamic";

export default async function EditAccommodationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);

  if (!isUuid(id)) notFound();

  const accommodation = await getAccommodation(id);
  if (!accommodation) notFound();

  const bookings = await listBookings({ accommodationId: id });

  return (
    <>
      <Flash ok={query.ok} error={query.error} />

      <PageHeading
        title={accommodation.name}
        description={`Editando el alojamiento publicado en /alojamientos/${accommodation.slug}.`}
        action={
          bookings.length > 0 ? (
            <Pill tone="blue">
              {bookings.length} reserva{bookings.length === 1 ? "" : "s"} registrada
              {bookings.length === 1 ? "" : "s"}
            </Pill>
          ) : undefined
        }
      />

      <AccommodationForm
        accommodation={accommodation}
        nextSortOrder={accommodation.sort_order}
      />
    </>
  );
}
