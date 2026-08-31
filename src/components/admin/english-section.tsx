"use client";

/**
 * Subsección plegable "English" de los formularios del panel.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ PLEGADA Y NO UN FORMULARIO DUPLICADO
 * ---------------------------------------------------------------------------
 * Desde que el sitio público es bilingüe, cada ficha tiene su gemela en inglés.
 * La tentación es abrir una pestaña "Inglés" con el formulario entero repetido,
 * y es un error: el precio, la capacidad, el orden, las fotos y la visibilidad
 * NO tienen versión inglesa —son los mismos datos— y duplicarlos invita a que
 * alguien edite el precio en una pestaña y no en la otra.
 *
 * Aquí solo viven los campos de TEXTO que sí se traducen, colgando de la
 * sección española a la que corresponden. Va cerrada por defecto porque el
 * trabajo diario es en español: quien sube una foto o cambia una tarifa no
 * debería tener que pasar por encima de un bloque en inglés para llegar.
 *
 * Es un `<details>` nativo, no un acordeón con estado: los campos existen en el
 * DOM aunque esté cerrado, así que el formulario los envía igual y nada se
 * pierde por no haberlo abierto.
 */
export function EnglishSection({
  children,
  hint,
}: {
  children: React.ReactNode;
  /** Una línea que explique qué pasa si estos campos se dejan vacíos. */
  hint?: string;
}) {
  return (
    <details className="group rounded-2xl bg-ink/[0.025] ring-1 ring-inset ring-ink/[0.07]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-[0.9375rem] font-semibold text-ink [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2.5">
          {/* La bandera identifica el bloque de un vistazo, sin leer. Es la
              misma que usa el conmutador del sitio público. */}
          <span
            aria-hidden="true"
            className="block h-3 w-[1.125rem] shrink-0 overflow-hidden rounded-[2px] ring-1 ring-inset ring-black/15"
          >
            <svg viewBox="0 0 60 40" className="h-full w-full">
              <rect width="60" height="40" fill="#012169" />
              <path d="M0 0 60 40M60 0 0 40" stroke="#FFFFFF" strokeWidth="8" />
              <path d="M30 0V40M0 20H60" stroke="#FFFFFF" strokeWidth="13" />
              <path d="M30 0V40M0 20H60" stroke="#C8102E" strokeWidth="8" />
            </svg>
          </span>
          English (sitio en inglés)
        </span>
        <span
          aria-hidden="true"
          className="text-ink-muted transition-transform duration-200 group-open:rotate-180"
        >
          ⌄
        </span>
      </summary>

      <div className="space-y-4 border-t border-ink/[0.07] px-4 py-4">
        {hint && (
          <p className="text-[0.8125rem] leading-relaxed text-ink-muted">
            {hint}
          </p>
        )}
        {children}
      </div>
    </details>
  );
}
