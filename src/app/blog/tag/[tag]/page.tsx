import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getAllTags, tagSlug } from "@/lib/blog/posts";
import { PostCard } from "@/components/blog/PostCard";
import { absoluteUrl } from "@/lib/blog/config";

type Props = { params: Promise<{ tag: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTags().map((t) => ({ tag: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const t = getAllTags().find((x) => x.slug === tag);
  if (!t) return {};
  return {
    title: `Artigos sobre ${t.name}`,
    description: `Todos os artigos do Blog Sende sobre ${t.name}.`,
    alternates: { canonical: absoluteUrl(`/blog/tag/${t.slug}`) },
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const t = getAllTags().find((x) => x.slug === tag);
  if (!t) notFound();
  const posts = getAllPosts().filter((p) => p.tags.some((x) => tagSlug(x) === tag));

  return (
    <>
      <section className="sb-hero sb-hero--compact">
        <div className="sb-container">
          <nav className="sb-crumbs">
            <Link href="/blog">Blog</Link>
            <span>/</span>
            <span>Tema</span>
          </nav>
          <h1 className="sb-hero__title">{t.name}</h1>
          <p className="sb-hero__lead">
            {posts.length} {posts.length === 1 ? "artigo" : "artigos"} sobre este tema.
          </p>
        </div>
      </section>
      <section className="sb-container sb-section">
        <div className="sb-grid">
          {posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      </section>
    </>
  );
}
