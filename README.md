# Fintech Solutions LLC – website (Next.js reconstruction)

Reconstruction of the historical **fintechsolllc.com** WordPress site (Wayback Machine capture of 11 July 2026) as a
Next.js App Router application. All text, images, logos, fonts, prices and contact details come from the recovered
static site in `../fintechsol-recovery`; nothing was invented. What could not be recovered is listed in
[`migration/MISSING-CONTENT.md`](migration/MISSING-CONTENT.md).

- Next.js 16.4 (App Router, Cache Components, Turbopack), React 19, TypeScript, Tailwind CSS 4, ESLint
- No runtime dependencies beyond `next`, `react`, `react-dom`; Playwright is a dev dependency for browser tests
- Original URL structure kept, including trailing slashes and WordPress permalinks (`/2025/08/11/post-slug/`)

## Local development

Requirements: Node.js 20.9+ (tested with Node 24), npm. Python 3 with `beautifulsoup4`, `lxml` and `Pillow` only if you
re-run the content migration.

```bash
npm install
cp .env.example .env.local      # optional: set FORMS_WEBHOOK_URL to receive form submissions
npm run dev                     # http://localhost:3000
```

Production build:

```bash
npm run build
npm start                       # http://localhost:3000  (npm start -- -p 3100 for another port)
```

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Base URL for canonical links, Open Graph, `sitemap.xml`, `robots.txt` (default `https://fintechsolllc.com`) |
| `FORMS_WEBHOOK_URL` | Endpoint that receives form submissions as JSON (`{ form, title, submittedAt, data }`), e.g. a CRM, Zapier/Make hook or an email-sending function |
| `FORMS_WEBHOOK_TOKEN` | Optional bearer token sent with each submission |

Forms never claim success they did not achieve: without `FORMS_WEBHOOK_URL` the API answers `503` and the form tells the
visitor the message was **not** sent, with a pre-filled email link and the phone number.

## Project structure

```
src/
  app/
    page.tsx                               enterprise homepage (copy in content/homepage.json)
    [slug]/page.tsx                        company, service, solution and legal pages (/about-us-3/, /mvp-development/, …)
    [slug]/[month]/[day]/[post]/page.tsx   blog articles at their original /YYYY/MM/DD/slug/ URLs
    services/  contact-us/                 pages with custom layouts
    blog/  blog/page/[n]/                  blog listing + WordPress-style pagination
    category/[cat]/ (+ page/[n])           blog categories
    shop/ (+ page/[n])                     IT Training catalog (original /shop/ URLs)
    product/[course]/                      course pages (original /product/slug/ URLs)
    product-category/[cat]/ (+ page/[n])   course categories
    api/forms/route.ts                     form submission endpoint (server-side validation, webhook delivery)
    sitemap.ts  robots.ts  not-found.tsx  layout.tsx  globals.css  fonts/
  components/                              Header, DesktopNavigation, MobileNavigation, Footer, HeroSection,
                                           SectionHeading, ServiceCard, ServiceGrid, PartnerGrid, IndustryCard,
                                           BlogCard, BlogSidebar, ContactSection, CTASection, Breadcrumbs,
                                           ContactForm, QuoteForm, PartnerForm, PageSections, RichContent, …
  content/                                 migrated content (JSON, generated – see below)
  lib/content.ts  lib/forms.ts  lib/seo.ts
public/assets/{blog,partners,services,images,logos,fonts}/   recovered files actually used by the site
scripts/migrate.py                         recovery → src/content + public/assets (+ migration/report.json)
scripts/missing_report.py                  writes migration/MISSING-CONTENT.md
tests/crawl.mjs  tests/e2e.spec.ts         link/SEO crawler and Playwright browser tests
```

Only Client Components: `MobileNavigation` and the form renderer. Everything else renders on the server and is
prerendered at build time (`ensureStatic = "navigation"` in the root layout).

## Content and assets

`src/content/*.json` and `public/assets/` are generated from the read-only recovery folder:

```bash
npm run migrate        # python -I scripts/migrate.py ../fintechsol-recovery . && missing_report.py
```

The migration converts Elementor/WordPress markup into sanitised semantic HTML (allow-listed tags and attributes only),
rewrites internal links to the original paths, copies only the images the content uses (largest recovered size of each
upload) and records every gap. `src/content/asset-map.json` maps each original URL to its file in `public/assets/`.
`src/content/redirects.json` lists recovered URLs whose content now lives elsewhere; `next.config.ts` turns them into
permanent redirects (plus the retired WooCommerce cart/checkout/account pages → `/shop/`).

Edit content by changing the JSON in `src/content/` (or the migration script and re-running it).

## Testing

```bash
npm run lint && npm run typecheck && npm run build
npm start -- -p 3100                                   # terminal 1
FORMS_WEBHOOK_URL=http://127.0.0.1:3199/hook npx next start -p 3101   # terminal 2 (form-delivery test)
npm run test:links                                     # crawl: sitemap, links, images, metadata, original URLs
npm run test:e2e                                       # Playwright (uses installed Microsoft Edge; PW_CHANNEL= to use bundled Chromium)
```

Results are written to `test-results/` (`crawl.json`, `e2e.json`, screenshots per viewport).

## Deployment

Not deployed. Any Node.js host that runs `next start` works (the form endpoint needs a server). Set
`NEXT_PUBLIC_SITE_URL` and `FORMS_WEBHOOK_URL` in the host's environment.
