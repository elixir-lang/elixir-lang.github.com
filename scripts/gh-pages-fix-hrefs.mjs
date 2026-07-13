// Post-build pass for GitHub Pages project-page hosting.
//
// Astro prefixes asset URLs (CSS, JS, images, srcset) with `base` for
// us, but it does NOT touch user-written `<a href="/path">` links,
// `action="/x"` form targets, `data-href="/x"` attributes, or
// `<link rel="canonical" href="/x">` tags. On a project page
// (`<user>.github.io/<repo>/`) those root-relative URLs resolve against
// the user-page root and 404. This script walks `dist/**/*.html` and
// prepends `BASE_PATH` to every root-relative href/action/canonical
// that isn't already prefixed and isn't an external/anchor/mailto.
//
// Skipped automatically:
//   - absolute URLs (`http://...`, `https://...`, `//...`)
//   - hash links (`#...`), `mailto:`, `tel:`, `data:`, `javascript:`
//   - anything already starting with `BASE_PATH`
//   - asset paths under `/_astro/` (Astro already prefixed those, but
//     belt-and-braces because we exclude them explicitly)

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE_PATH = process.env.BASE_PATH ?? "";
if (!BASE_PATH) {
  console.log("[gh-pages-fix-hrefs] BASE_PATH unset, skipping");
  process.exit(0);
}

// Walk dist/ recursively, yielding every `.html` file. Uses
// `readdir({ recursive: true })` so we don't need a glob dependency
// and avoid Node 22's still-experimental `fs/promises.glob`.
async function* walk(dir) {
  const entries = await readdir(dir, {
    recursive: true,
    withFileTypes: true,
  });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".html")) {
      yield join(entry.parentPath ?? entry.path, entry.name);
    }
  }
}

// Attribute names whose value we want to rewrite. Anchor `href` is the
// main target; canonicals and `action` are caught for completeness.
const ATTR_RE = /(\s(?:href|action|data-href)=")(\/[^"]*)/g;

function prefix(path) {
  if (path.startsWith(BASE_PATH)) return path;
  if (path === "/") return `${BASE_PATH}/`;
  // Astro emits `/_astro/...` for hashed bundles; it has already
  // applied the base in `import.meta.env.BASE_URL`-aware contexts.
  // Skip them to avoid double-prefixing.
  if (path.startsWith("/_astro/")) return path;
  return BASE_PATH + path;
}

let touchedFiles = 0;
let touchedLinks = 0;
for await (const file of walk("dist")) {
  const html = await readFile(file, "utf8");
  let count = 0;
  const next = html.replace(ATTR_RE, (_match, prefixAttr, path) => {
    const fixed = prefix(path);
    if (fixed !== path) count++;
    return prefixAttr + fixed;
  });
  if (count > 0) {
    await writeFile(file, next);
    touchedFiles++;
    touchedLinks += count;
  }
}

console.log(
  `[gh-pages-fix-hrefs] prefixed ${touchedLinks} links across ${touchedFiles} files with ${BASE_PATH}`,
);
