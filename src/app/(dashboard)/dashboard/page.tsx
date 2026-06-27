'use client'

import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Users, Phone, TrendingUp } from 'lucide-react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Conversation, Contact, WhatsappNumber } from '@/types'

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
  const { data: conversations } = useQuery<{ data: Conversation[]; total: number }>({
    queryKey: ['conversations'],
    queryFn: () => api.get('/conversations').then((r) => r.data),
  })

  const { data: contacts } = useQuery<{ data: Contact[]; total: number }>({
    queryKey: ['contacts'],
    queryFn: () => api.get('/contacts').then((r) => r.data),
  })

  const { data: numbers } = useQuery<WhatsappNumber[]>({
    queryKey: ['whatsapp-numbers'],
    queryFn: () => api.get('/whatsapp/numbers').then((r) => r.data),
  })

  const openConversations = conversations?.data?.filter((c) => c.status === 'open').length ?? 0
  const pendingConversations = conversations?.data?.filter((c) => c.status === 'pending').length ?? 0

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da sua plataforma</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Conversas recentes</h2>
        <Card>
          <CardContent className="p-0">
            {conversations?.data?.slice(0, 5).map((conv) => (
              <div key={conv.id} className="flex items-center gap-4 border-b px-6 py-4 last:border-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                  {conv.contact?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{conv.contact?.name || conv.contact?.phone}</p>
                  <p className="text-sm text-muted-foreground">{conv.whatsappNumber?.phoneNumber}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                  conv.status === 'open' ? 'bg-green-100 text-green-700'
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
