import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/*
  Componentes que você pode usar dentro dos posts (.mdx):

  <Figure src="https://..." alt="..." caption="Legenda opcional" />
  <Gallery images={["https://...", "https://..."]} />
  <YouTube id="dQw4w9WgXcQ" />            (ou url="https://youtu.be/...")
  <Video src="https://.../video.mp4" poster="https://.../capa.jpg" />
  <Embed src="https://player.vimeo.com/video/123" title="..." />
  <Callout type="tip|info|warn" title="...">Texto</Callout>
  <Stat value="98%" label="taxa de abertura" />
  <CTA />   (bloco de conversão no meio do post)
*/

function youtubeId(input?: string) {
  if (!input) return "";
  const m = input.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : input;
}

export function Figure({ src, alt = "", caption, wide }: { src: string; alt?: string; caption?: string; wide?: boolean }) {
  return (
    <figure className={`gsb-figure${wide ? " gsb-figure--wide" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export function Gallery({ images, caption }: { images: string[]; caption?: string }) {
  return (
    <figure className="gsb-figure gsb-figure--wide">
      <div className="gsb-gallery">
        {images.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" loading="lazy" />
        ))}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export function YouTube({ id, url, title = "Vídeo", caption }: { id?: string; url?: string; title?: string; caption?: string }) {
  const vid = youtubeId(id ?? url);
  return (
    <figure className="gsb-figure gsb-figure--wide">
      <div className="gsb-embed">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${vid}?rel=0`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export function Video({ src, poster, caption }: { src: string; poster?: string; caption?: string }) {
  return (
    <figure className="gsb-figure gsb-figure--wide">
      <video className="gsb-video" src={src} poster={poster} controls playsInline preload="metadata" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export function Embed({ src, title = "Conteúdo incorporado", ratio = "16/9", caption }: { src: string; title?: string; ratio?: string; caption?: string }) {
  return (
    <figure className="gsb-figure gsb-figure--wide">
      <div className="gsb-embed" style={{ aspectRatio: ratio }}>
        <iframe src={src} title={title} loading="lazy" allowFullScreen />
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

const calloutIcon = { tip: "✦", info: "i", warn: "!" } as const;

export function Callout({ type = "info", title, children }: { type?: keyof typeof calloutIcon; title?: string; children: ReactNode }) {
  return (
    <aside className={`gsb-callout gsb-callout--${type}`}>
      <span className="gsb-callout__icon" aria-hidden>{calloutIcon[type]}</span>
      <div>
        {title && <strong className="gsb-callout__title">{title}</strong>}
        {children}
      </div>
    </aside>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="gsb-stat">
      <span className="gsb-stat__value">{value}</span>
      <span className="gsb-stat__label">{label}</span>
    </div>
  );
}

export function Stats({ children }: { children: ReactNode }) {
  return <div className="gsb-stats">{children}</div>;
}

export function InlineCTA({ title, text, label = "Conhecer a GlobalSix", href = "/globalsix#contato" }: { title?: string; text?: string; label?: string; href?: string }) {
  return (
    <aside className="gsb-inline-cta">
      <div>
        <strong>{title ?? "Tem um projeto de tecnologia em mente?"}</strong>
        <p>{text ?? "A GlobalSix desenvolve sistemas sob medida e soluções de IA de ponta a ponta."}</p>
      </div>
      <Link href={href} className="gsb-btn">{label} →</Link>
    </aside>
  );
}

function A({ href = "", ...props }: ComponentProps<"a">) {
  if (href.startsWith("/") || href.startsWith("#")) return <Link href={href} {...props} />;
  return <a href={href} target="_blank" rel="noopener noreferrer" {...props} />;
}

function Img(props: ComponentProps<"img">) {
  return <Figure src={String(props.src ?? "")} alt={props.alt ?? ""} caption={props.title ?? undefined} />;
}

function Table(props: ComponentProps<"table">) {
  return (
    <div className="gsb-table">
      <table {...props} />
    </div>
  );
}

export const mdxComponents = {
  a: A,
  img: Img,
  table: Table,
  Figure,
  Gallery,
  YouTube,
  Video,
  Embed,
  Callout,
  Stat,
  Stats,
  CTA: InlineCTA,
};
