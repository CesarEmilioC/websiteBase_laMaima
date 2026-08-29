import { serializeJsonLd } from "@/lib/seo";

type Props = {
  /**
   * Nodos del grafo. Se publican dentro de un único `@graph` para que puedan
   * referenciarse entre sí por `@id` (la ficha apunta al hotel, la miga de pan
   * apunta a la ficha) en vez de repetir el hotel entero en cada bloque.
   */
  graph: Record<string, unknown>[];
};

/**
 * Bloque de datos estructurados (schema.org) de una página.
 *
 * El serializado pasa por `serializeJsonLd`, que escapa los signos de menor
 * que: buena parte del contenido lo escribe la administradora en el panel y no
 * puede poder cerrar la etiqueta `<script>`.
 */
export function JsonLd({ graph }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd({
          "@context": "https://schema.org",
          "@graph": graph,
        }),
      }}
    />
  );
}
