import Link from "next/link";
import { notFound } from "next/navigation";
import BlogSidebar from "@/components/BlogSidebar";
import CTASection from "@/components/CTASection";
import HeroSection from "@/components/HeroSection";
import JsonLd from "@/components/JsonLd";
import MediaImage from "@/components/MediaImage";
import RichContent from "@/components/RichContent";
import { formatDate, getPost, posts, site } from "@/lib/content";
import { abs, pageMetadata } from "@/lib/seo";

// Historical WordPress permalinks: /YYYY/MM/DD/post-slug/ (the first segment is shared with [slug] pages,
// so the year is the `slug` param).
type Props = { params: Promise<{ slug: string; month: string; day: string; post: string }> };

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.year, month: p.month, day: p.day, post: p.slug }));
}

async function load(params: Props["params"]) {
  const { slug, month, day, post } = await params;
  return getPost(`/${slug}/${month}/${day}/${post}/`);
}

export async function generateMetadata({ params }: Props) {
  const post = await load(params);
  if (!post) return {};
  return pageMetadata({
    title: post.title,
    description: post.description,
    path: post.path,
    image: post.featuredImage,
    type: "article",
    publishedTime: post.date,
  });
}

export default async function ArticlePage({ params }: Props) {
  const post = await load(params);
  if (!post) notFound();
  const idx = posts.findIndex((p) => p.path === post.path);
  const newer = posts[idx - 1];
  const older = posts[idx + 1];
  const cat = post.categories[0];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          url: abs(post.path),
          mainEntityOfPage: abs(post.path),
          ...(post.featuredImage ? { image: abs(post.featuredImage.src) } : {}),
          author: { "@type": post.author && post.author !== "SEO Team" ? "Person" : "Organization", name: post.author ?? site.name },
          publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: abs(site.logo.src) } },
          ...(post.categories.length ? { articleSection: post.categories.map((c) => c.name) } : {}),
          ...(post.tags.length ? { keywords: post.tags.join(", ") } : {}),
        }}
      />
      <HeroSection
        title={post.title}
        breadcrumbs={[
          { label: "Blog", href: "/blog/" },
          ...(cat ? [{ label: cat.name, href: `/category/${cat.slug}/` }] : []),
          { label: post.title },
        ]}
      >
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {post.author && <span>Posted by {post.author}</span>}
        </p>
      </HeroSection>
      <div className="bg-surface">
        <div className="container-site grid gap-10 py-14 lg:grid-cols-[1fr_320px]">
          <article className="min-w-0 rounded-2xl border border-line bg-white p-6 sm:p-10">
            {post.featuredImage && (
              <MediaImage
                image={post.featuredImage}
                label={post.title}
                fit="contain"
                preload
                className="mb-8 aspect-[16/9] rounded-xl"
                sizes="(min-width: 1024px) 760px, 100vw"
              />
            )}
            {post.html ? (
              <RichContent html={post.html} />
            ) : (
              <p className="text-muted">The text of this article was not preserved in the web archive.</p>
            )}
            {(post.categories.length > 0 || post.tags.length > 0) && (
              <footer className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6 text-sm">
                {post.categories.map((c) => (
                  <Link key={c.slug} href={`/category/${c.slug}/`} className="rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-600 hover:bg-brand hover:text-white">
                    {c.name}
                  </Link>
                ))}
                {post.tags.map((t) => (
                  <span key={t} className="rounded-full border border-line px-3 py-1 text-muted">
                    #{t}
                  </span>
                ))}
              </footer>
            )}
            <nav aria-label="More articles" className="mt-8 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
              {older ? (
                <Link href={older.path} rel="prev" className="rounded-lg p-3 hover:bg-surface">
                  <span className="text-xs uppercase tracking-wide text-muted">Previous article</span>
                  <span className="mt-1 block font-semibold text-navy">{older.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {newer && (
                <Link href={newer.path} rel="next" className="rounded-lg p-3 text-right hover:bg-surface">
                  <span className="text-xs uppercase tracking-wide text-muted">Next article</span>
                  <span className="mt-1 block font-semibold text-navy">{newer.title}</span>
                </Link>
              )}
            </nav>
          </article>
          <BlogSidebar currentPath={post.path} />
        </div>
      </div>
      <CTASection />
    </>
  );
}
