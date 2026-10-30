import { notFound } from "next/navigation";
import BlogListing from "@/components/BlogListing";
import { categories, getCategory, pageNumbers, postsByPaths, POSTS_PER_PAGE } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ cat: string; n: string }> };

export function generateStaticParams() {
  return categories.flatMap((c) => pageNumbers(c.posts.length, POSTS_PER_PAGE).map((n) => ({ cat: c.slug, n })));
}

export async function generateMetadata({ params }: Props) {
  const { cat, n } = await params;
  const c = getCategory(cat);
  if (!c) return {};
  return pageMetadata({
    title: `${c.name} Articles – Page ${n}`,
    description: `${c.name}: page ${n} of the category archive on the Fintech Solutions blog.`,
    path: `/category/${c.slug}/page/${n}/`,
  });
}

export default async function CategoryPaged({ params }: Props) {
  const { cat, n } = await params;
  const c = getCategory(cat);
  const page = Number(n);
  if (!c || !/^\d+$/.test(n) || page < 2) notFound();
  return (
    <BlogListing
      title={c.name}
      items={postsByPaths(c.posts)}
      page={page}
      base={`/category/${c.slug}/`}
      crumbs={[{ label: "Blog", href: "/blog/" }, { label: c.name, href: `/category/${c.slug}/` }, { label: `Page ${page}` }]}
    />
  );
}
