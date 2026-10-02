import type { MetadataRoute } from 'next'
import { blogSitemapEntries } from '@/lib/blog/sitemap-entries'
import { absoluteUrl } from '@/lib/blog/config'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/termos-de-servico'), changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/politica-privacidade'), changeFrequency: 'yearly', priority: 0.3 },
    ...blogSitemapEntries(),
  ]
}
