import { notFound } from "next/navigation";
import CourseListing from "@/components/CourseListing";
import { courses, COURSES_PER_PAGE, pageNumbers } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ n: string }> };

export function generateStaticParams() {
  return pageNumbers(courses.length, COURSES_PER_PAGE).map((n) => ({ n }));
}

export async function generateMetadata({ params }: Props) {
  const { n } = await params;
  return pageMetadata({
    title: `IT Training – Page ${n}`,
    description: `IT training and certification courses from Fintech Solutions – page ${n} of the course catalog.`,
    path: `/shop/page/${n}/`,
  });
}

export default async function ShopPaged({ params }: Props) {
  const { n } = await params;
  const page = Number(n);
  if (!/^\d+$/.test(n) || page < 2) notFound();
  return (
    <CourseListing
      title="IT Training"
      items={courses}
      page={page}
      base="/shop/"
      crumbs={[{ label: "Services", href: "/services/" }, { label: "IT Training", href: "/shop/" }, { label: `Page ${page}` }]}
    />
  );
}
