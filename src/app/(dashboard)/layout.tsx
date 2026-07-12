'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import { NotificationBell } from '@/components/layout/notification-bell'
import { useAuthStore } from '@/store/auth.store'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { hydrate } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    hydrate()
  }, [])

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('sendi_token') : null
    if (!stored) {
      router.push('/login')
    }
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b bg-white px-4">
          <button onClick={() => setSidebarOpen(true)} className="p-1 text-gray-600 md:hidden">
            <Menu className="h-6 w-6" />
          </button>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
