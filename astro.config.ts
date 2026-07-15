import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { popcorn } from "@swmansion/popcorn/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import { toAstroRedirects } from "./src/data/redirects";

// Popcorn ships a Vite plugin that (a) excludes itself from Vite's dep
// prebundling so its worker iframe import resolves, (b) serves the AVM
// bundle with COOP/COEP headers, and (c) emits the AtomVM runtime into
// the build output. It hard-errors if the bundle file is missing, so
// we only register it when `public/bundle.avm` is actually present -
// dev setups without the bundle keep working via the React island's
// precanned-output fallback. See BUNDLE_AVM.md for how to build it.
const POPCORN_BUNDLE = fileURLToPath(
  new URL("./public/bundle.avm", import.meta.url),
);
const popcornPlugins = existsSync(POPCORN_BUNDLE)
  ? [popcorn({ bundlePaths: [POPCORN_BUNDLE] })]
  : [];

// CI sets BASE_PATH + GH_PAGES_SITE for the GitHub Pages build.
// Production builds leave them unset and use the canonical site URL.
const BASE_PATH = process.env.BASE_PATH || undefined;
const SITE = process.env.GH_PAGES_SITE || "https://elixir-lang.org";

export default defineConfig({
  site: SITE,
  base: BASE_PATH,
  trailingSlash: "always",
  redirects: toAstroRedirects(),
  build: { concurrency: 8 },
  image: {
    responsiveStyles: true,
  },
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      // Shiki accepts these as bundled-language ids at runtime, but the
      // exported LanguageRegistration type doesn't model the string form.
      langs: [
        "elixir",
        "erlang",
        "bash",
        "typescript",
        "javascript",
        "html",
        "css",
        "json",
        // biome-ignore lint/suspicious/noExplicitAny: shiki langs cast - see above
      ] as any,
      wrap: true,
    },
  },
  experimental: {
    fonts: [
      {
        cssVariable: "--font-dm-sans",
        name: "DM Sans",
        provider: fontProviders.google(),
        weights: [300, 400, 500, 600, 700],
      },
      {
        cssVariable: "--font-dm-mono",
        name: "DM Mono",
        provider: fontProviders.google(),
        weights: [300, 400, 500],
      },
    ],
  },
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss(), ...popcornPlugins],
    // Match the cross-origin isolation provided by the Pages service worker.
    server: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    },
    preview: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    },
  },
});
