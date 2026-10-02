import type { MetadataRoute } from 'next'
import { globalsixBlogSitemapEntries } from '@/lib/globalsix-blog/sitemap-entries'
import { absoluteUrl } from '@/lib/globalsix-blog/config'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    ...globalsixBlogSitemapEntries(),
  ]
}
