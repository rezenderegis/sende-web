import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { getAllPosts, getPost, getRelated, formatDate, tagSlug } from "@/lib/blog/posts";
import { getAuthor, initials } from "@/lib/blog/authors";
import { absoluteUrl, blogConfig } from "@/lib/blog/config";
import { mdxComponents } from "@/components/blog/mdx";
import { Cover } from "@/components/blog/Cover";
import { PostCard } from "@/components/blog/PostCard";
import { ShareBar } from "@/components/blog/ShareBar";
import { ReadingProgress } from "@/components/blog/ReadingProgress";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = absoluteUrl(`/blog/${post.slug}`);
  const author = getAuthor(post.author);
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    authors: [{ name: author.name }],
    keywords: post.tags,
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [author.name],
      tags: post.tags,
      images: post.cover ? [{ url: post.cover }] : undefined,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const author = getAuthor(post.author);
  const url = absoluteUrl(`/blog/${post.slug}`);
  const related = getRelated(post);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    mainEntityOfPage: url,
    image: post.cover,
    keywords: post.tags.join(", "),
    author: { "@type": "Person", name: author.name, jobTitle: author.role, url: author.linkedin || undefined },
    publisher: { "@type": "Organization", name: blogConfig.siteName, url: blogConfig.siteUrl },
    inLanguage: "pt-BR",
  };

  return (
    <article className="sb-post">
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="sb-container sb-post__header">
        <nav className="sb-crumbs" aria-label="Navegação">
          <Link href="/blog">Blog</Link>
          <span>/</span>
          <span>{post.category}</span>
        </nav>
        <h1 className="sb-post__title">{post.title}</h1>
        <p className="sb-post__lead">{post.description}</p>
        <div className="sb-byline">
          <Avatar name={author.name} src={author.avatar} />
          <div>
            <strong>{author.name}</strong>
            <span>
              <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingMinutes} min de leitura
            </span>
          </div>
        </div>
      </header>

      <div className="sb-container sb-post__cover">
        <Cover post={post} size="lg" />
      </div>

      <div className="sb-container sb-post__layout">
        <aside className="sb-toc">
          {post.headings.length > 1 && (
            <>
              <span className="sb-section-label">Neste artigo</span>
              <ol>
                {post.headings.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`}>{h.text}</a>
                  </li>
                ))}
              </ol>
            </>
          )}
        </aside>

        <div className="sb-prose">
          <MDXRemote
            source={post.content}
            components={mdxComponents}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] } }}
          />

          <div className="sb-post__footer">
            <div className="sb-tags">
              {post.tags.map((t) => (
                <Link key={t} href={`/blog/tag/${tagSlug(t)}`} className="sb-tag">
                  {t}
                </Link>
              ))}
            </div>
            <ShareBar url={url} title={post.title} />
          </div>

          <div className="sb-author">
            <Avatar name={author.name} src={author.avatar} size="lg" />
            <div>
              <span className="sb-section-label">Escrito por</span>
              <strong className="sb-author__name">{author.name}</strong>
              <span className="sb-author__role">{author.role}</span>
              <p>{author.bio}</p>
              {author.linkedin && (
                <a href={author.linkedin} target="_blank" rel="noopener noreferrer" className="sb-link">
                  LinkedIn →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="sb-container sb-section">
          <div className="sb-section__head">
            <h2>Continue lendo</h2>
            <Link href="/blog" className="sb-link">Ver todos →</Link>
          </div>
          <div className="sb-grid">
            {related.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function Avatar({ name, src, size = "md" }: { name: string; src?: string; size?: "md" | "lg" }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={`sb-avatar sb-avatar--${size}`} src={src} alt={name} />
  ) : (
    <span className={`sb-avatar sb-avatar--${size}`} aria-hidden>
      {initials(name)}
    </span>
  );
}
