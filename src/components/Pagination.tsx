import Link from "next/link";

/** WordPress-style pagination: page 1 is `base`, later pages are `${base}page/N/` (original URL format). */
export default function Pagination({ base, current, total }: { base: string; current: number; total: number }) {
  if (total <= 1) return null;
  const href = (n: number) => (n === 1 ? base : `${base}page/${n}/`);
  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {current > 1 && (
        <Link href={href(current - 1)} rel="prev" className="rounded-md border border-line px-3 py-2 text-sm text-navy hover:border-brand hover:text-brand-600">
          ← Previous
        </Link>
      )}
      {Array.from({ length: total }, (_, i) => i + 1).map((n) =>
        n === current ? (
          <span key={n} aria-current="page" className="rounded-md bg-navy px-3.5 py-2 text-sm font-semibold text-white">
            {n}
          </span>
        ) : (
          <Link key={n} href={href(n)} className="rounded-md border border-line px-3.5 py-2 text-sm text-navy hover:border-brand hover:text-brand-600">
            {n}
          </Link>
        ),
      )}
      {current < total && (
        <Link href={href(current + 1)} rel="next" className="rounded-md border border-line px-3 py-2 text-sm text-navy hover:border-brand hover:text-brand-600">
          Next →
        </Link>
      )}
    </nav>
  );
}
