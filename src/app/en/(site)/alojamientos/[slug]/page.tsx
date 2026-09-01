import type { Metadata } from "next";

import {
  AccommodationDetailPage,
  accommodationDetailMetadata,
  accommodationParams,
} from "@/components/pages/accommodation-detail-page";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

/** Los mismos slugs que el árbol español: el espejo es exacto. */
export const generateStaticParams = accommodationParams;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return accommodationDetailMetadata(slug, "en");
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <AccommodationDetailPage slug={slug} locale="en" />;
}
