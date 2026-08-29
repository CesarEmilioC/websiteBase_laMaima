import type { Metadata } from "next";

import { OccupancySection } from "./occupancy-section";
import { PlansSection } from "./plans-section";
import { SeasonsSection } from "./seasons-section";
import { Flash } from "@/components/admin/flash";
import { Card, CardBody, PageHeading } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listAccommodationOptions, listAccommodations } from "@/lib/admin/data";
import {
  listHolidays,
  listMinStayRules,
  listRatePlans,
  listRateTiersByAccommodation,
} from "@/lib/admin/rates";

export const metadata: Metadata = { title: "Tarifas y planes" };
export const dynamic = "force-dynamic";

export default async function RatesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();

  const [
    params,
    accommodations,
    options,
    tiersByAccommodation,
    plans,
    holidays,
    rules,
  ] = await Promise.all([
    searchParams,
    listAccommodations(),
    listAccommodationOptions(),
    listRateTiersByAccommodation(),
    listRatePlans(),
    listHolidays(),
    listMinStayRules(),
  ]);

  return (
    <>
      <Flash ok={params.ok} error={params.error} />

      <PageHeading
        title="Tarifas y planes"
        description="Todo lo que decide cuánto cuesta una noche: la tabla de precios de cada alojamiento, los planes especiales y las temporadas."
      />

      {/* Cómo se combina todo. Es la pregunta que aparece siempre al cambiar
          un precio, así que va arriba del todo y en una sola pantalla. */}
      <Card className="mb-8">
        <CardBody className="space-y-2 text-[0.875rem] leading-relaxed text-ink-muted">
          <p className="text-[0.9375rem] font-semibold text-ink">
            Cómo se calcula el precio de una noche
          </p>
          <ol className="ml-4 list-decimal space-y-1.5">
            <li>
              Se parte de la{" "}
              <strong className="font-semibold text-ink">
                tabla por ocupación
              </strong>{" "}
              del alojamiento: se cobra la fila más baja que alcance para el
              grupo.
            </li>
            <li>
              Si la noche es de{" "}
              <strong className="font-semibold text-ink">lunes a jueves</strong>{" "}
              y no es festivo, se aplica el descuento del alojamiento (salvo del
              14 de diciembre al 15 de enero).
            </li>
            <li>
              Cada huésped por encima de la fila más alta suma el valor de{" "}
              <strong className="font-semibold text-ink">
                huésped adicional
              </strong>
              .
            </li>
            <li>
              <strong className="font-semibold text-ink">
                Si hay un plan especial activo y la noche cae dentro de sus
                fechas, su precio reemplaza todo lo anterior
              </strong>{" "}
              —incluido el descuento de lunes a jueves— y el nombre del plan
              aparece en el desglose que ve el huésped.
            </li>
          </ol>
          <p>
            Cualquier cambio de esta pantalla se publica en el sitio en cuanto
            guardas.
          </p>
        </CardBody>
      </Card>

      <div className="space-y-10">
        <OccupancySection
          accommodations={accommodations}
          tiersByAccommodation={tiersByAccommodation}
        />

        <PlansSection plans={plans} />

        <SeasonsSection
          holidays={holidays}
          rules={rules}
          accommodations={options}
        />
      </div>
    </>
  );
}
