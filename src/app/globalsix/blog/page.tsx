import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { getAllPosts, getAllTags } from "@/lib/globalsix-blog/posts";
import { PostCard } from "@/components/globalsix-blog/PostCard";
import { blogConfig } from "@/lib/globalsix-blog/config";

export default function GlobalSixBlogIndex() {
  const posts = getAllPosts();
  const tags = getAllTags();
  const featured = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p.slug !== featured?.slug);
  const side = rest.slice(0, 3);
  const grid = rest.slice(3);

  return (
    <>
      <section className="gsb-hero">
        <div className="gsb-container">
          <span className="gsb-kicker">Blog GlobalSix</span>
          <span className="gsb-partner-badge">
            <BadgeCheck className="h-3.5 w-3.5" />
            Meta Business Partner — Tech Provider
          </span>
          <h1 className="gsb-hero__title">
            Tecnologia sob medida. <em>Explicada sem enrolação.</em>
          </h1>
          <p className="gsb-hero__lead">{blogConfig.description}</p>
          {tags.length > 0 && (
            <div className="gsb-tags">
              {tags.slice(0, 8).map((t) => (
                <Link key={t.slug} href={`/globalsix/blog/tag/${t.slug}`} className="gsb-tag">
                  {t.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {featured && (
        <section className="gsb-container gsb-top">
          <PostCard post={featured} variant="featured" />
          {side.length > 0 && (
            <div className="gsb-top__side">
              <span className="gsb-section-label">Mais recentes</span>
              {side.map((p) => (
                <PostCard key={p.slug} post={p} variant="compact" />
              ))}
            </div>
          )}
        </section>
      )}

      {grid.length > 0 && (
        <section className="gsb-container gsb-section">
          <div className="gsb-section__head">
            <h2>Todos os artigos</h2>
          </div>
          <div className="gsb-grid">
            {grid.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}

      {posts.length === 0 && (
        <section className="gsb-container gsb-section">
          <p>Nenhum post publicado ainda. Crie um arquivo em <code>content/globalsix-blog/</code>.</p>
        </section>
      )}
    </>
  );
}
