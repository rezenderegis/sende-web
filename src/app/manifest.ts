import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sende',
    short_name: 'Sende',
    description: 'CRM conversacional para WhatsApp',
    start_url: '/',
    display: 'standalone',
    theme_color: '#0D9488',
    background_color: '#FFFFFF',
    icons: [
      { src: '/brand/sende-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/sende-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
