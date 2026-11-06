import Link from "next/link";
import type { NavItem } from "@/lib/content";
import { ChevronDown } from "./Icons";

// CSS-only dropdowns (hover and keyboard focus-within), so the desktop menu stays a Server Component.
export default function DesktopNavigation({ items }: { items: NavItem[] }) {
  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-0.5">
        {items.map((item, index) => (
          <li key={item.href} className="group relative">
            <Link
              href={item.href}
              className="flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-2 font-[family-name:var(--font-nav)] text-[14px] font-bold xl:px-3 xl:text-[15px] text-navy transition-colors hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-brand"
              aria-haspopup={item.children ? "true" : undefined}
            >
              {item.label}
              {item.children && <ChevronDown className="h-4 w-4 text-brand transition-transform group-hover:rotate-180" />}
            </Link>
            {item.children && (
              // menus in the right half open leftwards so the (invisible) panel never widens the page
              <ul className={`${index < items.length / 2 ? "left-0" : "right-0"} invisible absolute top-full z-50 w-80 translate-y-2 rounded-xl border border-line bg-white p-2 opacity-0 shadow-xl transition duration-150 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100`}>
                {item.children.map((child) => (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      className="block rounded-lg px-3 py-2 text-sm text-ink transition-colors hover:bg-brand-50 hover:text-brand-600 focus-visible:bg-brand-50 focus-visible:outline-none"
                    >
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
