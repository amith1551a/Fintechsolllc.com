import Link from "next/link";
import type { Industry } from "@/lib/content";
import { ArrowRight } from "./Icons";

export default function IndustryCard({ industry }: { industry: Industry }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-white p-7 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">{industry.name}</p>
      <h3 className="mt-3 text-lg font-semibold leading-snug text-navy">{industry.headline}</h3>
      <p className="mt-3 text-sm leading-6 text-muted">{industry.summary}</p>
      {industry.features.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm text-ink">
          {industry.features.map((f) => {
            const [head, ...rest] = f.split(":");
            return (
              <li key={f} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" aria-hidden="true" />
                <span>
                  {rest.length ? (
                    <>
                      <strong className="font-semibold">{head}:</strong>
                      {rest.join(":")}
                    </>
                  ) : (
                    f
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <Link href={industry.href} className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-brand-600 hover:text-navy">
        Explore industry solutions <ArrowRight />
      </Link>
    </article>
  );
}
