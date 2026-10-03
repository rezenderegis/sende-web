import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin',
        '/admin/',
        '/dashboard',
        '/conversations',
        '/contacts',
        '/broadcasts',
        '/leads',
        '/sales',
        '/automations',
        '/agenda',
        '/settings',
        '/settings/',
        '/usage',
        '/login',
        '/register',
      ],
    },
    sitemap: ['https://sende.app.br/sitemap.xml', 'https://www.globalsix.com.br/sitemap.xml'],
  }
}
