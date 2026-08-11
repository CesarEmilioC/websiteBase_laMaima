import type { Metadata } from "next";

import { BookingForm } from "../booking-form";
import { PageHeading } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listAccommodationOptions } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Registrar reserva" };
export const dynamic = "force-dynamic";

export default async function NewBookingPage() {
  await requireAdmin();
  const accommodations = await listAccommodationOptions();

  return (
    <>
      <PageHeading
        title="Registrar reserva"
        description="Para las reservas que llegan por teléfono, WhatsApp, Airbnb o Booking. Al guardarla, esas fechas dejan de estar disponibles."
      />
      <BookingForm booking={null} accommodations={accommodations} />
    </>
  );
}
