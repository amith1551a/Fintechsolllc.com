import Image from "next/image";
import Link from "next/link";
import solutions from "@/content/technology-business-solutions.json";
import { site, type NavItem } from "@/lib/content";
import DesktopNavigation from "./DesktopNavigation";
import MobileNavigation from "./MobileNavigation";
import { Mail, MapPin, Phone, SocialIcon } from "./Icons";

/**
 * Header item that replaces the original "Services" menu: no submenu, links to the Technology & Business Solutions
 * page (which lists all nine services). Defined here so `npm run migrate` (which rewrites site.json) keeps it.
 */
const BUSINESS_SERVICES: NavItem = { label: "Business Services", href: solutions.path };

/** Original menu with "Services" (and the service list the archive kept under "Home") replaced by BUSINESS_SERVICES. */
export function navigation(): NavItem[] {
  return site.nav.flatMap((n) => {
    if (n.href === "/") return [{ label: n.label, href: n.href }];
    if (n.href === "/services/") return [BUSINESS_SERVICES];
    return n.href === BUSINESS_SERVICES.href ? [] : [n];
  });
}

export default function Header() {
  const nav = navigation();
  const cta = { label: site.ctaLabel, href: site.ctaHref };
  return (
    <header className="sticky top-0 z-40 bg-white/95 shadow-[0_1px_0_var(--color-line)] backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="hidden bg-navy text-[13px] text-white/85 md:block">
        <div className="container-site flex h-9 items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <a href={site.contact.phoneHref} className="flex items-center gap-1.5 hover:text-amber">
              <Phone className="h-3.5 w-3.5" /> {site.contact.phone}
            </a>
            <a href={`mailto:${site.contact.email}`} className="flex items-center gap-1.5 hover:text-amber">
              <Mail className="h-3.5 w-3.5" /> {site.contact.email}
            </a>
            <span className="hidden items-center gap-1.5 lg:flex">
              <MapPin className="h-3.5 w-3.5" /> {site.contact.address}
            </span>
          </div>
          <ul className="flex items-center gap-3" aria-label="Social media">
            {site.social.map((s) => (
              <li key={s.network}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-amber" aria-label={s.network}>
                  <SocialIcon network={s.network} className="h-3.5 w-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container-site relative flex h-20 items-center justify-between gap-4">
        <Link href="/" className="shrink-0 rounded focus-visible:outline-2 focus-visible:outline-brand" aria-label="Fintech Solutions – home">
          <Image
            src={site.logoTransparent.src}
            width={site.logoTransparent.width ?? 384}
            height={site.logoTransparent.height ?? 100}
            alt="Fintech Solutions"
            className="h-11 w-auto sm:h-12"
            quality={90}
            preload
          />
        </Link>
        <DesktopNavigation items={nav} />
        <div className="flex items-center gap-3">
          <Link href={cta.href} className="btn-primary hidden sm:inline-flex">
            {cta.label}
          </Link>
          <MobileNavigation items={nav} cta={cta} />
        </div>
      </div>
    </header>
  );
}
