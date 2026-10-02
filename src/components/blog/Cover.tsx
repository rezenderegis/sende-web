import type { PostMeta } from "@/lib/blog/posts";

// Capa do post: usa a imagem do frontmatter (`cover`) ou gera uma capa
// tipográfica elegante, para o blog ficar bonito mesmo sem imagens.
const palettes = [
  ["#0E3B2E", "#1FA463", "#C8F169"],
  ["#13202B", "#2E6BFF", "#7FE3C8"],
  ["#2A1A12", "#E2703A", "#F6D9A8"],
  ["#1B1631", "#7B5CFF", "#F2B8FF"],
  ["#0F2A2F", "#14B8A6", "#F7E07A"],
];

const hash = (s: string) => Array.from(s).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function Cover({ post, size = "md" }: { post: PostMeta; size?: "sm" | "md" | "lg" }) {
  if (post.cover) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={`sb-cover sb-cover--${size}`} src={post.cover} alt={post.coverAlt ?? post.title} loading="lazy" />
    );
  }
  const h = hash(post.slug);
  const [bg, mid, hi] = palettes[h % palettes.length];
  const rot = (h % 60) - 30;
  return (
    <div
      className={`sb-cover sb-cover--${size} sb-cover--gen`}
      style={{ "--c1": bg, "--c2": mid, "--c3": hi, "--rot": `${rot}deg` } as React.CSSProperties}
      aria-hidden
    >
      <span className="sb-cover__orb" />
      <span className="sb-cover__orb sb-cover__orb--2" />
      <span className="sb-cover__grid" />
      <span className="sb-cover__label">{post.category}</span>
      <span className="sb-cover__mark">S</span>
    </div>
  );
}
