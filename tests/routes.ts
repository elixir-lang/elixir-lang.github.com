/*
 * Canonical route list shared by smoke / a11y / visual specs.
 *
 * Keep this in sync with src/pages/. Centralising it here prevents the
 * three specs from drifting independently - previously each listed
 * `/blog/welcome-to-elixir/` and `/docs/install/`, neither of which is a
 * real route (blog posts live at /blog/YYYY/MM/DD/<slug>/ and install is
 * a top-level /install/ page), so those tests were silently exercising
 * the 404 page.
 */

/**
 * A stable, dated blog-post URL for the "renders a post" cases. Points at
 * the v1.0.0 release announcement - a historical post that won't be
 * renamed or removed. Shape mirrors blogPostUrl() in content-loaders.ts:
 * /blog/<YYYY>/<MM>/<DD>/<id>/.
 */
export const STABLE_BLOG_POST = "/blog/2014/09/18/elixir-v1-0-0-released/";

export interface RouteCase {
  path: string;
  /** Human-readable label used in test titles + visual snapshot filenames. */
  name: string;
}

/** Every first-class page on the site. */
export const coreRoutes: RouteCase[] = [
  { path: "/", name: "Homepage" },
  { path: "/blog/", name: "Blog index" },
  { path: STABLE_BLOG_POST, name: "Blog post" },
  { path: "/docs/", name: "Docs index" },
  { path: "/cases/", name: "Cases index" },
  { path: "/learning/", name: "Learning index" },
  { path: "/install/", name: "Install" },
  { path: "/development/", name: "Development" },
  { path: "/trademarks/", name: "Trademarks" },
];

/** A path guaranteed not to exist - exercises the custom 404 page. */
export const UNKNOWN_ROUTE = "/this-route-does-not-exist-12345/";
