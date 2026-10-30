import CourseListing from "@/components/CourseListing";
import { courses, home } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

const NAME = home.services.find((s) => s.href === "/shop/")?.title ?? "IT Training";

export const metadata = pageMetadata({
  title: "IT Training",
  description: `${NAME}: ${courses.length} certification and training courses across cloud, cybersecurity, data science & AI, DevOps, ITSM, Agile and more.`,
  path: "/shop/",
});

export default function ShopPage() {
  return <CourseListing title="IT Training" description={NAME} items={courses} page={1} base="/shop/" crumbs={[{ label: "Services", href: "/services/" }, { label: "IT Training" }]} />;
}
