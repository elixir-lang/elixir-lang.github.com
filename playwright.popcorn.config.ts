import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

const baseURL = process.env.BASE_URL || "http://127.0.0.1:4322";

export default defineConfig({
  ...config,
  testMatch: "popcorn.spec.ts",
  workers: 2,
  use: { ...config.use, baseURL },
  projects: config.projects?.filter((project) =>
    ["chromium-desktop", "mobile-s"].includes(project.name ?? ""),
  ),
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command:
          "python3 -m http.server 4322 --bind 127.0.0.1 --directory dist",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      },
});
