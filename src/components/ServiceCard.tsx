import Link from "next/link";
import { ArrowRight } from "./Icons";

export default function ServiceCard({
  title,
  href,
  description,
  index,
  clamp = true,
}: {
  title: string;
  href: string;
  description?: string;
  index: number;
  /** clip the description to 4 lines (for clipped meta descriptions); off for complete hand-written text */
  clamp?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-brand"
    >
      <span
        className="flex h-12 w-12 items-center justify-center bg-brand-50 font-[family-name:var(--font-heading)] text-lg font-bold text-brand-600 transition-colors [clip-path:polygon(25%_0,75%_0,100%_50%,75%_100%,25%_100%,0_50%)] group-hover:bg-brand group-hover:text-white"
        aria-hidden="true"
      >
        {String(index).padStart(2, "0")}
      </span>
      <h3 className="mt-5 text-xl font-semibold leading-snug text-navy">{title}</h3>
      {description && <p className={`mt-3 text-sm leading-6 text-muted ${clamp ? "line-clamp-4" : ""}`}>{description}</p>}
      <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-brand-600">
        Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
