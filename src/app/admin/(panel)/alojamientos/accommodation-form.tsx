"use client";

import Link from "next/link";
import { useActionState } from "react";

import { saveAccommodationAction } from "./actions";
import { ChipsInput } from "@/components/admin/chips-input";
import { EnglishSection } from "@/components/admin/english-section";
import { GalleryEditor } from "@/components/admin/gallery-editor";
import { SlugFields } from "@/components/admin/slug-fields";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  Banner,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Textarea,
  buttonClass,
} from "@/components/admin/ui";
import { IDLE_STATE, type AdminAccommodation } from "@/lib/admin/types";

const AMENITY_SUGGESTIONS = [
  "Cocineta equipada",
  "Baño privado",
  "Agua caliente",
  "Terraza",
  "Wifi",
  "Parqueadero",
  "Chimenea",
  "Zona de fogata",
  "Ropa de cama y toallas",
  "Vista al valle",
];

export function AccommodationForm({
  accommodation,
  nextSortOrder,
}: {
  /** `null` = alta de un alojamiento nuevo. */
  accommodation: AdminAccommodation | null;
  /** Orden sugerido cuando se está creando. */
  nextSortOrder: number;
}) {
  const [state, formAction] = useActionState(saveAccommodationAction, IDLE_STATE);
  const isEdit = accommodation !== null;

  return (
    <form action={formAction} className="space-y-5">
      {accommodation && <input type="hidden" name="id" value={accommodation.id} />}

      {state.status !== "idle" && (
        <Banner tone={state.status === "ok" ? "ok" : "error"}>
          {state.message}
        </Banner>
      )}

      <Card>
        <CardHeader
          title="Información básica"
          description="Lo que se ve en el listado y en la página del alojamiento."
        />
        <CardBody className="space-y-4">
          <SlugFields
            initialName={accommodation?.name ?? ""}
            initialSlug={accommodation?.slug ?? ""}
            nameLabel="Nombre del alojamiento"
            slugPrefix="lamaima.com/alojamientos/"
          />

          <Field
            label="Descripción corta"
            htmlFor="short_description"
            hint="Una o dos líneas. Es el texto que aparece en la tarjeta del listado."
          >
            <Textarea
              id="short_description"
              name="short_description"
              rows={2}
              maxLength={400}
              defaultValue={accommodation?.short_description ?? ""}
              className="min-h-0"
            />
          </Field>

          <Field
            label="Descripción completa"
            htmlFor="description"
            hint="Texto de la página de detalle. Separa los párrafos con una línea en blanco."
          >
            <Textarea
              id="description"
              name="description"
              rows={8}
              maxLength={6000}
              defaultValue={accommodation?.description ?? ""}
            />
          </Field>

          {/* El nombre NO tiene versión inglesa: "Casa Maima" o "Mirador" son
              nombres propios de las casas y traducirlos rompería la
              correspondencia con los letreros, con Airbnb y con lo que el
              equipo dice por WhatsApp. */}
          <EnglishSection hint="Lo que se deje vacío se muestra en español en lamaima.com/en. El nombre del alojamiento no se traduce.">
            <Field
              label="Descripción corta (inglés)"
              htmlFor="short_description_en"
              hint="La misma idea que arriba, en inglés. Aparece en la tarjeta del listado."
            >
              <Textarea
                id="short_description_en"
                name="short_description_en"
                rows={2}
                maxLength={400}
                defaultValue={accommodation?.short_description_en ?? ""}
                className="min-h-0"
              />
            </Field>

            <Field
              label="Descripción completa (inglés)"
              htmlFor="description_en"
              hint="Separa los párrafos con una línea en blanco, igual que en español."
            >
              <Textarea
                id="description_en"
                name="description_en"
                rows={8}
                maxLength={6000}
                defaultValue={accommodation?.description_en ?? ""}
              />
            </Field>

            <Field
              label="Aclaración de la tarifa (inglés)"
              htmlFor="price_note_en"
              hint="Ej.: “Up to 8 guests · 25 % less Monday to Thursday”."
            >
              <Input
                id="price_note_en"
                name="price_note_en"
                maxLength={160}
                defaultValue={accommodation?.price_note_en ?? ""}
              />
            </Field>

            <Field
              label="Amenidades (inglés)"
              hint="Se usa la lista ENTERA o ninguna: si la dejas incompleta, el sitio en inglés muestra la lista española completa antes que una mezcla de los dos idiomas."
            >
              <ChipsInput
                name="amenities_en"
                initial={accommodation?.amenities_en ?? []}
                placeholder="Ej.: Fitted kitchenette"
              />
            </Field>
          </EnglishSection>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Capacidad y tarifa"
          description="El precio se muestra como “Desde $X / noche” en el sitio."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Capacidad (personas)" htmlFor="capacity" required>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              max={100}
              required
              defaultValue={accommodation?.capacity ?? 2}
            />
          </Field>

          <Field
            label="Precio por noche (COP)"
            htmlFor="price_per_night_cop"
            required
            hint="Solo el número, sin puntos ni signo de peso. Ej.: 450000"
          >
            <Input
              id="price_per_night_cop"
              name="price_per_night_cop"
              type="number"
              min={0}
              step={1000}
              required
              defaultValue={accommodation?.price_per_night_cop ?? 0}
            />
          </Field>

          <Field
            label="Aclaración de la tarifa"
            htmlFor="price_note"
            hint="Aparece bajo el precio. Ej.: “Tarifa por confirmar”."
            className="sm:col-span-2"
          >
            <Input
              id="price_note"
              name="price_note"
              maxLength={160}
              defaultValue={accommodation?.price_note ?? ""}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Amenidades"
          description="Se muestran como una lista con vistos en la página del alojamiento."
        />
        <CardBody>
          <ChipsInput
            name="amenities"
            initial={accommodation?.amenities ?? []}
            suggestions={AMENITY_SUGGESTIONS}
            placeholder="Ej.: Cocineta equipada"
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Galería de fotos"
          description="La primera imagen es la portada: es la que se ve en las tarjetas del listado."
        />
        <CardBody>
          <GalleryEditor
            name="gallery"
            initial={accommodation?.gallery ?? []}
            folder="alojamientos"
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Publicación"
          description="Controla si el alojamiento se ve en el sitio y en qué posición."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Orden en el listado"
            htmlFor="sort_order"
            hint="Menor número = aparece antes."
          >
            <Input
              id="sort_order"
              name="sort_order"
              type="number"
              min={0}
              max={9999}
              defaultValue={accommodation?.sort_order ?? nextSortOrder}
            />
          </Field>

          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-ink/[0.035] px-4 py-3 ring-1 ring-inset ring-ink/[0.06]">
              <input
                type="checkbox"
                name="visible"
                defaultChecked={accommodation?.visible ?? true}
                className="h-5 w-5 rounded-md accent-brand-600"
              />
              <span className="text-[0.9375rem] font-medium text-ink">
                Visible en el sitio público
              </span>
            </label>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel="Guardando…">
          {isEdit ? "Guardar cambios" : "Crear alojamiento"}
        </SubmitButton>
        <Link href="/admin/alojamientos" className={buttonClass("secondary")}>
          Volver al listado
        </Link>
        {isEdit && accommodation && (
          <Link
            href={`/alojamientos/${accommodation.slug}`}
            target="_blank"
            rel="noreferrer"
            className={buttonClass("ghost")}
          >
            Ver en el sitio
          </Link>
        )}
      </div>
    </form>
  );
}
