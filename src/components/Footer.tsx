import Image from "next/image";
import Link from "next/link";
import { home, site } from "@/lib/content";
import { navigation } from "./Header";
import { Mail, MapPin, Phone, SocialIcon } from "./Icons";

export default function Footer() {
  const quick = navigation().map(({ label, href }) => ({ label, href }));
  return (
    <footer className="bg-navy text-white/80">
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Link href="/" className="inline-block rounded-lg bg-white px-3 py-2" aria-label="Fintech Solutions – home">
            <Image src={site.logoTransparent.src} width={384} height={100} alt="Fintech Solutions" className="h-10 w-auto" quality={90} />
          </Link>
          <p className="mt-5 text-sm leading-6">{site.footerAbout}</p>
          <ul className="mt-5 flex gap-3" aria-label="Social media">
            {site.social.map((s) => (
              <li key={s.network}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.network}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-amber hover:text-navy"
                >
                  <SocialIcon network={s.network} />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <nav className="lg:col-span-2" aria-label="Quick links">
          <h2 className="text-base font-semibold text-white">Quick Links</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {quick.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-amber">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/blog/" className="hover:text-amber">
                Blog
              </Link>
            </li>
          </ul>
        </nav>
        <nav className="lg:col-span-3" aria-label="Services">
          <h2 className="text-base font-semibold text-white">Services</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {home.services.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="hover:text-amber">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="lg:col-span-3">
          <h2 className="text-base font-semibold text-white">Contact Info</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
              <span>
                <span className="sr-only">Address: </span>
                {site.contact.address}
              </span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
              <a href={site.contact.phoneHref} className="hover:text-amber">
                {site.contact.phone}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
              <a href={`mailto:${site.contact.email}`} className="break-all hover:text-amber">
                {site.contact.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-3 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>{site.copyright}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {site.usefulLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-amber">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
