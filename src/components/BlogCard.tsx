import Link from "next/link";
import { formatDate, type Post } from "@/lib/content";
import MediaImage from "./MediaImage";

export default function BlogCard({ post, headingLevel = "h3" }: { post: Post; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  const cat = post.categories[0];
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:shadow-lg">
      <Link href={post.path} tabIndex={-1} aria-hidden="true">
        <MediaImage image={post.featuredImage} label={post.title} className="aspect-[16/10]" />
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {cat && (
            <Link href={`/category/${cat.slug}/`} className="rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-600 hover:bg-brand hover:text-white">
              {cat.name}
            </Link>
          )}
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </div>
        <H className="mt-3 text-lg font-semibold leading-snug text-navy">
          <Link href={post.path} className="hover:text-brand-600">
            {post.title}
          </Link>
        </H>
        {post.description && post.description !== post.title && (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{post.description}</p>
        )}
        <Link href={post.path} className="mt-auto pt-5 text-sm font-semibold text-brand-600 hover:text-navy">
          Continue reading<span className="sr-only">: {post.title}</span>
        </Link>
      </div>
    </article>
  );
}
