import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OccupancyForm } from "../occupancy-form";
import { Flash } from "@/components/admin/flash";
import { PageHeading, Pill } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getAccommodation } from "@/lib/admin/data";
import { listRateTiersByAccommodation } from "@/lib/admin/rates";
import { isUuid } from "@/lib/admin/validation";

export const metadata: Metadata = { title: "Tarifas del alojamiento" };
export const dynamic = "force-dynamic";

export default async function AccommodationRatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);

  if (!isUuid(id)) notFound();

  const [accommodation, tiersByAccommodation] = await Promise.all([
    getAccommodation(id),
    listRateTiersByAccommodation(),
  ]);

  if (!accommodation) notFound();

  return (
    <>
      <Flash ok={query.ok} error={query.error} />

      <PageHeading
        title={`Tarifas de ${accommodation.name}`}
        description="Precio por número de huéspedes, huésped adicional, desayuno y descuento de lunes a jueves. Al guardar, el sitio público se actualiza."
        action={<Pill tone="neutral">Hasta {accommodation.capacity} personas</Pill>}
      />

      <OccupancyForm
        accommodation={accommodation}
        tiers={tiersByAccommodation.get(accommodation.id) ?? []}
      />
    </>
  );
}
