import { defineConfig, devices } from "@playwright/test";

// Runs against an already started production server: `npm run build && npm start -- -p 3100`
export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.spec\.ts/,
  outputDir: "test-results/playwright",
  timeout: 60_000,
  workers: 4,
  reporter: [["list"], ["json", { outputFile: "test-results/e2e.json" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3100",
    ...devices["Desktop Chrome"],
    // Installed Chromium-based browser; set PW_CHANNEL="" to use Playwright's bundled Chromium instead
    channel: process.env.PW_CHANNEL ?? "msedge",
  },
});
