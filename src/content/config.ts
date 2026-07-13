import { defineCollection, type SchemaContext, z } from "astro:content";
import { glob } from "astro/loaders";

// Blog posts migrated from elixir-lang.github.com. URLs built as
// /blog/YYYY/MM/DD/<slug>/ via blogPostUrl in lib/content-loaders.ts.
const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    authorRole: z.string().optional(),
    /** Drives which tab the post appears under on /blog/. Posts that don't
     *  match an existing category fall through to "Announcements". */
    category: z
      .enum(["Releases", "Announcements", "Elixir in Production", "Internals"])
      .default("Announcements"),
    /** Free-form tags (legacy Jekyll `tags: release announcement` field).
     *  Not surfaced in the index but kept for SEO + future filtering. */
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
});

/* `elixirVersions` - one .md file per released Elixir version. Drives the
 * static /docs/ page (current version hero + historical version cards). */
const elixirVersions = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/elixir-versions",
  }),
  schema: z.object({
    /** Display label, e.g. "v1.20" or "Development". */
    name: z.string(),
    /** Sortable numeric value: 1.19, 1.18, etc. Use 0 for "Development". */
    sortKey: z.number(),
    /** Concrete patch version used in hexdocs URLs (e.g. "1.19.5").
     *  Omit for the Development build (it uses "main" instead). */
    version: z.string().optional(),
    /** Supported OTP majors, ascending order (e.g. [26, 27, 28]). */
    otpVersions: z.array(z.number()).default([]),
    /** Minimum supported OTP release, preserving the minor component. */
    minimumOtp: z.string().optional(),
    /** Recommended OTP release for new installations. */
    recommendedOtp: z.string().optional(),
    /** True for the single currently-stable version - drives the hero card. */
    stable: z.boolean().default(false),
    /** True for the in-development branch - uses "main" in URLs and shows
     *  no download button. */
    development: z.boolean().default(false),
  }),
});

// Case studies migrated from elixir-lang.org's "Elixir in Production"
// series; each entry links out via its `url` field.
const cases = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/cases" }),
  schema: ({ image }: SchemaContext) =>
    z.object({
      /** Card heading shown in , etc. */
      title: z.string(),
      /** Card body paragraph (2-3 sentences, clamped to 3 lines in UI). */
      summary: z.string(),
      /** Brand name - used for alt text on the logo and SEO. */
      company: z.string(),
      /** Logo wordmark rendered inside the 240px-tall image cell. */
      logo: image(),
      /** Optional plain-text fallback if the image fails to load. */
      logoAlt: z.string().optional(),
      /** Internal path to the corresponding blog post. */
      url: z.string().startsWith("/"),
      /** Lowercase tag list, e.g. ["growth", "team", "web"]. Rendered
       *  capitalized in the UI with bullet separators. */
      tags: z.array(z.string()).default([]),
      /** Publish date - drives sort order (newest first). */
      date: z.coerce.date(),
      /** True for cases that should appear first regardless of date. */
      flagship: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

const learning = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/learning" }),
  schema: ({ image }: SchemaContext) =>
    z.object({
      title: z.string(),
      description: z.string(),
      type: z.enum([
        "book",
        "course",
        "video",
        "tutorial",
        "podcast",
        "article",
      ]),
      /** Drives which tab a resource appears under on /learning/. */
      category: z
        .enum(["books", "in-depth-books", "courses", "screencasts", "other"])
        .default("books"),
      level: z
        .enum(["beginner", "intermediate", "advanced"])
        .default("beginner"),
      author: z.string().optional(),
      url: z.string().url().optional(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      /** Edge-to-edge cover (no frame/padding) for entries whose cover
       * image already includes its own background. */
      coverBleed: z.boolean().default(false),
      /** Display order within a tab - lower numbers first. */
      order: z.number().default(0),
      free: z.boolean().default(true),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

// Standalone migrated pages (/development and /trademarks).
const legacyPages = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/legacy-pages",
  }),
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = {
  blog,
  cases,
  learning,
  elixirVersions,
  legacyPages,
};
