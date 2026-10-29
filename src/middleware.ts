import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const GLOBALSIX_HOSTS = ['globalsix.com.br', 'www.globalsix.com.br']
const SF_PINTURA_HOSTS = ['sfpinturaautomotivago.com.br', 'www.sfpinturaautomotivago.com.br']

// Cache em memória do processo pra não bater no backend a cada requisição —
// instâncias de Edge Middleware ficam "quentes" por um tempo entre
// requisições, então isso já reduz bastante a chamada real. TTL curto
// porque o domínio pode ser cadastrado/trocado no admin a qualquer momento.
const siteDomainCache = new Map<string, { slug: string | null; expiresAt: number }>()
const SITE_CACHE_TTL_MS = 30_000

async function resolveSiteSlug(domain: string): Promise<string | null> {
  const cached = siteDomainCache.get(domain)
  if (cached && cached.expiresAt > Date.now()) return cached.slug

  let slug: string | null = null
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sites/by-domain/${encodeURIComponent(domain)}`)
    if (res.ok) {
      const data = await res.json()
      slug = data.slug ?? null
    }
  } catch {
    slug = null
  }

  siteDomainCache.set(domain, { slug, expiresAt: Date.now() + SITE_CACHE_TTL_MS })
  return slug
}

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get('host')?.split(':')[0] ?? ''
  const isGlobalSix = GLOBALSIX_HOSTS.includes(hostname)
  const isSfPintura = SF_PINTURA_HOSTS.includes(hostname)
  const { pathname } = req.nextUrl

  // Arquivo de verificação do Bing: cada domínio tem o seu próprio, mas o Bing
  // sempre busca em "/BingSiteAuth.xml" — então o roteamento pro arquivo certo
  // precisa acontecer aqui, independente do host ser GlobalSix ou não.
  if (pathname === '/BingSiteAuth.xml') {
    const file = isGlobalSix ? '/bing-auth/globalsix.xml' : '/bing-auth/sende.xml'
    return NextResponse.rewrite(new URL(file, req.url))
  }

  if (isSfPintura && pathname === '/') {
    return NextResponse.rewrite(new URL('/sf-pintura', req.url))
  }

  if (isGlobalSix) {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/globalsix', req.url))
    }
    if (pathname === '/blog' || pathname.startsWith('/blog/')) {
      return NextResponse.rewrite(new URL(`/globalsix${pathname}`, req.url))
    }
    if (pathname === '/sitemap.xml') {
      return NextResponse.rewrite(new URL('/globalsix/sitemap.xml', req.url))
    }
    return NextResponse.next()
  }

  // Sites genéricos do GlobalSixPages — qualquer outro domínio apontado pra
  // esse projeto (não o próprio domínio do Sende) é resolvido contra os
  // sites cadastrados. Se não achar nada (ex: sende.app.br, localhost),
  // segue o roteamento normal sem nenhuma alteração.
  if (pathname === '/') {
    const slug = await resolveSiteSlug(hostname)
    if (slug) {
      return NextResponse.rewrite(new URL(`/sites/${slug}`, req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/blog', '/blog/:path*', '/sitemap.xml', '/BingSiteAuth.xml'],
}
