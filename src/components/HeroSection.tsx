import type { ReactNode } from "react";
import Breadcrumbs, { type Crumb } from "./Breadcrumbs";
import { HexPattern } from "./Icons";

// The original hero/banner background images were never archived, so heroes use the brand navy with the
// hexagon motif from the logo instead of a substitute photo.
export default function HeroSection({
  title,
  eyebrow,
  description,
  breadcrumbs,
  variant = "page",
  children,
  aside,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  breadcrumbs?: Crumb[];
  variant?: "home" | "page";
  children?: ReactNode;
  /** optional panel shown beside the text at ≥1024px and below it on smaller screens */
  aside?: ReactNode;
}) {
  const home = variant === "home";
  return (
    <section className="relative isolate overflow-hidden bg-navy text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--color-navy-700),transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(69,133,195,0.35),transparent_55%)]" />
      <HexPattern className="absolute -right-24 -top-24 -z-10 h-[520px] w-[520px] text-brand/25" />
      <div
        className={`container-site ${home ? "py-24 sm:py-32 lg:py-40" : "py-14 sm:py-20"} ${aside ? "grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]" : ""}`}
      >
        {breadcrumbs && (
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}
        <div className={home ? "max-w-3xl" : "max-w-4xl"}>
          {eyebrow && <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-amber">{eyebrow}</p>}
          <h1 className={`font-bold leading-tight ${home ? "text-4xl sm:text-5xl lg:text-6xl" : "text-3xl sm:text-4xl lg:text-5xl"}`}>
            {title}
          </h1>
          {description && <p className={`mt-6 text-white/80 ${home ? "text-lg sm:text-xl" : "text-base sm:text-lg"}`}>{description}</p>}
          {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
        </div>
        {aside}
      </div>
    </section>
  );
}
