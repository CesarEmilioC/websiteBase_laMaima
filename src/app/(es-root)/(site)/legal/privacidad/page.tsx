import type { Metadata } from "next";

import { PrivacyPage, privacyMetadata } from "@/components/pages/legal/privacy-page";

export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return privacyMetadata("es");
}

export default function Page() {
  return <PrivacyPage locale="es" />;
}
