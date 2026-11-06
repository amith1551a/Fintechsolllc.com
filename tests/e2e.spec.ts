import http from "node:http";
import { expect, test, type Page } from "@playwright/test";

const ARTICLE = "/2025/08/11/how-startups-can-launch-in-the-u-s-without-leaving-home-a-step-by-step-playbook/";
const PAGES = [
  "/",
  "/about-us-3/",
  "/services/",
  "/technology-business-solutions/",
  "/mvp-development/",
  "/industry/",
  "/our-partners/",
  "/contact-us/",
  "/get-quote/",
  "/blog/",
  ARTICLE,
  "/shop/",
  "/product/angular-certification-training/",
];
const WIDTHS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "laptop", width: 1024, height: 768 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

async function brokenImages(page: Page) {
  // lazy images: scroll through the page slowly enough for every image to be requested
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
  });
  await page.waitForLoadState("networkidle");
  return page.evaluate(() =>
    Array.from(document.images)
      .filter((i) => !i.complete || i.naturalWidth === 0)
      .map((i) => i.currentSrc || i.src),
  );
}

for (const vp of WIDTHS) {
  test.describe(`responsive @ ${vp.name} ${vp.width}px`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });
    for (const path of PAGES) {
      test(`${path} has no horizontal overflow and all images load`, async ({ page }) => {
        const res = await page.goto(path);
        expect(res?.status()).toBe(200);
        await expect(page.locator("h1")).toHaveCount(1);
        expect(await brokenImages(page)).toEqual([]);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, "horizontal overflow in px").toBeLessThanOrEqual(0);
        const name = path === "/" ? "home" : path.replace(/^\/|\/$/g, "").replace(/\//g, "_").slice(0, 60);
        await page.screenshot({ path: `test-results/screenshots/${vp.name}/${name}.png`, fullPage: true });
      });
    }
  });
}

test.describe("homepage", () => {
  test("keeps the archived section order", async ({ page }) => {
    await page.goto("/");
    const headings = await page.locator("main h2").allInnerTexts();
    const order = [
      "Why Choose Fintech Solutions?",
      "Our Company Services",
      "FinTech Labs: Driving Innovation and Digital Transformation",
      "Industry Solutions",
      "Technology Partners",
      "Certifications",
      "Insights & Innovations",
    ];
    const idx = order.map((h) => headings.findIndex((x) => x.trim() === h));
    expect(idx.every((i) => i >= 0), `missing: ${order.filter((_, k) => idx[k] < 0)}`).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
    await expect(page.locator("main a[href='/mvp-development/']").first()).toBeVisible();
  });

  test("Why Choose 'Learn More' links to Our Solutions", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main").getByRole("link", { name: "Learn More", exact: true })).toHaveAttribute("href", "/technology-business-solutions/");
  });
});

test.describe("technology & business solutions page", () => {
  const PATH = "/technology-business-solutions/";
  const SERVICES = [
    ["Global Startup Consulting Services", "/global-startup-consulting-services/"],
    ["MVP Development and Rapid Prototyping", "/mvp-development/"],
    ["Cybersecurity Assessments and IAM Implementations", "/cybersecurity/"],
    ["Digital Marketing Strategy and Campaign Execution", "/digital-marketing-strategy-and-campaign-execution/"],
    ["AI, Blockchain, QA and Automation Testing", "/ai-blockchain-qa-and-automation-testing/"],
    ["IT Training, Continuous Learning, Skill Development and Exam Preparation", "/shop/"],
    ["Onshore / Back Office Solutions", "/back-office-and-fintech-solutions/"],
    ["Enterprise IT Cost Reduction & Reorganization", "/enterprise-it-cost-reduction-enterprise-reorganization/"],
    ["Real Estate Asset Management", "/real-estate-asset-management/"],
  ];

  test("has the title, H1, breadcrumb, sections, services and SEO metadata", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    const res = await page.goto(PATH);
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle("Technology & Business Solutions – Fintech Solllc");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Technology & Business Solutions");
    const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(crumbs.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    await expect(crumbs.locator("[aria-current='page']")).toHaveText("Our Solutions");

    const h2 = (await page.locator("main h2").allInnerTexts()).map((t) => t.trim());
    for (const h of ["Our Services", "Industries We Serve", "FinTech Labs: Driving Innovation and Digital Transformation", "Contact Us"])
      expect(h2, h).toContain(h);
    const h3 = (await page.locator("main h3").allInnerTexts()).map((t) => t.trim());
    for (const [name, href] of SERVICES) {
      expect(h3, name).toContain(name);
      await expect(page.locator(`main a[href='${href}']`).first()).toBeVisible();
    }
    for (const i of ["Startups & Small Enterprises", "Legal & Financial Services", "Healthcare & Insurance"])
      await expect(page.locator("main").getByText(i, { exact: true })).toBeVisible();
    await expect(page.locator("main").getByText("HIPAA Compliance:")).toBeVisible();
    // AI offerings live on their own page; this page only points there
    await expect(page.locator("main a[href='/ai-solutions/']")).toHaveText("AI Solutions");
    await expect(page.locator("main").getByText("Agentic AI", { exact: false })).toHaveCount(0);
    await expect(page.locator("main a[href='/get-quote/']")).toHaveCount(1);
    await expect(page.locator("main a[href='/contact-us/']")).toHaveCount(1);

    const site = "https://fintechsolllc.com";
    await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", `${site}${PATH}`);
    await expect(page.locator("meta[property='og:title']")).toHaveAttribute("content", "Technology & Business Solutions – Fintech Solllc");
    await expect(page.locator("meta[name='description']")).toHaveAttribute("content", /^Explore FintechSol LLC's technology and business solutions/);
    expect(errors).toEqual([]);
  });

  test("'Our Solutions' appears once in the desktop menu and navigates", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Our Solutions", exact: true })).toHaveCount(1);
    await nav.getByRole("link", { name: "Our Solutions", exact: true }).click();
    await expect(page).toHaveURL(/\/technology-business-solutions\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Technology & Business Solutions");
  });

  test("'Our Solutions' is in the mobile menu", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("navigation", { name: "Mobile" });
    await menu.getByRole("link", { name: "Our Solutions", exact: true }).click();
    await expect(page).toHaveURL(/\/technology-business-solutions\/$/);
  });

  test("is listed in the sitemap once", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml.match(/\/technology-business-solutions\/<\/loc>/g)?.length).toBe(1);
  });
});

test.describe("navigation", () => {
  test("desktop dropdown lists the services and navigates", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("link", { name: "Services", exact: true }).hover();
    const item = nav.getByRole("link", { name: "MVP Development" });
    await expect(item).toBeVisible();
    await item.click();
    await expect(page).toHaveURL(/\/mvp-development\/$/);
    // after client navigation the previous route stays mounted but hidden (React Activity): query visible only
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("MVP Development");
  });

  test("mobile menu opens, expands a submenu, navigates and closes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
    const toggle = page.getByRole("button", { name: "Open menu" });
    await toggle.click();
    const menu = page.getByRole("navigation", { name: "Mobile" });
    await expect(menu).toBeVisible();
    await menu.getByText("Services", { exact: true }).click();
    await menu.getByRole("link", { name: "Cybersecurity", exact: true }).click();
    await expect(page).toHaveURL(/\/cybersecurity\/$/);
    await expect(menu).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
  });

  test("breadcrumbs link back up the hierarchy", async ({ page }) => {
    await page.goto("/product/angular-certification-training/");
    const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
    await crumbs.getByRole("link", { name: "IT Training" }).click();
    await expect(page).toHaveURL(/\/shop\/$/);
  });

  test("blog pagination keeps WordPress URLs", async ({ page }) => {
    await page.goto("/blog/");
    await page.getByRole("navigation", { name: "Pagination" }).getByRole("link", { name: "2", exact: true }).click();
    await expect(page).toHaveURL(/\/blog\/page\/2\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Page 2");
  });
});

test.describe("historical URLs", () => {
  test("date-based article URL renders the article", async ({ page }) => {
    const res = await page.goto(ARTICLE);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("How Startups Can Launch in the U.S. Without Leaving Home: A Step-by-Step Playbook");
    await expect(page.locator("time").first()).toHaveAttribute("datetime", "2025-08-11");
    await expect(page).toHaveTitle(/– Fintech Solllc$/);
  });

  test("unknown article, page and course URLs return 404", async ({ request }) => {
    for (const p of ["/2025/08/11/not-a-post/", "/not-a-page/", "/product/not-a-course/", "/category/not-a-category/"]) {
      expect((await request.get(p)).status(), p).toBe(404);
    }
  });

  test("retired e-commerce and empty listing URLs redirect", async ({ request }) => {
    for (const [from, to] of [
      ["/cart/", "/shop/"],
      ["/my-account/lost-password/", "/shop/"],
      ["/product-category/microsoft-azure/", "/shop/"],
      ["/category/business/page/4/", "/category/business/"],
    ]) {
      const res = await request.get(from, { maxRedirects: 0 });
      expect([301, 308], from).toContain(res.status());
      expect(new URL(res.headers().location, "http://x").pathname, from).toBe(to);
    }
  });
});

test.describe("forms", () => {
  test("quote form validates required fields, email and budget", async ({ page }) => {
    await page.goto("/get-quote/");
    const form = page.locator("form").first();
    await form.getByRole("button", { name: "Submit" }).click();
    await expect(form.getByText("Email is required.")).toBeVisible();
    await expect(form.getByText("Requirement is required.")).toBeVisible();
    await expect(form.getByText("Choose Yes or No.").or(form.getByText("Scope defined? is required."))).toBeVisible();
    await form.getByLabel("Email").fill("not-an-email");
    await form.getByLabel("Budget (Min. $1000)").fill("500");
    await form.getByRole("button", { name: "Submit" }).click();
    await expect(form.getByText("Enter a valid email address.")).toBeVisible();
    await expect(form.getByText("Budget (Min. $1000) must be at least 1000.")).toBeVisible();
    await expect(form.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
  });

  test("without a configured delivery endpoint the form says it was NOT sent", async ({ page }) => {
    await page.goto("/contact-us/");
    const form = page.locator("form").first();
    await form.getByLabel("Email").fill("tester@example.com");
    await form.getByLabel("Company Name").fill("Example Co");
    await form.getByLabel("Job Title").fill("CTO");
    await form.getByLabel("Country/Region").fill("United States");
    await form.getByLabel("Phone No.").fill("+1 555 010 0000");
    await form.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Online submission is not available yet – your message has not been sent.")).toBeVisible();
    await expect(page.getByText("Thank you")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "send it by email" })).toHaveAttribute("href", /^mailto:amith@fintechsolllc\.com\?subject=/);
  });

  test("API rejects invalid submissions server-side", async ({ request }) => {
    const res = await request.post("/api/forms/", { data: { kind: "quote", data: { email: "x" } } });
    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body.errors.email).toBeTruthy();
    expect(body.errors.budget).toBeTruthy();
  });

  // Needs a second server started with FORMS_WEBHOOK_URL=http://127.0.0.1:3199/hook (see README "Testing").
  test("success is shown only after the webhook accepted the submission", async ({ page }) => {
    const base = process.env.WEBHOOK_BASE_URL || "http://localhost:3101";
    const up = await fetch(base).then(() => true, () => false);
    test.skip(!up, `no webhook-enabled server at ${base}`);
    const received: unknown[] = [];
    const server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        received.push(JSON.parse(body));
        res.writeHead(200).end("ok");
      });
    });
    await new Promise<void>((r) => server.listen(3199, "127.0.0.1", r));
    try {
      await page.goto(`${base}/be-our-partner/`);
      const form = page.locator("form").first();
      await form.getByLabel("Email").fill("partner@example.com");
      await form.getByLabel("Contact No.").fill("+1 555 010 0001");
      await form.getByLabel("Company Name").fill("Partner Co");
      await form.getByLabel("Website").fill("https://partner.example.com");
      await form.getByRole("button", { name: "Submit" }).click();
      await expect(page.getByText("Thank you – your request has been sent.")).toBeVisible();
      expect(received).toHaveLength(1);
      expect(received[0]).toMatchObject({ form: "partner", data: { email: "partner@example.com", company: "Partner Co" } });
    } finally {
      server.close();
    }
  });
});
