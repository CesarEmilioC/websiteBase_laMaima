import type { Metadata } from "next";

import {
  AccommodationDetailPage,
  accommodationDetailMetadata,
  accommodationParams,
} from "@/components/pages/accommodation-detail-page";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

/** Prerenderiza en el build una ficha por alojamiento visible. */
export const generateStaticParams = accommodationParams;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return accommodationDetailMetadata(slug, "es");
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <AccommodationDetailPage slug={slug} locale="es" />;
}
