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
   * - `solid`: pastilla verde WhatsApp (acción principal).
   * - `soft`: pastilla verde clara con texto verde (acción secundaria clara).
   * - `outline`: pastilla con filete, sobre fondos claros.
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
    solid: "bg-whatsapp text-white shadow-pill hover:bg-whatsapp-dark",
    soft: "bg-whatsapp/12 text-whatsapp-dark hover:bg-whatsapp/20",
    outline:
      "bg-white text-whatsapp-dark shadow-card ring-1 ring-inset ring-black/[0.07] hover:bg-whatsapp/[0.06]",
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
