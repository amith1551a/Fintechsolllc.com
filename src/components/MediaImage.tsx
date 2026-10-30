import Image from "next/image";
import type { Img } from "@/lib/content";
import { HexPattern } from "./Icons";

/**
 * A recovered image, or (when the original file was never archived) a branded panel with the label.
 * No substitute stock photography is used.
 */
export default function MediaImage({
  image,
  label,
  className = "",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  fit = "cover",
  preload = false,
}: {
  image: Img | null;
  label: string;
  className?: string;
  sizes?: string;
  fit?: "cover" | "contain";
  preload?: boolean;
}) {
  if (image) {
    return (
      <div className={`relative overflow-hidden bg-surface ${className}`}>
        <Image
          src={image.src}
          alt={image.alt || label}
          fill
          sizes={sizes}
          preload={preload}
          className={fit === "cover" ? "object-cover" : "object-contain p-4"}
        />
      </div>
    );
  }
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-navy via-navy-800 to-brand-600 p-6 ${className}`}
      role="img"
      aria-label={label}
    >
      <HexPattern className="absolute inset-0 h-full w-full text-white/10" />
      <span className="relative line-clamp-3 text-center font-[family-name:var(--font-heading)] text-lg font-bold text-white">{label}</span>
    </div>
  );
}
