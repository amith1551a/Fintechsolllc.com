import { contact, site } from "@/lib/content";
import { Mail, MapPin, Phone } from "./Icons";

/** Offices, phone lines and emails exactly as listed on the recovered Contact page. */
export default function ContactSection() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-navy p-7 text-white">
        <h2 className="text-xl font-semibold">Reach out to Us</h2>
        <ul className="mt-5 space-y-4 text-sm">
          {contact.phoneLines.map((l) => (
            <li key={l} className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
              <span>
                {l.split(":")[0]}:{" "}
                <a href={site.contact.phoneHref} className="font-semibold hover:text-amber">
                  {l.split(":").slice(1).join(":").trim()}
                </a>
              </span>
            </li>
          ))}
          {contact.emails.map((e) => (
            <li key={e} className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
              <a href={`mailto:${e}`} className="font-semibold hover:text-amber">
                {e}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-line bg-white p-7">
        <h2 className="text-xl font-semibold text-navy">Our Offices</h2>
        <ul className="mt-5 space-y-5">
          {contact.offices.map((o) => (
            <li key={o.name} className="flex gap-3">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-navy">{o.name}</p>
                <p className="mt-1 text-sm text-muted">{o.address}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
