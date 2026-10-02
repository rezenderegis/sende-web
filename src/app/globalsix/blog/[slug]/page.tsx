import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { getAllPosts, getPost, getRelated, formatDate, tagSlug } from "@/lib/globalsix-blog/posts";
import { getAuthor, initials } from "@/lib/globalsix-blog/authors";
import { absoluteUrl, blogConfig } from "@/lib/globalsix-blog/config";
import { mdxComponents } from "@/components/globalsix-blog/mdx";
import { Cover } from "@/components/globalsix-blog/Cover";
import { PostCard } from "@/components/globalsix-blog/PostCard";
import { ShareBar } from "@/components/globalsix-blog/ShareBar";
import { ReadingProgress } from "@/components/globalsix-blog/ReadingProgress";

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

export default async function GlobalSixPostPage({ params }: Props) {
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
    <article className="gsb-post">
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="gsb-container gsb-post__header">
        <nav className="gsb-crumbs" aria-label="Navegação">
          <Link href="/globalsix/blog">Blog</Link>
          <span>/</span>
          <span>{post.category}</span>
        </nav>
        <h1 className="gsb-post__title">{post.title}</h1>
        <p className="gsb-post__lead">{post.description}</p>
        <div className="gsb-byline">
          <Avatar name={author.name} src={author.avatar} />
          <div>
            <strong>{author.name}</strong>
            <span>
              <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingMinutes} min de leitura
            </span>
          </div>
        </div>
      </header>

      <div className="gsb-container gsb-post__cover">
        <Cover post={post} size="lg" />
      </div>

      <div className="gsb-container gsb-post__layout">
        <aside className="gsb-toc">
          {post.headings.length > 1 && (
            <>
              <span className="gsb-section-label">Neste artigo</span>
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

        <div className="gsb-prose">
          <MDXRemote
            source={post.content}
            components={mdxComponents}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] } }}
          />

          <div className="gsb-post__footer">
            <div className="gsb-tags">
              {post.tags.map((t) => (
                <Link key={t} href={`/globalsix/blog/tag/${tagSlug(t)}`} className="gsb-tag">
                  {t}
                </Link>
              ))}
            </div>
            <ShareBar url={url} title={post.title} />
          </div>

          <div className="gsb-author">
            <Avatar name={author.name} src={author.avatar} size="lg" />
            <div>
              <span className="gsb-section-label">Escrito por</span>
              <strong className="gsb-author__name">{author.name}</strong>
              <span className="gsb-author__role">{author.role}</span>
              <p>{author.bio}</p>
              {author.linkedin && (
                <a href={author.linkedin} target="_blank" rel="noopener noreferrer" className="gsb-link">
                  LinkedIn →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="gsb-container gsb-section">
          <div className="gsb-section__head">
            <h2>Continue lendo</h2>
            <Link href="/globalsix/blog" className="gsb-link">Ver todos →</Link>
          </div>
          <div className="gsb-grid">
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
    <img className={`gsb-avatar gsb-avatar--${size}`} src={src} alt={name} />
  ) : (
    <span className={`gsb-avatar gsb-avatar--${size}`} aria-hidden>
      {initials(name)}
    </span>
  );
}
