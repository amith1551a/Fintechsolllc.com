import Image from "next/image";
import Link from "next/link";
import BlogCard from "@/components/BlogCard";
import CTASection from "@/components/CTASection";
import HeroSection from "@/components/HeroSection";
import IndustryCard from "@/components/IndustryCard";
import JsonLd from "@/components/JsonLd";
import PartnerGrid from "@/components/PartnerGrid";
import SectionHeading from "@/components/SectionHeading";
import ServiceGrid from "@/components/ServiceGrid";
import { getPage, home, industries, partners, postsByPaths, site } from "@/lib/content";
import { abs, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: site.homeTitle,
  absoluteTitle: true,
  description: home.hero.text,
  path: "/",
});

// Section order follows the archived homepage (2026-07-11): hero, why choose, services, FinTech Labs,
// certifications, insights. Industry and partner sections are added from /industry/ and /our-partners/
// (not on the archived homepage) – see MIGRATION.md.
export default function HomePage() {
  const insights = postsByPaths(home.insights).slice(0, 6);
  const about = getPage("/about-us-3/");
  const industryIntro = getPage("/industry/");
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: site.name,
          alternateName: "Fintech Solllc",
          url: abs("/"),
          logo: abs(site.logo.src),
          email: site.contact.email,
          telephone: "+1-682-434-9964",
          address: {
            "@type": "PostalAddress",
            streetAddress: "7247 Marquis Ln",
            addressLocality: "Irving",
            addressRegion: "TX",
            postalCode: "75063",
            addressCountry: "US",
          },
          sameAs: site.social.map((s) => s.href),
        }}
      />
      <HeroSection
        variant="home"
        eyebrow={site.tagline.replace(/^Fintech Solutions llc\.,\s*/i, "") || site.name}
        title={home.hero.eyebrow}
        description={home.hero.text}
      >
        <Link href="/services/" className="btn-primary">
          Our Services
        </Link>
        <Link href={site.ctaHref} className="btn-outline">
          {site.ctaLabel}
        </Link>
      </HeroSection>

      {/* Why Choose: the archive holds only the heading and a "Learn More" button; About Us carries the text */}
      <section className="border-t border-white/10 bg-navy-800">
        <div className="container-site grid items-center gap-8 py-12 lg:grid-cols-[1fr_auto]">
          <div>
            <SectionHeading title={home.whyChoose.heading} align="left" tone="light" description={about?.description} />
          </div>
          <Link href="/about-us-3/" className="btn-outline">
            {home.whyChoose.buttonLabel}
          </Link>
        </div>
      </section>

      <section className="bg-surface">
        <div className="container-site py-20">
          <SectionHeading title={home.servicesHeading} />
          <div className="mt-12">
            <ServiceGrid />
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="container-site grid items-center gap-12 py-20 lg:grid-cols-2">
          {home.labs.image && (
            <Image
              src={home.labs.image.src}
              width={home.labs.image.width ?? 600}
              height={home.labs.image.height ?? 400}
              alt="FinTech Labs – research, prototyping and experimentation"
              className="h-auto w-full rounded-2xl shadow-xl"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          )}
          <div>
            <SectionHeading title={home.labs.heading} align="left" />
            <div className="mt-6 space-y-4 text-muted">
              {home.labs.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="container-site py-20">
          <SectionHeading title="Industry Solutions" description={industryIntro?.description} />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {industries.slice(0, 3).map((i) => (
              <IndustryCard key={i.name} industry={{ ...i, features: i.features.slice(0, 3) }} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/industry/" className="btn-brand">
              All industries
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="container-site py-20">
          <SectionHeading title="Technology Partners" description={getPage("/our-partners/")?.description} />
          <div className="mt-12">
            <PartnerGrid items={partners.filter((p) => p.image).slice(0, 10)} />
          </div>
          <div className="mt-10 text-center">
            <Link href="/our-partners/" className="btn-brand">
              View all {partners.length} partners
            </Link>
          </div>
        </div>
      </section>

      {home.certifications.image && (
        <section className="bg-surface">
          <div className="container-site py-16">
            <SectionHeading title={home.certifications.heading} />
            <Image
              src={home.certifications.image.src}
              width={home.certifications.image.width ?? 1143}
              height={home.certifications.image.height ?? 156}
              alt={home.certifications.image.alt ?? "Certifications"}
              quality={90}
              className="mx-auto mt-10 h-auto w-full max-w-5xl rounded-xl bg-[#e8e8e8] mix-blend-multiply"
              sizes="(min-width: 1024px) 1024px, 100vw"
            />
          </div>
        </section>
      )}

      <section className="bg-white">
        <div className="container-site py-20">
          <SectionHeading title={home.insightsHeading} />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {insights.map((p) => (
              <BlogCard key={p.path} post={p} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/blog/" className="btn-brand">
              Read the blog
            </Link>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
