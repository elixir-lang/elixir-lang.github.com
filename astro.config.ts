import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import { toAstroRedirects } from "./src/data/redirects";

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
    plugins: [tailwindcss()],
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
