import type { Metadata } from "next";
import Link from "next/link";
import GlobalSixNav from "@/components/globalsix/nav";
import GlobalSixFooter from "@/components/globalsix/footer";
import GlobalSixWhatsAppFloat from "@/components/globalsix/whatsapp-float";
import { blogConfig, absoluteUrl } from "@/lib/globalsix-blog/config";
import "./blog.css";

export const metadata: Metadata = {
  metadataBase: new URL(blogConfig.siteUrl),
  title: { default: blogConfig.blogTitle, template: `%s · ${blogConfig.blogTitle}` },
  description: blogConfig.description,
  alternates: {
    canonical: absoluteUrl("/blog"),
    types: { "application/rss+xml": absoluteUrl("/blog/feed.xml") },
  },
  openGraph: { type: "website", locale: blogConfig.locale, siteName: blogConfig.siteName },
};

export default function GlobalSixBlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="gsb">
      <GlobalSixNav />

      <main>{children}</main>

      <section className="gsb-container">
        <div className="gsb-cta">
          <div className="gsb-cta__glow" aria-hidden />
          <div className="gsb-cta__content">
            <span className="gsb-kicker">GlobalSix · Tecnologia sob medida</span>
            <h2>{blogConfig.cta.title}</h2>
            <p>{blogConfig.cta.text}</p>
          </div>
          <Link href={blogConfig.cta.href} className="gsb-btn gsb-btn--light">
            {blogConfig.cta.label} →
          </Link>
        </div>
      </section>

      <GlobalSixFooter />
      <GlobalSixWhatsAppFloat />
    </div>
  );
}
