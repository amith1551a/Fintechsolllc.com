import { notFound } from "next/navigation";
import { paginate, POSTS_PER_PAGE, type Post } from "@/lib/content";
import BlogCard from "./BlogCard";
import BlogSidebar from "./BlogSidebar";
import type { Crumb } from "./Breadcrumbs";
import HeroSection from "./HeroSection";
import Pagination from "./Pagination";

/** Shared listing for /blog/, /blog/page/N/, /category/x/ and /category/x/page/N/. */
export default function BlogListing({
  title,
  description,
  items,
  page,
  base,
  crumbs,
}: {
  title: string;
  description?: string;
  items: Post[];
  page: number;
  base: string;
  crumbs: Crumb[];
}) {
  const { items: shown, totalPages } = paginate(items, page, POSTS_PER_PAGE);
  if (page < 1 || page > totalPages) notFound();
  return (
    <>
      <HeroSection title={page > 1 ? `${title} – Page ${page}` : title} description={description} breadcrumbs={crumbs} />
      <div className="bg-surface">
        <div className="container-site grid gap-10 py-14 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="grid gap-6 sm:grid-cols-2">
              {shown.map((p) => (
                <BlogCard key={p.path} post={p} headingLevel="h2" />
              ))}
            </div>
            <Pagination base={base} current={page} total={totalPages} />
          </div>
          <BlogSidebar />
        </div>
      </div>
    </>
  );
}
