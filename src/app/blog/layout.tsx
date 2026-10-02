import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/nav";
import LandingFooter from "@/components/landing/footer";
import { blogConfig, absoluteUrl } from "@/lib/blog/config";
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

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sb">
      <LandingNav />

      <main>{children}</main>

      <section className="sb-container">
        <div className="sb-cta">
          <div className="sb-cta__glow" aria-hidden />
          <div className="sb-cta__content">
            <span className="sb-kicker">Sende · API oficial do WhatsApp</span>
            <h2>{blogConfig.cta.title}</h2>
            <p>{blogConfig.cta.text}</p>
          </div>
          <Link href={blogConfig.cta.href} className="sb-btn sb-btn--light">
            {blogConfig.cta.label} →
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
