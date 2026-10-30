import BlogListing from "@/components/BlogListing";
import { posts } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Blog",
  description: "Insights & Innovations from Fintech Solutions: articles on U.S. incorporation, banking, cybersecurity, MVP development, automation testing and our technology partners.",
  path: "/blog/",
});

export default function BlogIndex() {
  return <BlogListing title="Blog" description="Insights & Innovations" items={posts} page={1} base="/blog/" crumbs={[{ label: "Blog" }]} />;
}
