import { expect, type Page, test } from "@playwright/test";

/*
 * Interaction spec for the filtered listings (/blog/, /learning/).
 *
 * These behaviours have ALL regressed at least once and were invisible to
 * the smoke / visual / a11y specs because none of those exercise client
 * behaviour:
 *   - switching a tab updates the visible rows + the URL query param
 *   - pagination changes the page + URL
 *   - deep-linking ?category=X selects the right tab on load
 *   - browser-back restores the listing (ClientRouter must keep
 *     window.history.state intact - clobbering it broke the DOM swap)
 *   - clicking a category link FROM a post lands on the right tab (the
 *     URL hadn't committed when the custom element first read it)
 */

const FILTER = 'elixir-tab-filter[data-name="blog-category"]';

/** Visible (non-hidden) post rows. */
function visiblePosts(page: Page) {
  return page.locator("[data-post]:not(.hidden)");
}

/** Assert every visible post belongs to `category`. */
async function expectAllVisibleInCategory(page: Page, category: string) {
  const cats = await visiblePosts(page).evaluateAll((els) =>
    els.map((e) => e.dataset.category),
  );
  expect(cats.length).toBeGreaterThan(0);
  for (const c of cats) expect(c).toBe(category);
}

test.describe("Blog filtering", () => {
  test("clicking a tab filters rows and writes the URL", async ({ page }) => {
    await page.goto("/blog/");
    // Default: "All" tab active, page-1 slice visible.
    await expect(
      page.locator(`${FILTER} button[data-id="All"][data-active]`),
    ).toBeVisible();
    await expect(visiblePosts(page)).toHaveCount(20);

    await page.locator(`${FILTER} button[data-id="Releases"]`).click();

    await expect(page).toHaveURL(/[?&]category=Releases\b/);
    await expect(
      page.locator(`${FILTER} button[data-id="Releases"][data-active]`),
    ).toBeVisible();
    // Releases has 34 posts → page 1 shows 20, all in-category.
    await expect(visiblePosts(page)).toHaveCount(20);
    await expectAllVisibleInCategory(page, "Releases");
  });

  test("pagination changes page and URL", async ({ page }) => {
    await page.goto("/blog/?category=Releases");
    const firstPageTitles = await visiblePosts(page)
      .locator("h2, h3")
      .allInnerTexts();

    await page
      .locator('elixir-pagination[data-name="blog"] button[data-page="2"]')
      .click();

    await expect(page).toHaveURL(/[?&]page=2\b/);
    await expect(page).toHaveURL(/[?&]category=Releases\b/);
    await expectAllVisibleInCategory(page, "Releases");
    const secondPageTitles = await visiblePosts(page)
      .locator("h2, h3")
      .allInnerTexts();
    expect(secondPageTitles).not.toEqual(firstPageTitles);
  });

  test("deep-link ?category= selects the tab on load", async ({ page }) => {
    await page.goto("/blog/?category=Announcements");
    await expect(
      page.locator(`${FILTER} button[data-id="Announcements"][data-active]`),
    ).toBeVisible();
    await expectAllVisibleInCategory(page, "Announcements");
  });

  test("browser-back restores the filtered listing", async ({ page }) => {
    // Regression guard: writeURL must preserve window.history.state so
    // Astro's ClientRouter swaps the DOM on popstate. If it clobbers it,
    // the URL + title revert but the post body stays on screen.
    await page.goto("/blog/?category=Announcements");
    await expectAllVisibleInCategory(page, "Announcements");

    const firstPostLink = visiblePosts(page)
      .locator('a[href^="/blog/"]')
      .first();
    await firstPostLink.click();
    await expect(page).toHaveURL(/\/blog\/\d{4}\/\d{2}\/\d{2}\//);

    await page.goBack();

    // Body must actually swap back to the listing (not stay on the post).
    await expect(page).toHaveURL(/[?&]category=Announcements\b/);
    await expect(page.locator(FILTER)).toBeVisible();
    await expect(
      page.locator(`${FILTER} button[data-id="Announcements"][data-active]`),
    ).toBeVisible();
    await expectAllVisibleInCategory(page, "Announcements");
  });

  test("category link from a post lands on the right tab", async ({ page }) => {
    // Regression guard: on a ClientRouter SPA nav the custom element's
    // connectedCallback runs before window.location.href commits, so the
    // module-scope astro:page-load re-sync must fix the tab afterwards.
    await page.goto("/blog/2014/09/18/elixir-v1-0-0-released/");
    await page.locator('a[href="/blog/?category=Releases"]').first().click();

    await expect(page).toHaveURL(/[?&]category=Releases\b/);
    await expect(
      page.locator(`${FILTER} button[data-id="Releases"][data-active]`),
    ).toBeVisible();
    await expectAllVisibleInCategory(page, "Releases");
  });
});

test.describe("Learning filtering", () => {
  const LEARNING_FILTER = 'elixir-tab-filter[data-name="learning-tab"]';

  test("clicking a tab filters resources and writes the URL", async ({
    page,
  }) => {
    await page.goto("/learning/");
    // Default tab is "books".
    await expect(
      page.locator(`${LEARNING_FILTER} button[data-id="books"][data-active]`),
    ).toBeVisible();

    await page.locator(`${LEARNING_FILTER} button[data-id="courses"]`).click();

    await expect(page).toHaveURL(/[?&]tab=courses\b/);
    await expect(
      page.locator(`${LEARNING_FILTER} button[data-id="courses"][data-active]`),
    ).toBeVisible();
    const cats = await page
      .locator("[data-resource]:not(.hidden)")
      .evaluateAll((els) => els.map((e) => e.dataset.category));
    expect(cats.length).toBeGreaterThan(0);
    for (const c of cats) expect(c).toBe("courses");
  });
});
