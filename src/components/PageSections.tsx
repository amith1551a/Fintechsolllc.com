import { postsByPaths, partners, type Part } from "@/lib/content";
import BlogCard from "./BlogCard";
import ContactForm from "./ContactForm";
import PartnerForm from "./PartnerForm";
import PartnerGrid from "./PartnerGrid";
import QuoteForm from "./QuoteForm";
import RichContent from "./RichContent";

/** Renders a migrated page: one <section> per original Elementor top-level section, alternating backgrounds. */
export default function PageSections({ sections, partnerGrid = false }: { sections: Part[][]; partnerGrid?: boolean }) {
  return (
    <>
      {sections.map((parts, i) => (
        <section key={i} className={i % 2 === 1 ? "bg-surface" : "bg-white"}>
          <div className="container-site space-y-10 py-14 sm:py-16">
            {parts.map((part, j) => (
              <PartView key={j} part={part} partnerGrid={partnerGrid} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function PartView({ part, partnerGrid }: { part: Part; partnerGrid: boolean }) {
  if (part.type === "html") return <RichContent html={part.html} className="max-w-none" />;
  if (part.type === "form") {
    const Form = part.form === "quote" ? QuoteForm : part.form === "partner" ? PartnerForm : ContactForm;
    return (
      <div className="mx-auto max-w-3xl">
        <Form />
      </div>
    );
  }
  if (partnerGrid) {
    const set = new Set(part.paths);
    return <PartnerGrid items={partners.filter((p) => set.has(p.href))} />;
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {postsByPaths(part.paths).map((p) => (
        <BlogCard key={p.path} post={p} />
      ))}
    </div>
  );
}
