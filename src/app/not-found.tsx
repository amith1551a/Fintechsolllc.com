import Link from "next/link";
import HeroSection from "@/components/HeroSection";

export default function NotFound() {
  return (
    <>
      <HeroSection title="Page not found" description="The page you are looking for does not exist or was not part of the recovered website." />
      <div className="container-site flex flex-wrap gap-3 py-14">
        <Link href="/" className="btn-brand">
          Go to the homepage
        </Link>
        <Link href="/services/" className="btn border border-line text-navy hover:border-brand">
          Our services
        </Link>
        <Link href="/blog/" className="btn border border-line text-navy hover:border-brand">
          Blog
        </Link>
      </div>
    </>
  );
}
