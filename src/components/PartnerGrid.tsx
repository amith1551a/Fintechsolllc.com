import Image from "next/image";
import Link from "next/link";
import type { Partner } from "@/lib/content";

export default function PartnerGrid({ items }: { items: Partner[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((p) => (
        <li key={p.href}>
          <Link
            href={p.href}
            className="group flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-line bg-white p-4 text-center shadow-sm transition hover:border-brand/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand"
          >
            {p.image ? (
              <span className="relative block aspect-[43/30] w-full">
                <Image src={p.image.src} alt={`${p.name} logo`} fill sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 45vw" className="object-contain" quality={90} />
              </span>
            ) : (
              <span className="flex aspect-[43/30] w-full items-center justify-center rounded-lg bg-brand-50 px-2 font-[family-name:var(--font-heading)] text-lg font-bold text-navy">
                {p.name.split(":")[0]}
              </span>
            )}
            <span className="text-sm font-semibold text-navy group-hover:text-brand-600">{p.name.split(":")[0]}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
