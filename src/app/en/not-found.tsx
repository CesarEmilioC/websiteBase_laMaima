import type { Metadata } from "next";

import { NotFoundPage } from "@/components/pages/not-found-page";
import { dict } from "@/lib/i18n";

export const metadata: Metadata = {
  title: dict("en").notFound.metaTitle,
  robots: { index: false, follow: false },
};

export const revalidate = 3600;

/** 404 del árbol inglés: mismo diseño, mismos caminos de vuelta, en inglés. */
export default function NotFound() {
  return <NotFoundPage locale="en" />;
}
