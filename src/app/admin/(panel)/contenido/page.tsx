import type { Metadata } from "next";

import { saveAboutAction, saveContactAction, saveHeroAction } from "./actions";
import { ActionForm } from "@/components/admin/action-form";
import {
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PageHeading,
  Textarea,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getSiteContentMap } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Contenido del sitio" };
export const dynamic = "force-dynamic";

/** Lectura segura de una clave de texto dentro del jsonb. */
function text(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value : "";
}

/** Los párrafos se editan como un solo texto con líneas en blanco entre ellos. */
function paragraphsToText(source: Record<string, unknown>): string {
  const value = source.paragraphs;
  if (!Array.isArray(value)) return "";
  return value.filter((item): item is string => typeof item === "string").join("\n\n");
}

type Stat = { value: string; label: string };

function statsOf(source: Record<string, unknown>): Stat[] {
  const value = source.stats;
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const record = item as Record<string, unknown>;
    return [
      {
        value: typeof record.value === "string" ? record.value : "",
        label: typeof record.label === "string" ? record.label : "",
      },
    ];
  });
}

export default async function SiteContentPage() {
  await requireAdmin();
  const content = await getSiteContentMap();

  const hero = content.home_hero ?? {};
  const about = content.home_about ?? {};
  const contact = content.contact ?? {};
  const stats = statsOf(about);

  return (
    <>
      <PageHeading
        title="Contenido del sitio"
        description="Los textos de la página de inicio y los datos de contacto. Al guardar, el sitio público se actualiza de inmediato."
      />

      <div className="space-y-5">
        <Card>
          <CardHeader
            title="Portada (primera pantalla)"
            description="El titular grande sobre la foto principal de la página de inicio."
          />
          <CardBody>
            <ActionForm action={saveHeroAction} submitLabel="Guardar portada">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Etiqueta pequeña"
                  htmlFor="hero_eyebrow"
                  hint="Línea corta sobre el titular."
                >
                  <Input
                    id="hero_eyebrow"
                    name="eyebrow"
                    maxLength={120}
                    defaultValue={text(hero, "eyebrow")}
                  />
                </Field>

                <Field label="Titular" htmlFor="hero_title" required>
                  <Input
                    id="hero_title"
                    name="title"
                    required
                    maxLength={160}
                    defaultValue={text(hero, "title")}
                  />
                </Field>

                <Field label="Subtítulo" htmlFor="hero_subtitle" className="sm:col-span-2">
                  <Textarea
                    id="hero_subtitle"
                    name="subtitle"
                    rows={2}
                    maxLength={400}
                    defaultValue={text(hero, "subtitle")}
                    className="min-h-0"
                  />
                </Field>

                <Field label="Texto del botón" htmlFor="hero_cta_label">
                  <Input
                    id="hero_cta_label"
                    name="cta_label"
                    maxLength={60}
                    defaultValue={text(hero, "cta_label")}
                  />
                </Field>

                <Field
                  label="Destino del botón"
                  htmlFor="hero_cta_href"
                  hint="Ruta interna. Ej.: /alojamientos"
                >
                  <Input
                    id="hero_cta_href"
                    name="cta_href"
                    maxLength={200}
                    defaultValue={text(hero, "cta_href")}
                  />
                </Field>

                <Field
                  label="Imagen de fondo"
                  htmlFor="hero_image"
                  hint="Ruta del sitio (/images/…) o dirección completa https://…"
                >
                  <Input
                    id="hero_image"
                    name="image"
                    maxLength={500}
                    defaultValue={text(hero, "image")}
                  />
                </Field>

                <Field
                  label="Descripción de la imagen"
                  htmlFor="hero_image_alt"
                  hint="Para accesibilidad y buscadores."
                >
                  <Input
                    id="hero_image_alt"
                    name="image_alt"
                    maxLength={300}
                    defaultValue={text(hero, "image_alt")}
                  />
                </Field>
              </div>
            </ActionForm>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Sobre la reserva"
            description="El bloque de texto con la historia de La Maima y las tres cifras destacadas."
          />
          <CardBody>
            <ActionForm action={saveAboutAction} submitLabel="Guardar sección">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Etiqueta pequeña" htmlFor="about_eyebrow">
                  <Input
                    id="about_eyebrow"
                    name="eyebrow"
                    maxLength={120}
                    defaultValue={text(about, "eyebrow")}
                  />
                </Field>

                <Field label="Titular" htmlFor="about_title" required>
                  <Input
                    id="about_title"
                    name="title"
                    required
                    maxLength={200}
                    defaultValue={text(about, "title")}
                  />
                </Field>

                <Field
                  label="Párrafos"
                  htmlFor="about_paragraphs"
                  hint="Deja una línea en blanco entre un párrafo y el siguiente."
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="about_paragraphs"
                    name="paragraphs"
                    rows={10}
                    maxLength={6000}
                    defaultValue={paragraphsToText(about)}
                  />
                </Field>

                <Field label="Imagen" htmlFor="about_image">
                  <Input
                    id="about_image"
                    name="image"
                    maxLength={500}
                    defaultValue={text(about, "image")}
                  />
                </Field>

                <Field label="Descripción de la imagen" htmlFor="about_image_alt">
                  <Input
                    id="about_image_alt"
                    name="image_alt"
                    maxLength={300}
                    defaultValue={text(about, "image_alt")}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <p className="mb-2 text-[0.8125rem] font-semibold text-ink">
                    Cifras destacadas
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[0, 1, 2].map((index) => (
                      <div
                        key={index}
                        className="rounded-card bg-black/[0.025] p-3.5"
                      >
                        <Field label="Número" htmlFor={`stat_${index}_value`}>
                          <Input
                            id={`stat_${index}_value`}
                            name={`stat_${index}_value`}
                            maxLength={20}
                            defaultValue={stats[index]?.value ?? ""}
                          />
                        </Field>
                        <Field
                          label="Texto"
                          htmlFor={`stat_${index}_label`}
                          className="mt-3"
                        >
                          <Input
                            id={`stat_${index}_label`}
                            name={`stat_${index}_label`}
                            maxLength={60}
                            defaultValue={stats[index]?.label ?? ""}
                          />
                        </Field>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ActionForm>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Datos de contacto"
            description="Teléfono, dirección y redes de La Maima."
          />
          <CardBody>
            <ActionForm action={saveContactAction} submitLabel="Guardar contacto">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre del negocio" htmlFor="business_name">
                  <Input
                    id="business_name"
                    name="business_name"
                    maxLength={160}
                    defaultValue={text(contact, "business_name")}
                  />
                </Field>

                <Field
                  label="Teléfono visible"
                  htmlFor="phone_display"
                  hint="Como se muestra. Ej.: +57 311 308 2813"
                >
                  <Input
                    id="phone_display"
                    name="phone_display"
                    maxLength={40}
                    defaultValue={text(contact, "phone_display")}
                  />
                </Field>

                <Field
                  label="WhatsApp"
                  htmlFor="whatsapp"
                  hint="Solo dígitos con indicativo del país. Ej.: 573113082813"
                >
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    inputMode="numeric"
                    maxLength={20}
                    defaultValue={text(contact, "whatsapp")}
                  />
                </Field>

                <Field label="Dirección" htmlFor="address">
                  <Input
                    id="address"
                    name="address"
                    maxLength={200}
                    defaultValue={text(contact, "address")}
                  />
                </Field>

                <Field label="Municipio" htmlFor="locality">
                  <Input
                    id="locality"
                    name="locality"
                    maxLength={100}
                    defaultValue={text(contact, "locality")}
                  />
                </Field>

                <Field label="Departamento" htmlFor="region">
                  <Input
                    id="region"
                    name="region"
                    maxLength={100}
                    defaultValue={text(contact, "region")}
                  />
                </Field>

                <Field label="País" htmlFor="country">
                  <Input
                    id="country"
                    name="country"
                    maxLength={100}
                    defaultValue={text(contact, "country")}
                  />
                </Field>

                <Field label="Instagram" htmlFor="instagram">
                  <Input
                    id="instagram"
                    name="instagram"
                    maxLength={300}
                    defaultValue={text(contact, "instagram")}
                  />
                </Field>

                <Field label="Facebook" htmlFor="facebook">
                  <Input
                    id="facebook"
                    name="facebook"
                    maxLength={300}
                    defaultValue={text(contact, "facebook")}
                  />
                </Field>

                <Field label="Enlace de Google Maps" htmlFor="maps_url">
                  <Input
                    id="maps_url"
                    name="maps_url"
                    maxLength={500}
                    defaultValue={text(contact, "maps_url")}
                  />
                </Field>

                <Field
                  label="Nota de reservas"
                  htmlFor="note"
                  hint="Frase corta que acompaña los datos de contacto."
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="note"
                    name="note"
                    rows={2}
                    maxLength={300}
                    defaultValue={text(contact, "note")}
                    className="min-h-0"
                  />
                </Field>
              </div>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
