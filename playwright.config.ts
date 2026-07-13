import { defineConfig, devices } from "@playwright/test";

const PORT = 4321;
const baseURL = process.env.BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile-s",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 360, height: 720 },
      },
    },
    {
      name: "mobile-l",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 480, height: 800 },
      },
    },
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "desktop-2xl",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1536, height: 1000 },
      },
    },
  ],
  webServer: {
    command: "pnpm preview",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
});
