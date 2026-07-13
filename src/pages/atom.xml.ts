import type { APIContext } from "astro";

import { blogPostUrl, loadBlogPosts } from "@/lib/content-loaders";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET(context: APIContext) {
  const posts = await loadBlogPosts();
  const site = context.site ?? new URL("https://elixir-lang.org");
  const updated =
    posts[0]?.data.date.toISOString() ?? new Date(0).toISOString();
  const entries = posts
    .map((post) => {
      const url = new URL(blogPostUrl(post), site).href;
      const categories = [post.data.category, ...post.data.tags]
        .map((category) => `<category term="${escapeXml(category)}"/>`)
        .join("");

      return `<entry><title>${escapeXml(post.data.title)}</title><link href="${escapeXml(url)}"/><id>${escapeXml(url)}</id><updated>${post.data.date.toISOString()}</updated><author><name>${escapeXml(post.data.author)}</name></author><summary>${escapeXml(post.data.excerpt)}</summary>${categories}</entry>`;
    })
    .join("");
  const body = `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>Elixir Blog</title><link href="${escapeXml(new URL("atom.xml", site).href)}" rel="self"/><link href="${escapeXml(site.href)}"/><updated>${updated}</updated><id>${escapeXml(site.href)}</id>${entries}</feed>`;

  return new Response(body, {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
}
