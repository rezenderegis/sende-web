import type { MetadataRoute } from "next";
import { getAllPosts, getAllTags } from "./posts";
import { absoluteUrl } from "./config";

// Use dentro do seu app/sitemap.ts:  return [...suasRotas, ...blogSitemapEntries()]
export function blogSitemapEntries(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  return [
    { url: absoluteUrl("/blog"), lastModified: posts[0]?.date, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((p) => ({
      url: absoluteUrl(`/blog/${p.slug}`),
      lastModified: p.updated ?? p.date,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...getAllTags().map((t) => ({ url: absoluteUrl(`/blog/tag/${t.slug}`), changeFrequency: "weekly" as const, priority: 0.4 })),
  ];
}
