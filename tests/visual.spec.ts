import { expect, test } from "@playwright/test";
import { coreRoutes, UNKNOWN_ROUTE } from "./routes";

/*
 * Visual regression - full-page screenshots per route, per viewport project.
 * Baseline images live under tests/visual.spec.ts-snapshots/ and are
 * committed to the repo. Update with `pnpm test:visual - --update-snapshots`.
 */

/** Slugify a route name into a stable snapshot-file prefix. */
function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const routes = [
  ...coreRoutes.map((r) => ({ path: r.path, name: slug(r.name) })),
  { path: UNKNOWN_ROUTE, name: "404" },
];

for (const route of routes) {
  test(`${route.name} matches visual snapshot`, async ({ page }, info) => {
    await page.goto(route.path, { waitUntil: "networkidle" });
    // Wait for web fonts to load - DM Sans loading late re-flows text and
    // shifts the full-page screenshot, which flaked the listing pages under
    // parallel load. document.fonts.ready resolves once all @font-face used
    // on the page are downloaded + applied.
    await page.evaluate(() => document.fonts.ready);
    // Filtered-listing pages (blog, learning) render EVERY row in the SSR
    // HTML and trim to a single page via client JS. Until that runs the page
    // is the full un-filtered list (e.g. blog index was 19502px tall with all
    // 73 posts vs 2813px filtered) — screenshotting mid-trim produced
    // wildly different heights. Wait until the trim has hidden some rows.
    await page.waitForFunction(
      () => {
        const root = document.querySelector("elixir-filtered-listing");
        if (!root) return true; // not a listing page
        return (
          document.querySelectorAll(
            "[data-post].hidden, [data-resource].hidden",
          ).length > 0
        );
      },
      undefined,
      { timeout: 5000 },
    );
    // Settle entrance reveals + client-rendered widgets (the blog/learning
    // filter + pagination build their DOM in connectedCallback).
    await page.waitForTimeout(900);
    await expect(page).toHaveScreenshot(
      `${route.name}-${info.project.name}.png`,
      {
        fullPage: true,
        animations: "disabled",
      },
    );
  });
}
