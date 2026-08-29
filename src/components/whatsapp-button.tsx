import { WhatsAppIcon } from "./icons";
import { getContactInfo } from "@/lib/content";
import { whatsappUrl } from "@/lib/whatsapp";

type Props = {
  /** Mensaje prellenado (se codifica automáticamente). */
  message: string;
  /** Texto visible del botón. */
  label?: string;
  /** Etiqueta accesible si el texto visible no es suficientemente descriptivo. */
  ariaLabel?: string;
  /**
   * Todas las variantes van en AZUL DE MARCA, no en verde WhatsApp: el verde
   * desapareció con la identidad nueva. Lo que identifica el canal es el icono.
   *
   * - `solid`: pastilla azul llena (acción principal).
   * - `soft`: pastilla de azul translúcido con texto azul (acción secundaria).
   * - `outline`: pastilla blanca con filete, sobre fondos claros.
   * - `onDark`: pastilla de vidrio para fondos oscuros.
   */
  variant?: "solid" | "soft" | "outline" | "onDark";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  sm: "gap-2 px-4 py-2.5 text-[0.875rem]",
  md: "gap-2.5 px-5 py-3 text-[0.9375rem]",
  lg: "gap-2.5 px-7 py-4 text-[1.0625rem]",
} as const;

const ICON_SIZES = {
  sm: "h-4 w-4",
  md: "h-[1.15rem] w-[1.15rem]",
  lg: "h-5 w-5",
} as const;

/**
 * Botón contextual de WhatsApp: mismo canal que el botón flotante, pero con un
 * mensaje que ya dice qué está mirando la persona (alojamiento o experiencia).
 * Forma de pastilla estilo iOS, con respuesta táctil al pulsar.
 *
 * Server component asíncrono: lee el número de WhatsApp editado desde el
 * panel (`getContactInfo()`, cacheada) en vez del fallback hardcodeado.
 */
export async function WhatsAppButton({
  message,
  label = "Escribir por WhatsApp",
  ariaLabel,
  variant = "solid",
  size = "md",
  className = "",
}: Props) {
  const contact = await getContactInfo();
  const base =
    "inline-flex items-center justify-center rounded-full font-semibold tracking-[-0.01em] transition-[background-color,box-shadow,transform,color] duration-200 ease-ios active:scale-[0.97]";

  const variants = {
    solid: "bg-brand-600 text-white shadow-pill hover:bg-brand-700",
    soft: "bg-brand-600/10 text-brand-700 hover:bg-brand-600/16",
    outline:
      "bg-white text-brand-700 shadow-card ring-1 ring-inset ring-brand-600/15 hover:bg-brand-50",
    onDark:
      "bg-white/12 text-white ring-1 ring-inset ring-white/25 backdrop-blur-md hover:bg-white/20",
  } as const;

  return (
    <a
      href={whatsappUrl(message, contact.whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel ?? label}
      className={`${base} ${SIZES[size]} ${variants[variant]} ${className}`}
    >
      <WhatsAppIcon className={ICON_SIZES[size]} />
      {label}
    </a>
  );
}
