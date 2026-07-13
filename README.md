# Elixir website

Source for the Elixir language marketing site at <https://elixir-lang.org>.

Static Astro site, content authored in Markdown, deployed with GitHub Pages.

## Stack

- [Astro 5](https://astro.build) (static output, file-based routing)
- React 19 for the few interactive islands (`client:idle` / `client:load`
  only where needed)
- [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`
- Astro content collections + Zod schemas for blog posts, case studies,
  learning resources and version data
- Shiki for prose code highlighting; a small in-house regex tokenizer
  (`src/utilities/elixir-tokens.ts`) for the homepage marketing components
- [Popcorn](https://github.com/software-mansion/popcorn) (AtomVM + Elixir
  in WebAssembly) powering the interactive hero code editor
- Biome for lint and format
- Playwright for smoke, visual and accessibility tests
- pnpm

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:4321
```

The Popcorn hero editor uses the AVM bundle at `public/bundle.avm`. The
file is committed (~7 MB) so the editor "just works" after `pnpm install`.
If it's missing the editor gracefully falls back to pre-canned outputs.
Regeneration instructions live in [`BUNDLE_AVM.md`](./BUNDLE_AVM.md).

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Astro dev server with HMR |
| `pnpm build` | Build the static site to `dist/` |
| `pnpm preview` | Serve the built site locally |
| `pnpm check` | Biome lint and format (writes fixes) |
| `pnpm lint` | Biome lint only |
| `pnpm typecheck` | `astro check` (TypeScript across `.astro` and `.ts(x)`) |
| `pnpm test` | All Playwright specs |
| `pnpm test:smoke` | Route smoke checks |
| `pnpm test:visual` | Visual regression snapshots |
| `pnpm test:a11y` | axe-core accessibility scan |
| `pnpm assets:optimize` | Run SVGO over `src/assets/icons/**.svg` |

## Project layout

```
elixir-website/
├── astro.config.ts
├── biome.json
├── tsconfig.json
├── package.json
├── BUNDLE_AVM.md              # how to (re)build public/bundle.avm
├── AGENTS.md                  # conventions for AI assistants
├── public/                    # favicon, OG fallback, robots.txt,
│                              #   bundle.avm (Popcorn runtime)
├── scripts/                   # Deployment and SVG optimization utilities
├── src/
│   ├── assets/                # fonts, icons, logos, images
│   ├── components/
│   │   ├── ui/                # shared building blocks + inline SVG icons
│   │   ├── layout/            # SiteHeader, SiteFooter, MobileMenu, TopBanner
│   │   ├── home/              # homepage sections
│   │   ├── blog/, cases/, install/, page/
│   ├── content/               # markdown collections (blog, cases, learning,
│   │                          #   standalone-pages, elixir-versions)
│   ├── content/config.ts      # Zod schemas
│   ├── data/                  # navigation links, redirect map
│   ├── layouts/BaseLayout.astro
│   ├── lib/                   # content loaders
│   ├── pages/                 # routes
│   ├── scripts/reveal.ts      # scroll-reveal + SPA transition glue
│   ├── styles/style.css       # design tokens + global styles
│   └── utilities/             # cn helper, SEO builder, elixir tokenizer
└── tests/                     # Playwright specs
```

## Design tokens

All tokens are declared in `src/styles/style.css` inside an
`@theme inline { ... }` block. They expose both Tailwind utilities
(for example `bg-purple-60`) and raw CSS variables
(`var(--color-purple-60)`).

The token groups:

- **Colours.** `--color-purple-0` to `--color-purple-90` for the brand
  scale, `--color-gray-0` to `--color-gray-100` for neutrals, plus
  `--color-black`, `--color-white` and `--color-text-primary` as anchors.
  Semantic aliases (`--color-brand`, surface, text and border tokens)
  layer on top.
- **Typography.** `--text-display` through `--text-caption`, plus paired
  line-heights. Body text is 16 px; lead 20 px; small 14 px; caption 13 px.
- **Spacing.** Container max widths and horizontal padding per breakpoint.
- **Radii.** `--radius-xs` through `--radius-full`.
- **Motion.** `--ease-*` curves and `--duration-*` timings.
- **Breakpoints.** Mirrors Tailwind's defaults plus a custom `xs` at
  480 px for mid-size phones.

Components should consume tokens via Tailwind utilities or
`bg-(--color-...)` arbitrary syntax. Raw hex or px literals are
discouraged.

## Responsive breakpoints

The site is verified at the following widths:

| Token | Min width | Target |
|---|---|---|
| `<xs` | < 480 px | Small phones |
| `xs`  | 480 px   | Larger phones |
| `sm`  | 640 px   | Phones in landscape |
| `md`  | 768 px   | Tablets in portrait |
| `lg`  | 1024 px  | Small laptops / tablets in landscape |
| `xl`  | 1280 px  | Laptops |
| `2xl` | 1536 px  | Desktops |

The Playwright `visual.spec.ts` suite renders the site at five of these
viewports and locks the result against committed reference screenshots.

## Content collections

Markdown files live under `src/content/<collection>/`. Schemas in
`src/content/config.ts` validate frontmatter at build time. A new blog
post is just a new file:

```markdown
---
title: "Post title"
excerpt: "One-sentence summary."
date: 2026-05-15
author: "Author name"
category: "Announcements"   # Releases | Announcements | Elixir in Production | Internals
tags: []
---
Post body in markdown or MDX.
```

The route `/blog/<YYYY>/<MM>/<DD>/<slug>/` is generated automatically.

Other collections:

- `cases/` — Elixir-in-production case studies, link out via `url` field
- `learning/` — books, courses, screencasts, interactive resources (the
  `Elixir Language Tour` tab is its own category)
- `standalone-pages/` — sources for `/development`, `/stewards`, and
  `/trademarks`
- `elixir-versions/` — one file per released version (drives the
  current-stable hero + historical cards on `/docs`)

## Reveal animation system

`[data-reveal]` elements paint at `opacity: 0` and slide-in 12 px; the
glue in `src/scripts/reveal.ts` flips `data-revealed="true"` either on
the next animation frame (`[data-reveal-eager]` for above-the-fold) or
when an `IntersectionObserver` sees the element enter the viewport.

SPA navigations use a shortened variant (`html[data-spa-nav] [data-reveal]`,
250 ms + 6 px offset, no stagger) to avoid stacking visibly with Astro's
view-transition cross-fade — which is itself opted-out on `<main>` via
`transition:animate="none"` in `BaseLayout.astro` so each navigation
shows exactly one entrance animation.

## URL migration

Legacy URLs from elixir-lang.org are mapped to current routes in
`src/data/redirects.ts`. The map is consumed by `astro.config.ts` to
emit redirect stubs in the static output. The smoke tests verify every stub
and its local destination.

## Deployment

GitHub Pages builds the site through `.github/workflows/deploy.yml`. The
workflow sets `BASE_PATH` for project-page hosting, runs `pnpm build`, and
uses `scripts/gh-pages-fix-hrefs.mjs` to prefix hardcoded root-relative links.

The Popcorn WASM hero editor needs cross-origin isolation. Because GitHub
Pages cannot configure COOP/COEP response headers, project-page builds load
`public/coi-serviceworker.js` from `BaseLayout.astro`.

Preview builds emit `noindex, nofollow`. Set `PROD=true` only in the official
deployment workflow to allow search engines to index the site.

## License

* "Elixir" and the Elixir logo are registered trademarks of the Elixir team. See [our trademark policy](https://elixir-lang.org/trademarks).

* The source code (HTML, JavaScript, and CSS) are licensed under [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0).

* The written textual contents available in the guides and blog are licensed under [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0).
