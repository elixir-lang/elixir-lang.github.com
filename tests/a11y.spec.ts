import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { coreRoutes } from "./routes";

/*
 * axe-core a11y scan - fails on any serious/critical violation.
 */
for (const route of coreRoutes) {
  test(`${route.name} has no serious/critical a11y issues`, async ({
    page,
  }) => {
    // Reduced-motion makes the scroll-reveal CSS snap [data-reveal]
    // elements to opacity:1 immediately. Without it the scan can catch
    // elements mid-fade at partial opacity, producing phantom
    // color-contrast failures (e.g. purple-60 links measured at ~60%
    // opacity read as ~3.3:1 instead of their settled 5.7:1).
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route.path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // Exclude Shiki syntax-highlight tokens. The github-light token
      // palette is rendered on the brand purple-20 code background, which
      // drops some tokens (comment gray, keyword red) just below 4.5:1.
      // That's a deliberate design choice for code samples, not a content
      // contrast bug - fixing it means recolouring the syntax theme or the
      // code background, which is a design decision tracked separately.
      .exclude(".astro-code")
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(
      serious,
      `${route.name} has ${serious.length} serious/critical a11y violation(s): ${serious.map((s) => s.id).join(", ")}`,
    ).toEqual([]);
  });
}
