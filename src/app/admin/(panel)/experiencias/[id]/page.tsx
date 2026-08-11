import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExperienceForm } from "../experience-form";
import { Flash } from "@/components/admin/flash";
import { PageHeading } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getExperience } from "@/lib/admin/data";
import { isUuid } from "@/lib/admin/validation";

export const metadata: Metadata = { title: "Editar experiencia" };
export const dynamic = "force-dynamic";

export default async function EditExperiencePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);

  if (!isUuid(id)) notFound();

  const experience = await getExperience(id);
  if (!experience) notFound();

  return (
    <>
      <Flash ok={query.ok} error={query.error} />

      <PageHeading
        title={experience.name}
        description="Editando una experiencia de la reserva."
      />

      <ExperienceForm
        experience={experience}
        nextSortOrder={experience.sort_order}
      />
    </>
  );
}
