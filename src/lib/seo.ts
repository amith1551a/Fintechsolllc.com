import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://fintechsolllc.com").replace(/\/$/, "");
export const SITE_NAME = "Fintech Solllc"; // brand string used in every original <title>
const DEFAULT_IMAGE = "/assets/logos/2025-03-logo.jpg";

/** Page metadata in the original "<Title> – Fintech Solllc" format, with canonical, Open Graph and Twitter. */
export function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  absoluteTitle,
  publishedTime,
  canonical = path,
}: {
  title: string;
  description: string;
  path: string;
  canonical?: string;
  image?: { src: string; width?: number | null; height?: number | null; alt?: string } | null;
  type?: "website" | "article";
  absoluteTitle?: boolean;
  publishedTime?: string;
}): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} – ${SITE_NAME}`;
  const img = image ?? { src: DEFAULT_IMAGE, width: 1920, height: 500, alt: "Fintech Solutions logo" };
  const images = [{ url: img.src, width: img.width ?? undefined, height: img.height ?? undefined, alt: img.alt || title }];
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical },
    openGraph: {
      type,
      title: fullTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "en_US",
      images,
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: fullTitle, description, images: [img.src] },
  };
}

export function abs(path: string) {
  return SITE_URL + path;
}
