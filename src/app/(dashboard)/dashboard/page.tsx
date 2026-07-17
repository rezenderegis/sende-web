'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Users, Phone, TrendingUp, Clock, Calendar, ChevronDown } from 'lucide-react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, formatPhone } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import type { Conversation, Contact, WhatsappNumber, User, FollowOn } from '@/types'

function getWindowStatus(lastInboundAt: string | null): 'open' | 'closing' | 'closed' {
  if (!lastInboundAt) return 'closed'
  const remaining = 24 * 3600000 - (Date.now() - new Date(lastInboundAt).getTime())
  if (remaining <= 0) return 'closed'
  if (remaining <= 3 * 3600000) return 'closing'
  return 'open'
}

function getWindowLabel(lastInboundAt: string | null): string {
  if (!lastInboundAt) return 'Expirada'
  const remaining = 24 * 3600000 - (Date.now() - new Date(lastInboundAt).getTime())
  if (remaining <= 0) return 'Expirada'
  const hours = Math.floor(remaining / 3600000)
  const minutes = Math.floor((remaining % 3600000) / 60000)
  if (hours >= 1) return `fecha em ${hours}h`
  return `fecha em ${minutes}min`
}

function groupFollowOnsForSummary(all: FollowOn[]) {
  const now = new Date()
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const overdue: FollowOn[] = []
  const today: FollowOn[] = []
  for (const fo of all) {
    if (fo.status !== 'pending') continue
    const d = new Date(fo.scheduledAt)
    if (d < now) overdue.push(fo)
    else if (d <= todayEnd) today.push(fo)
  }
  return { overdue, today }
}

function StatCard({ title, value, icon: Icon, description }: {
  title: string
  value: number | string
  icon: any
  description?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const isManager = user?.role === 'owner' || user?.role === 'admin'
  const [filterUserId, setFilterUserId] = useState<string | null>(null)

  const { data: conversations } = useQuery<{ data: Conversation[]; total: number }>({
    queryKey: ['conversations'],
    queryFn: () => api.get('/conversations?limit=50').then((r) => r.data),
  })

  const { data: contacts } = useQuery<{ data: Contact[]; total: number }>({
    queryKey: ['contacts'],
    queryFn: () => api.get('/contacts').then((r) => r.data),
  })

  const { data: numbers } = useQuery<WhatsappNumber[]>({
    queryKey: ['whatsapp-numbers'],
    queryFn: () => api.get('/whatsapp/numbers').then((r) => r.data),
  })

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
    enabled: isManager,
  })

  const { data: followOns = [] } = useQuery<FollowOn[]>({
    queryKey: ['follow-ons', filterUserId],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filterUserId) params.set('userId', filterUserId)
      return api.get(`/follow-ons?${params}`).then((r) => r.data)
    },
    enabled: isManager,
  })

  const expiringConversations = (conversations?.data ?? [])
    .filter((c) => {
      if (getWindowStatus(c.lastInboundAt) === 'open') return false
      if (filterUserId && c.assignedUserId !== filterUserId) return false
      return true
    })
    .sort((a, b) => {
      const ta = a.lastInboundAt ? new Date(a.lastInboundAt).getTime() : 0
      const tb = b.lastInboundAt ? new Date(b.lastInboundAt).getTime() : 0
      return ta - tb
    })
    .slice(0, 8)

  const followOnSummary = groupFollowOnsForSummary(followOns)

  const openConversations = conversations?.data?.filter((c) => c.status === 'open').length ?? 0
  const pendingConversations = conversations?.data?.filter((c) => c.status === 'pending').length ?? 0

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-teal-900">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da sua plataforma</p>
      </div>

      <div className="grid gap-3 grid-cols-2 md:gap-4 lg:grid-cols-4">
        <StatCard
          title="Conversas abertas"
          value={openConversations}
          icon={MessageSquare}
          description={`${pendingConversations} pendentes`}
        />
        <StatCard
          title="Total de contatos"
          value={contacts?.total ?? 0}
          icon={Users}
        />
        <StatCard
          title="Números ativos"
          value={numbers?.filter((n) => n.isActive).length ?? 0}
          icon={Phone}
        />
        <StatCard
          title="Total de conversas"
          value={conversations?.total ?? 0}
          icon={TrendingUp}
        />
      </div>

      {isManager && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-teal-900">Visão gerencial</h2>
            <div className="relative">
              <select
                value={filterUserId ?? ''}
                onChange={(e) => setFilterUserId(e.target.value || null)}
                className="h-9 rounded-lg border border-gray-200 pl-3 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-600 appearance-none bg-white"
              >
                <option value="">Todos os atendentes</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conversas a expirar</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {expiringConversations.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhuma conversa expirando</p>
                ) : (
                  expiringConversations.map((conv) => {
                    const ws = getWindowStatus(conv.lastInboundAt)
                    return (
                      <Link
                        key={conv.id}
                        href={`/conversations/${conv.id}`}
                        className="flex items-center gap-3 border-b px-4 py-3 last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                          {conv.contact?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {conv.contact?.name || formatPhone(conv.contact?.phone || '')}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{conv.whatsappNumber?.phoneNumber}</p>
                        </div>
                        <span className={cn(
                          'shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                          ws === 'closing' && 'bg-amber-100 text-amber-800 font-semibold',
                          ws === 'closed' && 'bg-gray-100 text-gray-400',
                        )}>
                          <Clock className="h-3 w-3" />
                          {getWindowLabel(conv.lastInboundAt)}
                        </span>
                      </Link>
                    )
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agenda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-8">
                  <div>
                    <p className="text-2xl font-bold text-amber-700">{followOnSummary.overdue.length}</p>
                    <p className="text-xs text-muted-foreground">Atrasados</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-teal-700">{followOnSummary.today.length}</p>
                    <p className="text-xs text-muted-foreground">Hoje</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-4 gap-2">
                  <Link href="/agenda">
                    <Calendar className="h-4 w-4" />
                    Ver agenda completa
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-teal-900">Conversas recentes</h2>
        <Card>
          <CardContent className="p-0">
            {conversations?.data?.slice(0, 5).map((conv) => (
              <div key={conv.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                  {conv.contact?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{conv.contact?.name || conv.contact?.phone}</p>
                  <p className="text-sm text-muted-foreground">{conv.whatsappNumber?.phoneNumber}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                  conv.status === 'open' ? 'bg-teal-100 text-teal-700'
                  : conv.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600'
                }`}>
                  {conv.status === 'open' ? 'Aberta' : conv.status === 'pending' ? 'Pendente' : 'Fechada'}
                </span>
              </div>
            ))}
            {!conversations?.data?.length && (
              <div className="py-12 text-center text-muted-foreground">
                Nenhuma conversa ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
