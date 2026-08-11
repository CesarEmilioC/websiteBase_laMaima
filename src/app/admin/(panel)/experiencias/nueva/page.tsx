import type { Metadata } from "next";

import { ExperienceForm } from "../experience-form";
import { PageHeading } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listExperiences } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Nueva experiencia" };
export const dynamic = "force-dynamic";

export default async function NewExperiencePage() {
  await requireAdmin();
  const existing = await listExperiences();

  const nextSortOrder =
    existing.reduce((max, item) => Math.max(max, item.sort_order), 0) + 1;

  return (
    <>
      <PageHeading
        title="Nueva experiencia"
        description="Senderos, fogata, avistamiento de aves… Puedes crearla oculta y publicarla cuando tenga fotos."
      />
      <ExperienceForm experience={null} nextSortOrder={nextSortOrder} />
    </>
  );
}
