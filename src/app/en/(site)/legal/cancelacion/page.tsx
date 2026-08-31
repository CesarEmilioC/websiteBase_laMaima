import type { Metadata } from "next";

import {
  CancellationPage,
  cancellationMetadata,
} from "@/components/pages/legal/cancellation-page";

export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return cancellationMetadata("en");
}

export default function Page() {
  return <CancellationPage locale="en" />;
}
