export interface SeoInput {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: URL | string;
  ogType?: "website" | "article";
  ogImage?: string;
  twitterCard?: "summary" | "summary_large_image";
  twitterSite?: string;
  noindex?: boolean;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    tags?: string[];
  };
}

export interface SeoResolved {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  siteName: string;
  ogTitle: string;
  ogDescription: string;
  ogType: "website" | "article";
  ogImage: string;
  ogLocale: string;
  twitterCard: "summary" | "summary_large_image";
  twitterSite: string;
  noindex: boolean;
  article?: SeoInput["article"];
}

// Brand strings copied verbatim from elixir-lang.org's <head> so search
// engines and link previews see the same surface.
const SITE_NAME = "The Elixir programming language";
const DEFAULT_TITLE = "The Elixir programming language";
const DEFAULT_DESCRIPTION =
  "Welcome to Elixir, a dynamic, functional language designed for building scalable and maintainable applications.";
const DEFAULT_KEYWORDS = [
  "elixir",
  "elixir lang",
  "elixir language",
  "elixir programming language",
  "functional programming",
  "concurrent programming",
  "erlang vm",
  "beam vm",
  "phoenix framework",
  "otp",
];
const DEFAULT_OG_IMAGE = "/images/seo/og-image-elixir.png";
const DEFAULT_OG_LOCALE = "en_US";
const DEFAULT_TWITTER_SITE = "@elixirlang";

export function buildSeo(
  input: SeoInput,
  site: URL | string | undefined,
  currentUrl?: URL | string,
): SeoResolved {
  const siteBase = site
    ? new URL(site.toString()).origin
    : "https://elixir-lang.org";

  // Per-page titles suffix " | The Elixir programming language"; the home
  // page uses the raw site name to avoid doubling.
  const titleRaw = input.title ?? DEFAULT_TITLE;
  const title = input.title ? `${input.title} | ${SITE_NAME}` : titleRaw;

  const description = input.description ?? DEFAULT_DESCRIPTION;
  const keywords = (input.keywords ?? DEFAULT_KEYWORDS).join(", ");

  // Canonical: explicit override -> current page URL -> site root
  // (last-resort siteBase keeps tests happy without an Astro context).
  let canonicalUrl: string;
  if (input.canonicalUrl) {
    canonicalUrl = new URL(input.canonicalUrl.toString(), siteBase).toString();
  } else if (currentUrl) {
    // Normalize against the production origin so localhost previews still
    // emit canonical = https://elixir-lang.org/... in the built HTML.
    const u = new URL(currentUrl.toString());
    canonicalUrl = new URL(u.pathname + u.search, siteBase).toString();
  } else {
    canonicalUrl = siteBase;
  }
  const ogImage = input.ogImage
    ? new URL(input.ogImage, siteBase).toString()
    : new URL(DEFAULT_OG_IMAGE, siteBase).toString();

  return {
    title,
    description,
    keywords,
    canonicalUrl,
    siteName: SITE_NAME,
    ogTitle: input.title ?? DEFAULT_TITLE,
    ogDescription: description,
    ogType: input.ogType ?? "website",
    ogImage,
    ogLocale: DEFAULT_OG_LOCALE,
    twitterCard: input.twitterCard ?? "summary_large_image",
    twitterSite: input.twitterSite ?? DEFAULT_TWITTER_SITE,
    noindex: input.noindex ?? false,
    article: input.article,
  };
}

export function organizationJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl,
    logo: `${siteUrl}/images/seo/favicon-512-elixir.png`,
    sameAs: [
      "https://github.com/elixir-lang/elixir",
      "https://twitter.com/elixirlang",
    ],
  };
}

export function articleJsonLd(opts: {
  title: string;
  description: string;
  url: string;
  image?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    image: opts.image,
    author: opts.author ? { "@type": "Person", name: opts.author } : undefined,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
  };
}

export function breadcrumbJsonLd(crumbs: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}
