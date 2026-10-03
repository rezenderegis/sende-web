import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { getAllPosts, getAllTags } from "@/lib/blog/posts";
import { PostCard } from "@/components/blog/PostCard";
import { blogConfig } from "@/lib/blog/config";

export default function BlogIndex() {
  const posts = getAllPosts();
  const tags = getAllTags();
  const featured = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p.slug !== featured?.slug);
  const side = rest.slice(0, 3);
  const grid = rest.slice(3);

  return (
    <>
      <section className="sb-hero">
        <div className="sb-container">
          <span className="sb-kicker">Blog Sende</span>
          <span className="sb-partner-badge">
            <BadgeCheck className="h-3.5 w-3.5" />
            Meta Business Partner — Tech Provider
          </span>
          <h1 className="sb-hero__title">
            O WhatsApp é onde seu cliente está. <em>Aqui é onde você aprende a atendê-lo bem.</em>
          </h1>
          <p className="sb-hero__lead">{blogConfig.description}</p>
          {tags.length > 0 && (
            <div className="sb-tags">
              {tags.slice(0, 8).map((t) => (
                <Link key={t.slug} href={`/blog/tag/${t.slug}`} className="sb-tag">
                  {t.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {featured && (
        <section className="sb-container sb-top">
          <PostCard post={featured} variant="featured" />
          {side.length > 0 && (
            <div className="sb-top__side">
              <span className="sb-section-label">Mais recentes</span>
              {side.map((p) => (
                <PostCard key={p.slug} post={p} variant="compact" />
              ))}
            </div>
          )}
        </section>
      )}

      {grid.length > 0 && (
        <section className="sb-container sb-section">
          <div className="sb-section__head">
            <h2>Todos os artigos</h2>
          </div>
          <div className="sb-grid">
            {grid.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}

      {posts.length === 0 && (
        <section className="sb-container sb-section">
          <p>Nenhum post publicado ainda. Crie um arquivo em <code>content/blog/</code>.</p>
        </section>
      )}
    </>
  );
}
