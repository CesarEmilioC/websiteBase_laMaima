"use client";

import Link from "next/link";
import { useActionState } from "react";

import { saveExperienceAction } from "./actions";
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
import { IDLE_STATE, type AdminExperience } from "@/lib/admin/types";

export function ExperienceForm({
  experience,
  nextSortOrder,
}: {
  experience: AdminExperience | null;
  nextSortOrder: number;
}) {
  const [state, formAction] = useActionState(saveExperienceAction, IDLE_STATE);
  const isEdit = experience !== null;

  return (
    <form action={formAction} className="space-y-5">
      {experience && <input type="hidden" name="id" value={experience.id} />}

      {state.status !== "idle" && (
        <Banner tone={state.status === "ok" ? "ok" : "error"}>
          {state.message}
        </Banner>
      )}

      <Card>
        <CardHeader
          title="Información básica"
          description="Lo que se ve en la página de experiencias."
        />
        <CardBody className="space-y-4">
          <SlugFields
            initialName={experience?.name ?? ""}
            initialSlug={experience?.slug ?? ""}
            nameLabel="Nombre de la experiencia"
            slugPrefix="lamaima.com/experiencias/"
          />

          <Field
            label="Descripción corta"
            htmlFor="short_description"
            hint="Una o dos líneas para la tarjeta del listado."
          >
            <Textarea
              id="short_description"
              name="short_description"
              rows={2}
              maxLength={400}
              defaultValue={experience?.short_description ?? ""}
              className="min-h-0"
            />
          </Field>

          <Field label="Descripción completa" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              rows={7}
              maxLength={6000}
              defaultValue={experience?.description ?? ""}
            />
          </Field>

          {/* A diferencia de los alojamientos, aquí el NOMBRE sí se traduce:
              "Clase de yoga" describe la actividad, no es una marca. */}
          <EnglishSection hint="Lo que se deje vacío se muestra en español en lamaima.com/en.">
            <Field
              label="Nombre (inglés)"
              htmlFor="name_en"
              hint="Ej.: “Clase de yoga” → “Yoga class”."
            >
              <Input
                id="name_en"
                name="name_en"
                maxLength={120}
                defaultValue={experience?.name_en ?? ""}
              />
            </Field>

            <Field
              label="Descripción corta (inglés)"
              htmlFor="short_description_en"
            >
              <Textarea
                id="short_description_en"
                name="short_description_en"
                rows={2}
                maxLength={400}
                defaultValue={experience?.short_description_en ?? ""}
                className="min-h-0"
              />
            </Field>

            <Field label="Descripción completa (inglés)" htmlFor="description_en">
              <Textarea
                id="description_en"
                name="description_en"
                rows={7}
                maxLength={6000}
                defaultValue={experience?.description_en ?? ""}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Duración (inglés)"
                htmlFor="duration_en"
                hint="Ej.: “About 45 minutes down to the river”."
              >
                <Input
                  id="duration_en"
                  name="duration_en"
                  maxLength={80}
                  defaultValue={experience?.duration_en ?? ""}
                />
              </Field>

              <Field
                label="Aclaración de la tarifa (inglés)"
                htmlFor="price_note_en"
                hint="Ej.: “Included in your stay”."
              >
                <Input
                  id="price_note_en"
                  name="price_note_en"
                  maxLength={160}
                  defaultValue={experience?.price_note_en ?? ""}
                />
              </Field>
            </div>
          </EnglishSection>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Duración, cupo y tarifa"
          description="Todos estos campos son opcionales: déjalos vacíos si la experiencia está incluida en la estadía."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Duración"
            htmlFor="duration"
            hint="Texto libre. Ej.: “1–2 horas”, “Todo el día”."
          >
            <Input
              id="duration"
              name="duration"
              maxLength={80}
              defaultValue={experience?.duration ?? ""}
            />
          </Field>

          <Field
            label="Capacidad (personas)"
            htmlFor="capacity"
            hint="Vacío = sin cupo definido."
          >
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              max={500}
              defaultValue={experience?.capacity ?? ""}
            />
          </Field>

          <Field
            label="Precio por persona (COP)"
            htmlFor="price_cop"
            hint="Vacío = sin costo adicional o por confirmar."
          >
            <Input
              id="price_cop"
              name="price_cop"
              type="number"
              min={0}
              step={1000}
              defaultValue={experience?.price_cop ?? ""}
            />
          </Field>

          <Field
            label="Aclaración de la tarifa"
            htmlFor="price_note"
            hint="Ej.: “Incluida en la estadía”."
          >
            <Input
              id="price_note"
              name="price_note"
              maxLength={160}
              defaultValue={experience?.price_note ?? ""}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Galería de fotos"
          description="La primera imagen es la portada de la tarjeta."
        />
        <CardBody>
          <GalleryEditor
            name="gallery"
            initial={experience?.gallery ?? []}
            folder="experiencias"
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Publicación" />
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
              defaultValue={experience?.sort_order ?? nextSortOrder}
            />
          </Field>

          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-ink/[0.035] px-4 py-3 ring-1 ring-inset ring-ink/[0.06]">
              <input
                type="checkbox"
                name="visible"
                defaultChecked={experience?.visible ?? true}
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
          {isEdit ? "Guardar cambios" : "Crear experiencia"}
        </SubmitButton>
        <Link href="/admin/experiencias" className={buttonClass("secondary")}>
          Volver al listado
        </Link>
        <Link
          href="/experiencias"
          target="_blank"
          rel="noreferrer"
          className={buttonClass("ghost")}
        >
          Ver en el sitio
        </Link>
      </div>
    </form>
  );
}
