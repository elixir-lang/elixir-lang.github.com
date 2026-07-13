import {
  type CollectionEntry,
  type CollectionKey,
  getCollection,
} from "astro:content";

// Typed wrappers. Calling getCollection() directly from .astro frontmatter
// can degrade TS inference to `any` under astro check; calling from .ts works.
async function loadCollection<C extends CollectionKey>(
  collection: C,
): Promise<CollectionEntry<C>[]> {
  const all = await getCollection(collection);
  return all.filter(
    (entry: CollectionEntry<C>) => !(entry.data as { draft?: boolean }).draft,
  );
}

export async function loadBlogPosts(): Promise<CollectionEntry<"blog">[]> {
  const posts = await loadCollection("blog");
  return posts.sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
  );
}

export type ElixirVersion = CollectionEntry<"elixirVersions">;

export async function loadElixirVersions(): Promise<ElixirVersion[]> {
  const versions = await loadCollection("elixirVersions");
  return versions.sort((a, b) => b.data.sortKey - a.data.sortKey);
}

export function getStableElixirVersion(
  versions: ElixirVersion[],
): ElixirVersion {
  const stable = versions.find((version) => version.data.stable);
  if (!stable) throw new Error("No stable Elixir version defined.");
  return stable;
}

/** Returns `/blog/YYYY/MM/DD/<slug>/` to mirror the legacy elixir-lang.org URLs. */
export function blogPostUrl(post: CollectionEntry<"blog">): string {
  const d = post.data.date;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `/blog/${y}/${m}/${day}/${post.data.slug ?? post.id}/`;
}

export async function loadCases(): Promise<CollectionEntry<"cases">[]> {
  const cases = await loadCollection("cases");
  // Priority first, then flagship status, then publish date.
  return cases.sort((a, b) => {
    if (a.data.priority !== b.data.priority) {
      return b.data.priority - a.data.priority;
    }
    const aFlag = a.data.flagship ? 1 : 0;
    const bFlag = b.data.flagship ? 1 : 0;
    if (aFlag !== bFlag) return bFlag - aFlag;
    return new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
  });
}

export async function loadLearning(): Promise<CollectionEntry<"learning">[]> {
  const items = await loadCollection("learning");
  return items.sort((a, b) => a.data.order - b.data.order);
}

export function groupLearningByType(
  items: CollectionEntry<"learning">[],
): Record<string, CollectionEntry<"learning">[]> {
  const result: Record<string, CollectionEntry<"learning">[]> = {};
  for (const item of items) {
    const key = item.data.type;
    if (!result[key]) result[key] = [];
    result[key].push(item);
  }
  return result;
}
