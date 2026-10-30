import { notFound } from "next/navigation";
import BlogListing from "@/components/BlogListing";
import { categories, getCategory, postsByPaths } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ cat: string }> };

export function generateStaticParams() {
  return categories.map((c) => ({ cat: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const c = getCategory((await params).cat);
  if (!c) return {};
  return pageMetadata({
    title: `${c.name} Articles`,
    description: `${c.name}: ${c.posts.length} article${c.posts.length === 1 ? "" : "s"} from the Fintech Solutions blog.`,
    path: `/category/${c.slug}/`,
  });
}

export default async function CategoryPage({ params }: Props) {
  const c = getCategory((await params).cat);
  if (!c) notFound();
  return (
    <BlogListing
      title={c.name}
      description="Category archive"
      items={postsByPaths(c.posts)}
      page={1}
      base={`/category/${c.slug}/`}
      crumbs={[{ label: "Blog", href: "/blog/" }, { label: c.name }]}
    />
  );
}
