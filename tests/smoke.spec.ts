import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { redirects } from "../src/data/redirects";
import { coreRoutes, UNKNOWN_ROUTE } from "./routes";

/*
 * Smoke spec - every route returns 200, has a <title>, an <h1>, and a
 * <main>. Cheap, deterministic, runs at every breakpoint.
 */
for (const route of coreRoutes) {
  test(`${route.name} (${route.path}) renders`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.ok(), `${route.path} should respond 2xx`).toBe(true);
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
  });
}

test("404 page renders for unknown route", async ({ page }) => {
  const response = await page.goto(UNKNOWN_ROUTE, {
    waitUntil: "domcontentloaded",
  });
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1").first()).toContainText(
    /different path|404|not found/i,
  );
});

// Atom is served fine through the preview server, so check it over HTTP.
// Wrapped in toPass() to ride out transient drops under full-suite load.
test("Atom feed is served", async ({ request }) => {
  await expect(async () => {
    const res = await request.get("/atom.xml");
    expect(res.ok()).toBe(true);
    expect(res.headers()["content-type"]).toMatch(/xml/);
  }).toPass({ timeout: 10_000 });
});

/*
 * Astro's preview server does not expose these files at their Pages URLs, so
 * verify the static build artifacts directly.
 */
const DIST = resolve(process.cwd(), "dist");

test("Sitemap is generated in the build", () => {
  expect(existsSync(resolve(DIST, "sitemap-index.xml"))).toBe(true);
});

test("Legacy redirects have stubs and valid local targets", () => {
  for (const redirect of redirects) {
    const stub = resolve(DIST, redirect.from.slice(1), "index.html");
    expect(
      existsSync(stub),
      `${redirect.from} should have a redirect stub`,
    ).toBe(true);
    expect(readFileSync(stub, "utf8")).toContain(redirect.to);

    if (redirect.to.startsWith("/")) {
      const target = resolve(DIST, redirect.to.slice(1), "index.html");
      expect(existsSync(target), `${redirect.to} should exist`).toBe(true);
    }
  }
});
