import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getAllTags, tagSlug } from "@/lib/globalsix-blog/posts";
import { PostCard } from "@/components/globalsix-blog/PostCard";
import { absoluteUrl } from "@/lib/globalsix-blog/config";

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
    description: `Todos os artigos do Blog GlobalSix sobre ${t.name}.`,
    alternates: { canonical: absoluteUrl(`/blog/tag/${t.slug}`) },
  };
}

export default async function GlobalSixTagPage({ params }: Props) {
  const { tag } = await params;
  const t = getAllTags().find((x) => x.slug === tag);
  if (!t) notFound();
  const posts = getAllPosts().filter((p) => p.tags.some((x) => tagSlug(x) === tag));

  return (
    <>
      <section className="gsb-hero gsb-hero--compact">
        <div className="gsb-container">
          <nav className="gsb-crumbs">
            <Link href="/globalsix/blog">Blog</Link>
            <span>/</span>
            <span>Tema</span>
          </nav>
          <h1 className="gsb-hero__title">{t.name}</h1>
          <p className="gsb-hero__lead">
            {posts.length} {posts.length === 1 ? "artigo" : "artigos"} sobre este tema.
          </p>
        </div>
      </section>
      <section className="gsb-container gsb-section">
        <div className="gsb-grid">
          {posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      </section>
    </>
  );
}
