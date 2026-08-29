import type { Metadata } from "next";

import { PlanForm } from "../../plan-form";
import { PageHeading } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listAccommodationOptions } from "@/lib/admin/data";
import { listRatePlans } from "@/lib/admin/rates";

export const metadata: Metadata = { title: "Nuevo plan especial" };
export const dynamic = "force-dynamic";

export default async function NewRatePlanPage() {
  await requireAdmin();
  const [accommodations, plans] = await Promise.all([
    listAccommodationOptions(),
    listRatePlans(),
  ]);

  // El orden sugerido va al final de la fila: un plan nuevo no debería
  // adelantarse a los que ya estaban sin que nadie lo decida.
  const nextSort = plans.reduce((max, plan) => Math.max(max, plan.sort), -1) + 1;

  return (
    <>
      <PageHeading
        title="Nuevo plan especial"
        description="Un paquete con precio propio para unas fechas: San Valentín, un cumpleaños, un puente con cena incluida."
      />

      <PlanForm plan={null} accommodations={accommodations} nextSort={nextSort} />
    </>
  );
}
