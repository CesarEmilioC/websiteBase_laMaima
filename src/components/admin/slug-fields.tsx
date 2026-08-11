"use client";

import { useState } from "react";

import { Field, Input } from "./ui";
import { slugify } from "@/lib/admin/slug";

/**
 * Par nombre + slug.
 *
 * El slug se autogenera mientras se escribe el nombre, pero deja de hacerlo en
 * cuanto el usuario lo edita a mano (o si ya venía con valor, es decir, en una
 * edición): cambiar la URL de una página ya publicada rompe enlaces, así que
 * nunca debe ocurrir por accidente.
 */
export function SlugFields({
  initialName,
  initialSlug,
  nameLabel,
  slugPrefix,
}: {
  initialName: string;
  initialSlug: string;
  nameLabel: string;
  slugPrefix: string;
}) {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [locked, setLocked] = useState(initialSlug.length > 0);

  return (
    <>
      <Field label={nameLabel} htmlFor="name" required>
        <Input
          id="name"
          name="name"
          value={name}
          required
          maxLength={120}
          onChange={(event) => {
            const next = event.target.value;
            setName(next);
            if (!locked) setSlug(slugify(next));
          }}
        />
      </Field>

      <Field
        label="Dirección en el sitio (slug)"
        htmlFor="slug"
        required
        hint={`Se verá como ${slugPrefix}${slug || "…"}. Cámbialo solo si es necesario: si la página ya está publicada, los enlaces antiguos dejarán de funcionar.`}
      >
        <Input
          id="slug"
          name="slug"
          value={slug}
          required
          maxLength={80}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          onChange={(event) => {
            setLocked(true);
            setSlug(event.target.value);
          }}
          onBlur={(event) => setSlug(slugify(event.target.value))}
        />
      </Field>
    </>
  );
}
