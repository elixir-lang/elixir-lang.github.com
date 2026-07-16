import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import { toAstroRedirects } from "./src/data/redirects";

export default defineConfig({
  site: "https://elixir-lang.org",
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
  },
});
