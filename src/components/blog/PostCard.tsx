import Link from "next/link";
import { Cover } from "./Cover";
import { formatDate, type PostMeta } from "@/lib/blog/posts";
import { getAuthor } from "@/lib/blog/authors";

export function PostCard({ post, variant = "default" }: { post: PostMeta; variant?: "default" | "featured" | "compact" }) {
  const author = getAuthor(post.author);
  return (
    <article className={`sb-card sb-card--${variant}`}>
      <Link href={`/blog/${post.slug}`} className="sb-card__media" tabIndex={-1} aria-hidden>
        <Cover post={post} size={variant === "featured" ? "lg" : "md"} />
      </Link>
      <div className="sb-card__body">
        <div className="sb-eyebrow">
          <span className="sb-pill">{post.category}</span>
          <span>{post.readingMinutes} min de leitura</span>
        </div>
        <h3 className="sb-card__title">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        {variant !== "compact" && <p className="sb-card__excerpt">{post.description}</p>}
        <div className="sb-meta">
          <span>{author.name}</span>
          <span className="sb-dot" />
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </div>
      </div>
    </article>
  );
}
