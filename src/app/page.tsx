import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import BlogCard from "@/components/BlogCard";
import CTASection from "@/components/CTASection";
import HeroSection from "@/components/HeroSection";
import { ArrowRight, CloudIcon, LayersIcon, ShieldIcon, SparkIcon } from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import PartnerGrid from "@/components/PartnerGrid";
import SectionHeading from "@/components/SectionHeading";
import { home, partners, postsByPaths, site } from "@/lib/content";
import { abs, pageMetadata } from "@/lib/seo";
import copy from "@/content/homepage.json";

export const metadata = pageMetadata({
  title: copy.title,
  absoluteTitle: true,
  description: copy.description,
  path: "/",
});

const GROUP_ICONS = { ai: SparkIcon, security: ShieldIcon, cloud: CloudIcon } as const;
const FOCUS_ICONS = [SparkIcon, ShieldIcon, CloudIcon, LayersIcon];

/** Same-tab link that uses client navigation for internal paths and a plain anchor for other sites. */
function SmartLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return href.startsWith("/") ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

// Enterprise homepage: hero, what we do, certifications (recovered image), transformation interlude, explore our solutions, partners, insights, contact. The nine services, FinTech Labs
// and industry detail from the archived homepage live on /technology-business-solutions/.
export default function HomePage() {
  const insights = postsByPaths(home.insights).slice(0, 6);
  const { hero, whatWeDo, interlude, explore, contact } = copy;
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
          description: copy.description,
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
        eyebrow={hero.eyebrow}
        title={hero.title}
        description={hero.text}
        aside={
          <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{hero.focusHeading}</p>
            <ul className="mt-4 divide-y divide-white/10">
              {hero.focus.map((f, i) => {
                const Icon = FOCUS_ICONS[i % FOCUS_ICONS.length];
                return (
                  <li key={f.title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/20 text-amber">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-semibold text-white">{f.title}</span>
                      <span className="block text-sm text-white/70">{f.text}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        }
      >
        <Link href={hero.primary.href} className="btn-primary">
          {hero.primary.label}
        </Link>
        <Link href={hero.secondary.href} className="btn-outline">
          {hero.secondary.label}
        </Link>
      </HeroSection>

      <section id="what-we-do" className="bg-white">
        <div className="container-site py-20">
          <SectionHeading eyebrow={whatWeDo.eyebrow} title={whatWeDo.heading} description={whatWeDo.text} />
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {whatWeDo.groups.map((g) => {
              const Icon = GROUP_ICONS[g.key as keyof typeof GROUP_ICONS];
              return (
                <article key={g.key} className="flex flex-col rounded-2xl border border-line bg-white p-8 shadow-sm transition-shadow hover:shadow-lg">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-amber">
                    <Icon />
                  </span>
                  <h3 className="mt-6 text-xl font-bold text-navy">{g.title}</h3>
                  <p className="mt-3 text-muted">{g.summary}</p>
                  <ul className="mt-6 flex-1 space-y-3 border-t border-line pt-6 text-sm text-ink">
                    {g.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link href={g.link.href} className="mt-8 inline-flex items-center gap-2 font-semibold text-brand-600 hover:text-navy">
                    {g.link.label}
                    <ArrowRight />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {home.certifications.image && (
        <section className="border-t border-line bg-white">
          <div className="container-site py-14">
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

      <section className="bg-surface">
        <div className="container-site grid gap-12 py-20 lg:grid-cols-2 lg:gap-16">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeading eyebrow={interlude.eyebrow} title={interlude.heading} align="left" />
            <p className="mt-6 text-lg leading-8 text-muted">{interlude.text}</p>
          </div>
          <ol className="space-y-4">
            {interlude.steps.map((s, i) => (
              <li key={s.title} className="flex gap-5 rounded-2xl border border-line bg-white p-6">
                <span className="font-[family-name:var(--font-heading)] text-3xl font-bold leading-none text-brand" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-navy">{s.title}</h3>
                  <p className="mt-2 text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-white">
        <div className="container-site py-20">
          <SectionHeading eyebrow={explore.eyebrow} title={explore.heading} />
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
            {explore.cards.map((c, i) => (
              <li key={c.href} className={i < 2 ? "lg:col-span-3" : "lg:col-span-2"}>
                <SmartLink
                  href={c.href}
                  className={`group flex h-full flex-col rounded-2xl border p-7 transition-colors ${
                    i === 0 ? "border-navy bg-navy text-white hover:bg-navy-700" : "border-line bg-surface hover:border-brand hover:bg-brand-50"
                  }`}
                >
                  <h3 className={`text-lg font-bold ${i === 0 ? "text-white" : "text-navy"}`}>{c.title}</h3>
                  <p className={`mt-2 flex-1 text-sm leading-6 ${i === 0 ? "text-white/75" : "text-muted"}`}>{c.text}</p>
                  <span className={`mt-5 inline-flex items-center gap-2 text-sm font-semibold ${i === 0 ? "text-amber" : "text-brand-600"}`}>
                    {c.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </SmartLink>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-surface">
        <div className="container-site py-20">
          <SectionHeading title="Technology Partners" />
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

      <CTASection
        title={contact.heading}
        text={contact.text}
        actions={
          <>
            <Link href={contact.primary.href} className="btn-primary">
              {contact.primary.label}
            </Link>
            <Link href={contact.secondary.href} className="btn-outline">
              {contact.secondary.label}
            </Link>
          </>
        }
      />
    </>
  );
}
