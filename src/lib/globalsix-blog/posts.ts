import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";

const POSTS_DIR = path.join(process.cwd(), "content", "globalsix-blog");

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string; // AAAA-MM-DD
  updated?: string;
  author: string;
  category: string;
  tags: string[];
  cover?: string;
  coverAlt?: string;
  featured?: boolean;
  draft?: boolean;
  readingMinutes: number;
};

export type Post = PostMeta & { content: string; headings: { id: string; text: string }[] };

const toArray = (v: unknown) => (Array.isArray(v) ? v.map(String) : v ? [String(v)] : []);

function readPost(file: string): Post {
  const slug = file.replace(/\.mdx?$/, "");
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
  const { data, content } = matter(raw);

  const words = content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

  const slugger = new GithubSlugger();
  const headings = content
    .split("\n")
    .filter((l) => /^##\s+/.test(l))
    .map((l) => l.replace(/^##\s+/, "").trim())
    .map((text) => ({ id: slugger.slug(text), text }));

  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? ""),
    updated: data.updated
      ? data.updated instanceof Date
        ? data.updated.toISOString().slice(0, 10)
        : String(data.updated)
      : undefined,
    author: String(data.author ?? "equipe"),
    category: String(data.category ?? "Geral"),
    tags: toArray(data.tags),
    cover: data.cover ? String(data.cover) : undefined,
    coverAlt: data.coverAlt ? String(data.coverAlt) : undefined,
    featured: Boolean(data.featured),
    draft: Boolean(data.draft),
    readingMinutes: Math.max(1, Math.round(words / 200)),
    content,
    headings,
  };
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const showDrafts = process.env.NODE_ENV === "development";
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map(readPost)
    .filter((p) => showDrafts || !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const getPost = (slug: string) => getAllPosts().find((p) => p.slug === slug);

export const tagSlug = (tag: string) =>
  tag
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function getAllTags() {
  const map = new Map<string, { name: string; slug: string; count: number }>();
  for (const p of getAllPosts())
    for (const t of p.tags) {
      const s = tagSlug(t);
      const cur = map.get(s) ?? { name: t, slug: s, count: 0 };
      cur.count++;
      map.set(s, cur);
    }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function getRelated(post: Post, limit = 3) {
  return getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({
      p,
      score: p.tags.filter((t) => post.tags.includes(t)).length + (p.category === post.category ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || (a.p.date < b.p.date ? 1 : -1))
    .slice(0, limit)
    .map((x) => x.p);
}

export const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
