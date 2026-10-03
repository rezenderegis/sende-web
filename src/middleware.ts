import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const GLOBALSIX_HOSTS = ['globalsix.com.br', 'www.globalsix.com.br']

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host')?.split(':')[0] ?? ''
  const isGlobalSix = GLOBALSIX_HOSTS.includes(hostname)
  const { pathname } = req.nextUrl

  // Arquivo de verificação do Bing: cada domínio tem o seu próprio, mas o Bing
  // sempre busca em "/BingSiteAuth.xml" — então o roteamento pro arquivo certo
  // precisa acontecer aqui, independente do host ser GlobalSix ou não.
  if (pathname === '/BingSiteAuth.xml') {
    const file = isGlobalSix ? '/bing-auth/globalsix.xml' : '/bing-auth/sende.xml'
    return NextResponse.rewrite(new URL(file, req.url))
  }

  if (!isGlobalSix) return NextResponse.next()

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

export const config = {
  matcher: ['/', '/blog', '/blog/:path*', '/sitemap.xml', '/BingSiteAuth.xml'],
}
