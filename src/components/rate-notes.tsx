import {
  CalendarIcon,
  CoffeeIcon,
  InfoIcon,
  TagIcon,
  UsersIcon,
} from "./icons";
import type { RateNote, RateNoteKind } from "@/lib/pricing";

const ICONS: Record<
  RateNoteKind,
  (props: { className?: string }) => React.ReactElement
> = {
  breakfast: CoffeeIcon,
  weekday: TagIcon,
  "extra-guest": UsersIcon,
  "min-stay": CalendarIcon,
  other: InfoIcon,
};

type Props = {
  notes: RateNote[];
  className?: string;
};

/**
 * Las condiciones de la tarifa, en mini-filas de icono + dato.
 *
 * POR QUÉ NO UN PÁRRAFO. Aquí se cuentan cuatro cosas independientes entre sí
 * —desayuno, descuento entre semana, huésped adicional, estancia mínima— y en
 * prosa se leen como una sola frase larga en la que hay que buscar. En puntos,
 * quien mira la cabaña encuentra en un segundo la única que le importa. El
 * icono no decora: es lo que permite saltar a la línea correcta sin leerlas
 * todas.
 *
 * El matiz de cada dato (la excepción del descuento, el precio de lunes a
 * jueves del huésped adicional) va en una SEGUNDA línea más apagada, no entre
 * paréntesis: así el dato principal sigue leyéndose de un vistazo y la
 * excepción está ahí para quien la busque.
 *
 * Las notas se derivan de los campos de la base de datos (ver `rateNotes()` en
 * `lib/pricing.ts`), así que se actualizan solas cuando la administradora
 * cambia un precio desde el panel.
 */
export function RateNotes({ notes, className = "" }: Props) {
  if (notes.length === 0) return null;

  return (
    <ul className={`space-y-2.5 text-[0.8125rem] leading-relaxed ${className}`}>
      {notes.map((note) => {
        const Icon = ICONS[note.kind];

        return (
          <li key={note.key} className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="mt-px flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center rounded-full bg-brand-600/10 text-brand-700"
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-ink-soft">{note.text}</span>
              {note.detail && (
                <span className="mt-0.5 block text-ink-muted">
                  {note.detail}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
