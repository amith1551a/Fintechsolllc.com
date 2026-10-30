import ContactForm from "@/components/ContactForm";
import ContactSection from "@/components/ContactSection";
import HeroSection from "@/components/HeroSection";
import JsonLd from "@/components/JsonLd";
import { contact, getPage, site } from "@/lib/content";
import { abs, pageMetadata } from "@/lib/seo";

const page = getPage("/contact-us/")!;
const [greeting, sub] = contact.intro; // "Let’s help you get started." / "You can fill out the form…"

export const metadata = pageMetadata({
  title: page.title,
  description: `${greeting} ${sub} Offices in ${contact.offices.map((o) => o.name.replace(/\s*\/.*$/, "")).join(", ")}.`,
  path: "/contact-us/",
});

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          url: abs("/contact-us/"),
          mainEntity: {
            "@type": "Organization",
            name: site.name,
            email: contact.emails,
            telephone: "+1-682-434-9964",
            location: contact.offices.map((o) => ({ "@type": "Place", name: o.name, address: o.address })),
          },
        }}
      />
      <HeroSection title="Contact Our Team" breadcrumbs={[{ label: page.title }]} description={`${greeting} ${sub}`} />
      <section className="bg-surface">
        <div className="container-site grid gap-10 py-14 lg:grid-cols-[1fr_380px]">
          <ContactForm />
          <ContactSection />
        </div>
      </section>
    </>
  );
}
