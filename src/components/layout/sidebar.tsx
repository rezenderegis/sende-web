'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MessageSquare, Users, Phone, Settings, LogOut, LayoutDashboard, Contact, Tag, Megaphone, BookMarked, BotMessageSquare, AlertTriangle, ShoppingBag, Package, Upload, Zap, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/conversations', icon: MessageSquare, label: 'Conversas' },
  { href: '/contacts', icon: Contact, label: 'Contatos' },
  { href: '/broadcasts', icon: Megaphone, label: 'Broadcasts' },
  { href: '/broadcasts/failures', icon: AlertTriangle, label: 'Falhas de Entrega' },
]

const salesItems = [
  { href: '/sales', icon: ShoppingBag, label: 'Vendas' },
  { href: '/sales/import', icon: Upload, label: 'Importar' },
  { href: '/settings/products', icon: Package, label: 'Produtos' },
  { href: '/automations', icon: Zap, label: 'Automações' },
  { href: '/agenda', icon: Calendar, label: 'Agenda' },
]

const settingsItems = [
  { href: '/settings/numbers', icon: Phone, label: 'Números WhatsApp' },
  { href: '/settings/users', icon: Users, label: 'Usuários' },
  { href: '/settings/company', icon: Settings, label: 'Empresa' },
  { href: '/settings/tags', icon: Tag, label: 'Tags' },
  { href: '/settings/saved-messages', icon: BookMarked, label: 'Msgs Salvas' },
  { href: '/settings/prompts', icon: BotMessageSquare, label: 'Prompts IA' },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    logout()
    router.push('/login')
  }

  function isActive(href: string) {
    if (href === '/sales') return pathname === '/sales'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className={cn(
      'flex h-screen w-64 flex-col border-r bg-white',
      'fixed inset-y-0 left-0 z-50 transition-transform md:relative md:translate-x-0',
      isOpen ? 'translate-x-0' : '-translate-x-full',
    )}>
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-whatsapp">
          <MessageSquare className="h-4 w-4 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">Sende</span>
      </div>

      <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-green-50 text-whatsapp'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}

        <div className="pt-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Vendas
          </p>
          {salesItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-green-50 text-whatsapp'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="pt-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Configurações
          </p>
          {settingsItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-green-50 text-whatsapp'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="border-t p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="truncate text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-gray-600" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
