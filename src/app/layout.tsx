import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

// Fonts recovered from the original site's self-hosted Google Fonts (latin subsets)
const ubuntu = localFont({
  src: [
    { path: "./fonts/ubuntu-400.woff2", weight: "400" },
    { path: "./fonts/ubuntu-500.woff2", weight: "500" },
    { path: "./fonts/ubuntu-700.woff2", weight: "700" },
  ],
  variable: "--font-ubuntu",
  display: "swap",
});
const poppins = localFont({
  src: [
    { path: "./fonts/poppins-400.woff2", weight: "400" },
    { path: "./fonts/poppins-600.woff2", weight: "600" },
  ],
  variable: "--font-poppins",
  display: "swap",
});
const lato = localFont({
  src: [
    { path: "./fonts/lato-400.woff2", weight: "400" },
    { path: "./fonts/lato-700.woff2", weight: "700" },
  ],
  variable: "--font-lato",
  display: "swap",
});

// Every page is built from migrated static content. Requiring fully static output also makes unknown
// dynamic params render statically before responding, so notFound() returns a real 404 (not a streamed 200).
export const ensureStatic = "navigation";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s – ${SITE_NAME}` },
  applicationName: SITE_NAME,
  icons: { icon: "/favicon.ico" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#021637",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${ubuntu.variable} ${poppins.variable} ${lato.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only z-50 rounded bg-amber px-4 py-2 font-semibold text-navy focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
