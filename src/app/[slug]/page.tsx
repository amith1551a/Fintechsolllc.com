import { notFound } from "next/navigation";
import type { Crumb } from "@/components/Breadcrumbs";
import CTASection from "@/components/CTASection";
import HeroSection from "@/components/HeroSection";
import JsonLd from "@/components/JsonLd";
import PageSections from "@/components/PageSections";
import SectionHeading from "@/components/SectionHeading";
import ServiceGrid from "@/components/ServiceGrid";
import { allPagePaths, getPage, MORE_SOLUTIONS, SERVICE_PATHS, site } from "@/lib/content";
import { abs, pageMetadata } from "@/lib/seo";

// Pages with their own route folder (custom layouts)
const DEDICATED = new Set(["/services/", "/contact-us/"]);
const LEGAL = new Set(["/privacy-policy/", "/terms-of-service/", "/cancellation-and-refund-policy/"]);

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allPagePaths()
    .filter((p) => !DEDICATED.has(p))
    .map((p) => ({ slug: p.slice(1, -1) }));
}

function load(slug: string) {
  const page = getPage(`/${slug}/`);
  return page && !DEDICATED.has(page.path) ? page : undefined;
}

export async function generateMetadata({ params }: Props) {
  const page = load((await params).slug);
  if (!page) return {};
  return pageMetadata({ title: page.title, description: page.description || `${page.title} – ${site.name}.`, path: page.path });
}

export default async function ContentPage({ params }: Props) {
  const page = load((await params).slug);
  if (!page) notFound();
  const isService = SERVICE_PATHS.includes(page.path);
  const isMore = MORE_SOLUTIONS.includes(page.path);
  const crumbs: Crumb[] = isService || isMore ? [{ label: "Services", href: "/services/" }, { label: page.title }] : [{ label: page.title }];

  return (
    <>
      {(isService || isMore) && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Service",
            name: page.title,
            description: page.description,
            url: abs(page.path),
            provider: { "@type": "Organization", name: site.name, url: abs("/") },
          }}
        />
      )}
      <HeroSection
        title={page.title}
        breadcrumbs={crumbs}
        // the meta description is clipped at ~155 chars; only show it when it is a complete sentence
        description={LEGAL.has(page.path) || page.description.endsWith("…") ? undefined : page.description}
      />
      {LEGAL.has(page.path) ? (
        <div className="container-site max-w-4xl py-14">
          <PageSections sections={page.sections} />
        </div>
      ) : (
        <PageSections sections={page.sections} partnerGrid={page.path === "/our-partners/"} />
      )}
      {(isService || isMore) && (
        <section className="bg-surface">
          <div className="container-site py-16">
            <SectionHeading title="Explore our other services" />
            <div className="mt-10">
              <ServiceGrid exclude={page.path} />
            </div>
          </div>
        </section>
      )}
      {page.path !== "/get-quote/" && page.path !== "/be-our-partner/" && <CTASection />}
    </>
  );
}
