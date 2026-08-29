"use client";

import { useState, type KeyboardEvent } from "react";

import { INPUT_CLASS } from "./ui";

/**
 * Editor de listas cortas de texto (amenidades) presentado como pastillas.
 *
 * El valor real que viaja al servidor es el JSON del arreglo, en un input
 * oculto: así el formulario sigue siendo un <form> normal con Server Action,
 * sin necesidad de `onSubmit` ni fetch manual.
 */
export function ChipsInput({
  name,
  initial,
  placeholder = "Escribe y presiona Enter",
  suggestions = [],
}: {
  name: string;
  initial: string[];
  placeholder?: string;
  suggestions?: string[];
}) {
  const [items, setItems] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const value = raw.trim();
    if (!value) return;
    // Comparación sin distinguir mayúsculas para no duplicar "Wifi" y "wifi".
    if (items.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    setItems([...items, value]);
    setDraft("");
  }

  function remove(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      // Enter dentro de un input enviaría el formulario completo.
      event.preventDefault();
      add(draft);
      return;
    }
    if (event.key === "Backspace" && !draft && items.length) {
      setItems(items.slice(0, -1));
    }
  }

  const pending = suggestions.filter(
    (item) => !items.some((existing) => existing.toLowerCase() === item.toLowerCase()),
  );

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(items)} />

      {items.length > 0 && (
        <ul className="mb-2.5 flex flex-wrap gap-2">
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600/10 py-1 pl-3 pr-1.5 text-[0.8125rem] font-medium text-brand-800">
                {item}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Quitar ${item}`}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-brand-700/70 transition-colors hover:bg-brand-600/20 hover:text-navy-soft"
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
                    <path
                      d="M6 6l12 12M18 6 6 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={placeholder}
          className={INPUT_CLASS}
        />
        <button
          type="button"
          onClick={() => add(draft)}
          className="shrink-0 rounded-2xl bg-ink/[0.05] px-4 text-[0.875rem] font-semibold text-ink transition-colors hover:bg-ink/[0.08]"
        >
          Añadir
        </button>
      </div>

      {pending.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[0.75rem] text-ink-muted">Sugerencias:</span>
          {pending.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => add(item)}
              className="rounded-full bg-ink/[0.04] px-2.5 py-1 text-[0.75rem] font-medium text-ink-soft transition-colors hover:bg-ink/[0.08]"
            >
              + {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
