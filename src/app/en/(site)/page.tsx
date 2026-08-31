import type { Metadata } from "next";

import { HomePage, homeMetadata } from "@/components/pages/home-page";

export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return homeMetadata("en");
}

export default function Page() {
  return <HomePage locale="en" />;
}
