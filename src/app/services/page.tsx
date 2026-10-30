import Link from "next/link";
import CTASection from "@/components/CTASection";
import HeroSection from "@/components/HeroSection";
import SectionHeading from "@/components/SectionHeading";
import ServiceGrid from "@/components/ServiceGrid";
import { getPage, home, MORE_SOLUTIONS } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

const page = getPage("/services/")!;

export const metadata = pageMetadata({
  title: page.title,
  description: `${home.servicesHeading}: ${home.services.map((s) => s.title).join(", ")}.`.slice(0, 158),
  path: "/services/",
});

export default function ServicesPage() {
  const more = MORE_SOLUTIONS.map((p) => getPage(p)).filter((p) => p !== undefined);
  return (
    <>
      <HeroSection title={page.title} breadcrumbs={[{ label: page.title }]} description={home.hero.text} />
      <section className="bg-white">
        <div className="container-site py-16">
          <SectionHeading title={home.servicesHeading} />
          <div className="mt-12">
            <ServiceGrid />
          </div>
        </div>
      </section>
      <section className="bg-surface">
        <div className="container-site py-16">
          <SectionHeading title="Specialist Solutions" description="Detailed solution pages from across our practices." />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((p) => (
              <li key={p.path}>
                <Link href={p.path} className="block h-full rounded-xl border border-line bg-white p-6 shadow-sm transition hover:border-brand/40 hover:shadow-md">
                  <h3 className="font-semibold text-navy">{p.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{p.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <CTASection />
    </>
  );
}
