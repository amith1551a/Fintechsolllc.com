import Image from "next/image";
import Link from "next/link";
import CTASection from "@/components/CTASection";
import HeroSection from "@/components/HeroSection";
import IndustryCard from "@/components/IndustryCard";
import JsonLd from "@/components/JsonLd";
import SectionHeading from "@/components/SectionHeading";
import ServiceCard from "@/components/ServiceCard";
import { home, industries, site } from "@/lib/content";
import { abs, pageMetadata } from "@/lib/seo";
import solutions from "@/content/technology-business-solutions.json";

export const metadata = pageMetadata({
  title: solutions.title,
  description: solutions.description,
  path: solutions.path,
});

export default function TechnologyBusinessSolutionsPage() {
  const sectors = solutions.industries
    .map((name) => industries.find((i) => i.name === name))
    .filter((i) => i !== undefined);
  const { contact } = solutions;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: solutions.title,
          description: solutions.description,
          url: abs(solutions.path),
          mainEntity: {
            "@type": "ItemList",
            itemListElement: solutions.services.map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: s.title,
              url: abs(s.href),
            })),
          },
        }}
      />
      <HeroSection
        title={solutions.title}
        breadcrumbs={[{ label: solutions.navLabel }]}
        description={solutions.overview[0]}
      />

      <section className="bg-white">
        <div className="container-site py-12">
          <p className="mx-auto max-w-3xl text-center text-base leading-7 text-muted">{solutions.overview[1]}</p>
        </div>
      </section>

      <section className="bg-surface">
        <div className="container-site py-20">
          <SectionHeading title={solutions.servicesHeading} />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {solutions.services.map((s, i) => (
              <ServiceCard key={s.href} title={s.title} href={s.href} description={s.description} index={i + 1} clamp={false} />
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-muted">
            {solutions.aiNote.text}{" "}
            {/* plain anchor: the AI Solutions page is not built yet, so avoid prefetching it */}
            <a href={solutions.aiNote.href} className="font-semibold text-brand-600 hover:text-navy">
              {solutions.aiNote.label}
            </a>
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="container-site py-20">
          <SectionHeading title={solutions.industriesHeading} />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sectors.map((i) => (
              <IndustryCard key={i.name} industry={i} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/industry/" className="btn-brand">
              All industries
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-surface">
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
              <p>{solutions.labsClosing}</p>
            </div>
          </div>
        </div>
      </section>

      <CTASection title={contact.heading} text={contact.text}>
        <ul className="mt-5 space-y-1 text-sm text-white/80">
          <li>{contact.address}</li>
          <li>
            <a href={site.contact.phoneHref} className="hover:text-amber">
              {contact.phone}
            </a>
          </li>
          <li>
            <a href={`mailto:${site.contact.email}`} className="hover:text-amber">
              {site.contact.email}
            </a>
          </li>
        </ul>
      </CTASection>
    </>
  );
}
