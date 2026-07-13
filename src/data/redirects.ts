// Legacy URL -> new route map, consumed by astro.config.ts. Static builds
// emit a refresh+canonical stub at each `from` so SEO equity transfers.
export type RedirectStatus = 301 | 302;

export interface Redirect {
  from: string;
  to: string;
  status: RedirectStatus;
}

export const redirects: Redirect[] = [
  { from: "/install.html", to: "/install/", status: 301 },
  { from: "/learning.html", to: "/learning/", status: 301 },
  { from: "/cases.html", to: "/cases/", status: 301 },
  { from: "/docs.html", to: "/docs/", status: 301 },
  { from: "/blog.html", to: "/blog/", status: 301 },

  { from: "/development.html", to: "/development/", status: 301 },
  { from: "/trademarks.html", to: "/trademarks/", status: 301 },

  { from: "/blog/categories.html", to: "/blog/", status: 301 },

  // /getting-started/ was retired; route legacy URLs to canonical HexDocs.
  {
    from: "/getting-started/introduction.html",
    to: "https://hexdocs.pm/elixir/introduction.html",
    status: 301,
  },
  {
    from: "/getting-started/mix-otp/introduction-to-mix.html",
    to: "https://hexdocs.pm/elixir/introduction-to-mix.html",
    status: 301,
  },
];

export function toAstroRedirects(): Record<
  string,
  { status: RedirectStatus; destination: string }
> {
  const out: Record<string, { status: RedirectStatus; destination: string }> =
    {};
  for (const r of redirects) {
    out[r.from] = { status: r.status, destination: r.to };
  }
  return out;
}
