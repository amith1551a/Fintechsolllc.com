"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { NavItem } from "@/lib/content";
import { ChevronDown } from "./Icons";

export default function MobileNavigation({ items, cta }: { items: NavItem[]; cta: { label: string; href: string } }) {
  const pathname = usePathname();
  // The menu is open only for the path it was opened on, so navigating closes it (the header stays mounted).
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpenOn(open ? null : pathname)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line text-navy focus-visible:outline-2 focus-visible:outline-brand"
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          {open ? <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" /> : <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      <div
        id="mobile-menu"
        hidden={!open}
        className="absolute inset-x-0 top-full max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-line bg-white shadow-xl"
      >
        <nav aria-label="Mobile" className="container-site py-4">
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.href}>
                {item.children ? (
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-semibold text-navy">
                      {item.label}
                      <ChevronDown className="h-5 w-5 text-brand transition-transform group-open:rotate-180" />
                    </summary>
                    <ul className="mb-3 space-y-1 border-l-2 border-brand-50 pl-4">
                      <li>
                        <Link href={item.href} className="block py-2 text-sm font-medium text-brand-600">
                          {item.label} overview
                        </Link>
                      </li>
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} className="block py-2 text-sm text-ink">
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <Link href={item.href} className="block py-3 font-semibold text-navy">
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <Link href={cta.href} className="btn-primary mt-4 w-full">
            {cta.label}
          </Link>
        </nav>
      </div>
    </div>
  );
}
