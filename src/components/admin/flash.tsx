import { Banner } from "./ui";

/**
 * Banner de resultado para las acciones que terminan redirigiendo (crear,
 * eliminar, duplicar…). El mensaje viaja en la URL — `?ok=` o `?error=` — y se
 * muestra en la página de destino.
 *
 * El texto se renderiza como contenido de React (nunca como HTML), así que un
 * valor manipulado en la barra de direcciones no puede inyectar marcado.
 */
export function Flash({ ok, error }: { ok?: string; error?: string }) {
  const message = ok ?? error;
  if (!message) return null;

  return (
    <div className="mb-5">
      <Banner tone={ok ? "ok" : "error"}>{message.slice(0, 400)}</Banner>
    </div>
  );
}
