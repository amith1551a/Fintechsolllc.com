import { notFound } from "next/navigation";
import CourseListing from "@/components/CourseListing";
import { courseCategories, coursesByPaths, getCourseCategory } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ cat: string }> };

export function generateStaticParams() {
  return courseCategories.map((c) => ({ cat: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const c = getCourseCategory((await params).cat);
  if (!c) return {};
  return pageMetadata({
    title: `${c.name} Courses`,
    description: `${c.name} training and certification courses (${c.courses.length}) from Fintech Solutions IT Training.`,
    path: `/product-category/${c.slug}/`,
  });
}

export default async function CourseCategoryPage({ params }: Props) {
  const c = getCourseCategory((await params).cat);
  if (!c) notFound();
  return (
    <CourseListing
      title={c.name}
      description="IT Training course category"
      items={coursesByPaths(c.courses)}
      page={1}
      base={`/product-category/${c.slug}/`}
      activeCategory={c.slug}
      crumbs={[{ label: "IT Training", href: "/shop/" }, { label: c.name }]}
    />
  );
}
