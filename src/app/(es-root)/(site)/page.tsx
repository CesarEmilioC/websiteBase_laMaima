import type { Metadata } from "next";

import { HomePage, homeMetadata } from "@/components/pages/home-page";

/** Revalidación cada hora: el contenido lo edita el cliente, no cambia por minuto. */
export const revalidate = 3600;

/**
 * Portada en español. Todo el maquetado vive en `@/components/pages/home-page`,
 * compartido con `/en`: esta ruta solo dice en qué idioma se pinta.
 */
export function generateMetadata(): Promise<Metadata> {
  return homeMetadata("es");
}

export default function Page() {
  return <HomePage locale="es" />;
}
