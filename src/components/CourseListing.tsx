import Link from "next/link";
import { notFound } from "next/navigation";
import { courseCategories, COURSES_PER_PAGE, paginate, type Course } from "@/lib/content";
import type { Crumb } from "./Breadcrumbs";
import CourseCard from "./CourseCard";
import CTASection from "./CTASection";
import HeroSection from "./HeroSection";
import Pagination from "./Pagination";

/** Shared listing for /shop/, /shop/page/N/, /product-category/x/ and /product-category/x/page/N/. */
export default function CourseListing({
  title,
  description,
  items,
  page,
  base,
  crumbs,
  activeCategory,
}: {
  title: string;
  description?: string;
  items: Course[];
  page: number;
  base: string;
  crumbs: Crumb[];
  activeCategory?: string;
}) {
  const { items: shown, totalPages } = paginate(items, page, COURSES_PER_PAGE);
  if (page < 1 || page > totalPages) notFound();
  return (
    <>
      <HeroSection title={page > 1 ? `${title} – Page ${page}` : title} description={description} breadcrumbs={crumbs} />
      <div className="bg-surface">
        <div className="container-site py-14">
          <nav aria-label="Course categories" className="flex flex-wrap gap-2">
            <Link
              href="/shop/"
              aria-current={!activeCategory ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-medium ${!activeCategory ? "bg-navy text-white" : "border border-line bg-white text-navy hover:border-brand"}`}
            >
              All courses
            </Link>
            {courseCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/product-category/${c.slug}/`}
                aria-current={activeCategory === c.slug ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-medium ${activeCategory === c.slug ? "bg-navy text-white" : "border border-line bg-white text-navy hover:border-brand"}`}
              >
                {c.name} <span className="opacity-60">({c.courses.length})</span>
              </Link>
            ))}
          </nav>
          <p className="mt-6 text-sm text-muted">
            Showing {(page - 1) * COURSES_PER_PAGE + 1}–{(page - 1) * COURSES_PER_PAGE + shown.length} of {items.length} courses
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((c) => (
              <CourseCard key={c.path} course={c} />
            ))}
          </div>
          <Pagination base={base} current={page} total={totalPages} />
        </div>
      </div>
      <CTASection title="Need training for your team?" text="Tell us about your goals and we will recommend the right certification path." />
    </>
  );
}
