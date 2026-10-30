import { notFound } from "next/navigation";
import CourseListing from "@/components/CourseListing";
import { courseCategories, coursesByPaths, COURSES_PER_PAGE, getCourseCategory, pageNumbers } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ cat: string; n: string }> };

export function generateStaticParams() {
  return courseCategories.flatMap((c) => pageNumbers(c.courses.length, COURSES_PER_PAGE).map((n) => ({ cat: c.slug, n })));
}

export async function generateMetadata({ params }: Props) {
  const { cat, n } = await params;
  const c = getCourseCategory(cat);
  if (!c) return {};
  return pageMetadata({
    title: `${c.name} Courses – Page ${n}`,
    description: `${c.name} training courses from Fintech Solutions IT Training – page ${n}.`,
    path: `/product-category/${c.slug}/page/${n}/`,
  });
}

export default async function CourseCategoryPaged({ params }: Props) {
  const { cat, n } = await params;
  const c = getCourseCategory(cat);
  const page = Number(n);
  if (!c || !/^\d+$/.test(n) || page < 2) notFound();
  return (
    <CourseListing
      title={c.name}
      items={coursesByPaths(c.courses)}
      page={page}
      base={`/product-category/${c.slug}/`}
      activeCategory={c.slug}
      crumbs={[{ label: "IT Training", href: "/shop/" }, { label: c.name, href: `/product-category/${c.slug}/` }, { label: `Page ${page}` }]}
    />
  );
}
