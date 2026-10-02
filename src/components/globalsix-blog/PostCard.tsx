import Link from "next/link";
import { Cover } from "./Cover";
import { formatDate, type PostMeta } from "@/lib/globalsix-blog/posts";
import { getAuthor } from "@/lib/globalsix-blog/authors";

export function PostCard({ post, variant = "default" }: { post: PostMeta; variant?: "default" | "featured" | "compact" }) {
  const author = getAuthor(post.author);
  return (
    <article className={`gsb-card gsb-card--${variant}`}>
      <Link href={`/globalsix/blog/${post.slug}`} className="gsb-card__media" tabIndex={-1} aria-hidden>
        <Cover post={post} size={variant === "featured" ? "lg" : "md"} />
      </Link>
      <div className="gsb-card__body">
        <div className="gsb-eyebrow">
          <span className="gsb-pill">{post.category}</span>
          <span>{post.readingMinutes} min de leitura</span>
        </div>
        <h3 className="gsb-card__title">
          <Link href={`/globalsix/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        {variant !== "compact" && <p className="gsb-card__excerpt">{post.description}</p>}
        <div className="gsb-meta">
          <span>{author.name}</span>
          <span className="gsb-dot" />
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </div>
      </div>
    </article>
  );
}
