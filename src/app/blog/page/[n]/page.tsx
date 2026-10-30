import { notFound } from "next/navigation";
import BlogListing from "@/components/BlogListing";
import { pageNumbers, posts, POSTS_PER_PAGE } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ n: string }> };

export function generateStaticParams() {
  return pageNumbers(posts.length, POSTS_PER_PAGE).map((n) => ({ n }));
}

export async function generateMetadata({ params }: Props) {
  const { n } = await params;
  return pageMetadata({
    title: `Blog – Page ${n}`,
    description: `Insights & Innovations from Fintech Solutions – page ${n} of the blog archive.`,
    path: `/blog/page/${n}/`,
  });
}

export default async function BlogPage({ params }: Props) {
  const { n } = await params;
  const page = Number(n);
  if (!/^\d+$/.test(n) || page < 2) notFound();
  return (
    <BlogListing
      title="Blog"
      items={posts}
      page={page}
      base="/blog/"
      crumbs={[{ label: "Blog", href: "/blog/" }, { label: `Page ${page}` }]}
    />
  );
}
