import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Suite de pruebas del motor de tarifas.
 *
 * Solo se ejecutan los tests de `src/lib`: ahí vive la lógica pura (precios,
 * fechas, disponibilidad), que es la que no puede fallar en silencio. Los
 * componentes se verifican en el navegador, no aquí.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
