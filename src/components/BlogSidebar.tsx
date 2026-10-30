import Link from "next/link";
import { categories, formatDate, posts } from "@/lib/content";

export default function BlogSidebar({ currentPath }: { currentPath?: string }) {
  const recent = posts.filter((p) => p.path !== currentPath).slice(0, 5);
  return (
    <aside className="space-y-8 lg:sticky lg:top-28" aria-label="Blog sidebar">
      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-lg font-semibold text-navy">Categories</h2>
        <ul className="mt-4 space-y-1 text-sm">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/category/${c.slug}/`} className="flex items-center justify-between rounded-md px-2 py-1.5 text-ink hover:bg-brand-50 hover:text-brand-600">
                <span>{c.name}</span>
                <span className="text-xs text-muted">{c.posts.length}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-lg font-semibold text-navy">Recent Posts</h2>
        <ul className="mt-4 space-y-4">
          {recent.map((p) => (
            <li key={p.path}>
              <Link href={p.path} className="text-sm font-medium leading-snug text-ink hover:text-brand-600">
                {p.title}
              </Link>
              <p className="mt-1 text-xs text-muted">{formatDate(p.date)}</p>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
