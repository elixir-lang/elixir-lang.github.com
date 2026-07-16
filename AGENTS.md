# Repo conventions for AI assistants

## Comments

Max **2 lines per comment block**. Drop anything that restates what the code
does or narrates the design process. Keep one-liners only when the gotcha is
genuinely non-obvious (browser quirks, framework timing issues, cross-file
pointers, "do NOT do X" warnings). No JSDoc-style 3-line minimums - use a
single `//` line instead of `/** ... */`.

## Stack

Astro 5 + React 19 islands + Tailwind v4 + TypeScript. Biome for lint/format,
2-space indent, double quotes (see `biome.json`). `pnpm check` applies Biome
fixes; use `pnpm lint` for the equivalent read-only check.

## Deployment

- GitHub Pages: see `BUNDLE_AVM.md`, `.github/workflows/deploy.yml`, and the
  `coi-serviceworker` setup.

## Popcorn (homepage hero editor)

- AVM bundle lives at `public/bundle.avm` (~7 MB, committed). Rebuild recipe
  in `BUNDLE_AVM.md`.
- Vite plugin is conditionally registered in `astro.config.ts` based on the
  bundle's presence so dev setups without it still build.
- The runtime requires `Cross-Origin-Opener-Policy: same-origin` +
  `Cross-Origin-Embedder-Policy: require-corp` headers. On hosts that can't
  set them, the `coi-serviceworker` workaround is used.

## Reveal animation system

- CSS in `src/styles/style.css`, JS in `src/scripts/reveal.ts`,
  component wrapper in `src/components/ui/Reveal.astro`.
- SPA navigations use the shorter `html[data-spa-nav] [data-reveal]` variant
  to avoid stacking with Astro's view-transition cross-fade (which is opted
  out via `transition:animate="none"` on `<main>` in `BaseLayout.astro`).

## Design tokens

All colours / spacing / type / motion live as CSS custom properties in
`src/styles/style.css` under `@theme inline`. Components must reference these
- no raw hex / px literals. Per-section brand colour maps live with the
component (e.g. `CATEGORY_COLORS` in `UseElixirFor.astro`).
