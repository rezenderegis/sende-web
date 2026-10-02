import type { PostMeta } from "@/lib/globalsix-blog/posts";

// Capa do post: usa a imagem do frontmatter (`cover`) ou gera uma capa
// tipográfica elegante, pro blog ficar bonito mesmo sem imagens.
const palettes = [
  ["#1A1225", "#8257E5", "#D7C6FF"],
  ["#120F1A", "#6D3FD6", "#B399F0"],
  ["#17131F", "#9B6BFF", "#F2B8FF"],
  ["#0F0F0F", "#8257E5", "#FFFFFF"],
];

const hash = (s: string) => Array.from(s).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function Cover({ post, size = "md" }: { post: PostMeta; size?: "sm" | "md" | "lg" }) {
  if (post.cover) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={`gsb-cover gsb-cover--${size}`} src={post.cover} alt={post.coverAlt ?? post.title} loading="lazy" />
    );
  }
  const h = hash(post.slug);
  const [bg, mid, hi] = palettes[h % palettes.length];
  const rot = (h % 60) - 30;
  return (
    <div
      className={`gsb-cover gsb-cover--${size} gsb-cover--gen`}
      style={{ "--c1": bg, "--c2": mid, "--c3": hi, "--rot": `${rot}deg` } as React.CSSProperties}
      aria-hidden
    >
      <span className="gsb-cover__orb" />
      <span className="gsb-cover__orb gsb-cover__orb--2" />
      <span className="gsb-cover__grid" />
      <span className="gsb-cover__label">{post.category}</span>
      <span className="gsb-cover__mark">G</span>
    </div>
  );
}
