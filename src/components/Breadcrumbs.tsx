import Link from "next/link";
import { abs } from "@/lib/seo";
import JsonLd from "./JsonLd";

export type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items, tone = "light" }: { items: Crumb[]; tone?: "light" | "dark" }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  const muted = tone === "light" ? "text-white/70" : "text-muted";
  const strong = tone === "light" ? "text-white" : "text-navy";
  return (
    <nav aria-label="Breadcrumb">
      <ol className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm ${muted}`}>
        {all.map((c, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {c.href && i < all.length - 1 ? (
              <Link href={c.href} className="hover:text-amber">
                {c.label}
              </Link>
            ) : (
              <span className={strong} aria-current={i === all.length - 1 ? "page" : undefined}>
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.label,
            ...(c.href ? { item: abs(c.href) } : {}),
          })),
        }}
      />
    </nav>
  );
}
