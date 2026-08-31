import type { Metadata } from "next";

import { TermsPage, termsMetadata } from "@/components/pages/legal/terms-page";

export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return termsMetadata("en");
}

export default function Page() {
  return <TermsPage locale="en" />;
}
