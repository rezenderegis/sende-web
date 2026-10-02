import { getAllPosts } from "@/lib/blog/posts";
import { getAuthor } from "@/lib/blog/authors";
import { absoluteUrl, blogConfig } from "@/lib/blog/config";

export const dynamic = "force-static";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const items = getAllPosts()
    .map((p) => {
      const url = absoluteUrl(`/blog/${p.slug}`);
      return `<item>
  <title>${esc(p.title)}</title>
  <link>${url}</link>
  <guid>${url}</guid>
  <pubDate>${new Date(`${p.date}T12:00:00-03:00`).toUTCString()}</pubDate>
  <description>${esc(p.description)}</description>
  <author>${esc(getAuthor(p.author).name)}</author>
  ${p.tags.map((t) => `<category>${esc(t)}</category>`).join("")}
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${esc(blogConfig.blogTitle)}</title>
  <link>${absoluteUrl("/blog")}</link>
  <description>${esc(blogConfig.description)}</description>
  <language>pt-BR</language>
${items}
</channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
