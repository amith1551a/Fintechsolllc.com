import { getPage, home, shopPage } from "@/lib/content";
import ServiceCard from "./ServiceCard";

/** The nine services from the original homepage, each described with its own page's opening text. */
export default function ServiceGrid({ exclude }: { exclude?: string }) {
  const items = home.services.filter((s) => s.href !== exclude);
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((s, i) => {
        const page = s.href === "/shop/" ? shopPage : getPage(s.href);
        return <ServiceCard key={s.href} title={s.title} href={s.href} description={page?.description} index={i + 1} />;
      })}
    </div>
  );
}
