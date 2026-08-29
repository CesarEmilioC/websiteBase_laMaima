import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlanForm } from "../../plan-form";
import { Flash } from "@/components/admin/flash";
import { PageHeading, Pill } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listAccommodationOptions } from "@/lib/admin/data";
import {
  PLAN_STATUS_LABEL,
  getRatePlan,
  planStatus,
} from "@/lib/admin/rates";
import { isUuid } from "@/lib/admin/validation";

export const metadata: Metadata = { title: "Editar plan especial" };
export const dynamic = "force-dynamic";

export default async function EditRatePlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);

  if (!isUuid(id)) notFound();

  const [plan, accommodations] = await Promise.all([
    getRatePlan(id),
    listAccommodationOptions(),
  ]);

  if (!plan) notFound();

  const status = planStatus(plan);

  return (
    <>
      <Flash ok={query.ok} error={query.error} />

      <PageHeading
        title={plan.name}
        description={`Plan de ${plan.accommodation_name ?? "todos los alojamientos"}.`}
        action={
          <Pill tone={status === "vigente" ? "green" : status === "proximo" ? "blue" : "neutral"}>
            {PLAN_STATUS_LABEL[status]}
          </Pill>
        }
      />

      <PlanForm plan={plan} accommodations={accommodations} nextSort={plan.sort} />
    </>
  );
}
