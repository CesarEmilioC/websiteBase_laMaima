import type { Metadata } from "next";

import {
  ExperiencesPage,
  experiencesMetadata,
} from "@/components/pages/experiences-page";

export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return experiencesMetadata("en");
}

export default function Page() {
  return <ExperiencesPage locale="en" />;
}
