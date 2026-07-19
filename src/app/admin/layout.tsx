'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, hydrate } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [])

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('sendi_token') : null
    if (!stored) {
      router.push('/login')
      return
    }
    if (user && !user.isPlatformAdmin) {
      router.push('/dashboard')
    }
  }, [user])

  if (!user?.isPlatformAdmin) return null

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex h-14 shrink-0 items-center gap-6 border-b bg-white px-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-teal-900">
          <ShieldCheck className="h-4 w-4 text-teal-600" />
          Admin Sendi
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/admin"
            className={cn('font-medium', pathname === '/admin' ? 'text-teal-700' : 'text-gray-500 hover:text-gray-700')}
          >
            Empresas
          </Link>
          <Link
            href="/admin/settings"
            className={cn('font-medium', pathname === '/admin/settings' ? 'text-teal-700' : 'text-gray-500 hover:text-gray-700')}
          >
            Configurações
          </Link>
          <Link
            href="/admin/reconciliation"
            className={cn('font-medium', pathname === '/admin/reconciliation' ? 'text-teal-700' : 'text-gray-500 hover:text-gray-700')}
          >
            Reconciliação
          </Link>
        </nav>
        <Link href="/dashboard" className="ml-auto text-xs text-gray-400 hover:text-gray-600">
          Voltar pro app
        </Link>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
