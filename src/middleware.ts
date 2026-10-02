import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const GLOBALSIX_HOSTS = ['globalsix.com.br', 'www.globalsix.com.br']

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host')?.split(':')[0] ?? ''
  if (!GLOBALSIX_HOSTS.includes(hostname)) return NextResponse.next()

  const { pathname } = req.nextUrl

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
  matcher: ['/', '/blog', '/blog/:path*', '/sitemap.xml'],
}
