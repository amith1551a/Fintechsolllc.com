import Link from "next/link";
import { site } from "@/lib/content";
import { HexPattern } from "./Icons";

export default function CTASection({
  title = "Let’s help you get started.",
  text = "You can fill out the form or click to schedule a meeting.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="container-site py-16">
      <div className="relative isolate overflow-hidden rounded-3xl bg-navy px-6 py-12 text-white sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-10">
        <HexPattern className="absolute -right-20 -top-20 -z-10 h-80 w-80 text-brand/30" />
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
          <p className="mt-3 text-white/80">{text}</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
          <Link href={site.ctaHref} className="btn-primary">
            {site.ctaLabel}
          </Link>
          <Link href="/contact-us/" className="btn-outline">
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
