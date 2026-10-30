import Link from "next/link";
import { notFound } from "next/navigation";
import CourseCard from "@/components/CourseCard";
import HeroSection from "@/components/HeroSection";
import JsonLd from "@/components/JsonLd";
import MediaImage from "@/components/MediaImage";
import RichContent from "@/components/RichContent";
import { courses, coursesByPaths, courseSeo, getCourse, getCourseCategory, site } from "@/lib/content";
import { abs, pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ course: string }> };

export function generateStaticParams() {
  return courses.map((c) => ({ course: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const c = getCourse((await params).course);
  if (!c) return {};
  const seo = courseSeo(c);
  return pageMetadata({ title: c.title, description: seo.description, path: c.path, canonical: seo.canonical, image: c.image });
}

function priceRange(price: string | null) {
  const nums = (price ?? "").match(/\d[\d,]*\.?\d*/g)?.map((n) => Number(n.replace(/,/g, ""))) ?? [];
  return nums.length ? { low: Math.min(...nums), high: Math.max(...nums) } : null;
}

export default async function CoursePage({ params }: Props) {
  const c = getCourse((await params).course);
  if (!c) notFound();
  const cat = c.categories[0];
  const related = cat
    ? coursesByPaths(getCourseCategory(cat.slug)?.courses ?? [])
        .filter((x) => x.path !== c.path)
        .slice(0, 4)
    : [];
  const range = priceRange(c.price);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: c.title,
          description: c.description,
          url: abs(c.path),
          provider: { "@type": "Organization", name: site.name, sameAs: abs("/") },
          ...(range
            ? { offers: { "@type": "AggregateOffer", priceCurrency: "USD", lowPrice: range.low, highPrice: range.high, category: "Paid" } }
            : {}),
        }}
      />
      <HeroSection
        title={c.title}
        breadcrumbs={[
          { label: "IT Training", href: "/shop/" },
          ...(cat ? [{ label: cat.name, href: `/product-category/${cat.slug}/` }] : []),
          { label: c.title },
        ]}
      />
      <section className="bg-surface">
        <div className="container-site grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 rounded-2xl border border-line bg-white p-6 sm:p-10">
            {c.shortDescription && <RichContent html={c.shortDescription} className="[&_p]:text-lg [&_p]:leading-8 [&_p]:text-ink" />}
            {c.html && <RichContent html={c.html} className="mt-8" />}
          </div>
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <MediaImage image={c.image} label={c.title} fit="contain" className="aspect-[4/3] rounded-2xl border border-line bg-white" sizes="360px" />
            <div className="rounded-2xl border border-line bg-white p-6">
              {c.price && (
                <>
                  <p className="text-sm text-muted">Price</p>
                  <p className="mt-1 text-2xl font-bold text-navy">{c.price}</p>
                </>
              )}
              {c.packages.length > 0 && (
                <>
                  <p className="mt-5 text-sm font-semibold text-navy">Packages</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted">
                    {c.packages.map((p) => (
                      <li key={p}>• {p}</li>
                    ))}
                  </ul>
                </>
              )}
              <p className="mt-5 text-xs text-muted">
                Online enrolment and checkout from the original site are not available. Contact us to enrol.
              </p>
              <Link href="/contact-us/" className="btn-primary mt-4 w-full">
                Enquire about this course
              </Link>
            </div>
          </aside>
        </div>
      </section>
      {related.length > 0 && (
        <section className="bg-white">
          <div className="container-site py-14">
            <h2 className="text-2xl font-bold text-navy">More {cat?.name} courses</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => (
                <CourseCard key={r.path} course={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
