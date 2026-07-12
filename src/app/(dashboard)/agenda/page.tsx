'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Calendar, Phone, Users, MessageSquare, Clock, CheckCheck, X, ChevronDown, ExternalLink } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import type { FollowOn, FollowOnStatus, User } from '@/types'

const TYPE_CONFIG = {
  meeting: { label: 'Reunião', icon: Users, className: 'bg-blue-100 text-blue-700' },
  call: { label: 'Ligação', icon: Phone, className: 'bg-green-100 text-green-700' },
  message: { label: 'Mensagem', icon: MessageSquare, className: 'bg-violet-100 text-violet-700' },
}

const STATUS_CONFIG = {
  pending: { label: 'Pendente', className: 'bg-amber-100 text-amber-700' },
  done: { label: 'Concluído', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-500' },
}

function formatScheduledAt(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === today.toDateString()) return `Hoje · ${time}`
  if (d.toDateString() === tomorrow.toDateString()) return `Amanhã · ${time}`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ` · ${time}`
}

function groupFollowOns(followOns: FollowOn[]) {
  const now = new Date()
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const overdue: FollowOn[] = []
  const today: FollowOn[] = []
  const upcoming: FollowOn[] = []
  const done: FollowOn[] = []

  for (const fo of followOns) {
    if (fo.status === 'done' || fo.status === 'cancelled') {
      done.push(fo)
      continue
    }
    const d = new Date(fo.scheduledAt)
    if (d < now) overdue.push(fo)
    else if (d <= todayEnd) today.push(fo)
    else upcoming.push(fo)
  }

  return { overdue, today, upcoming, done }
}

function FollowOnCard({ fo, onCancel, onDelete }: { fo: FollowOn; onCancel: (id: string) => void; onDelete: (id: string) => void }) {
  const router = useRouter()
  const typeConfig = TYPE_CONFIG[fo.type]
  const TypeIcon = typeConfig.icon
  const isPending = fo.status === 'pending'

  return (
    <div className={cn(
      'rounded-lg border bg-white p-4 space-y-2',
      !isPending && 'opacity-60',
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0', typeConfig.className)}>
            <TypeIcon className="h-3 w-3" />
            {typeConfig.label}
          </span>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium shrink-0', STATUS_CONFIG[fo.status].className)}>
            {STATUS_CONFIG[fo.status].label}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => router.push(`/conversations/${fo.conversationId}`)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-gray-900"
            title="Abrir conversa"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          {isPending && (
            <button onClick={() => onCancel(fo.id)} className="text-xs text-muted-foreground hover:text-red-500" title="Cancelar">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {!isPending && (
            <button onClick={() => onDelete(fo.id)} className="text-xs text-muted-foreground hover:text-red-500" title="Excluir">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {formatScheduledAt(fo.scheduledAt)}
      </div>

      {fo.note && (
        <p className="text-sm text-gray-600">{fo.note}</p>
      )}

      {fo.type === 'message' && (fo.message || fo.templateName) && (
        <p className="text-xs text-muted-foreground font-mono line-clamp-1">
          {fo.templateName ? `Template: ${fo.templateName}` : fo.message}
        </p>
      )}

      {fo.assignedUser && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600">
            {fo.assignedUser.name.charAt(0).toUpperCase()}
          </div>
          {fo.assignedUser.name.split(' ')[0]}
        </div>
      )}
    </div>
  )
}

function Section({ title, items, onCancel, onDelete, defaultOpen = true }: {
  title: string
  items: FollowOn[]
  onCancel: (id: string) => void
  onDelete: (id: string) => void
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  if (!items.length) return null
  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-700"
      >
        <ChevronDown className={cn('h-4 w-4 transition-transform', !open && '-rotate-90')} />
        {title}
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">{items.length}</span>
      </button>
      {open && (
        <div className="space-y-2 pl-6">
          {items.map((fo) => <FollowOnCard key={fo.id} fo={fo} onCancel={onCancel} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  )
}

export default function AgendaPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const isManager = user?.role === 'owner' || user?.role === 'admin'
  const [filterUserId, setFilterUserId] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
    enabled: isManager,
  })

  const { data: followOns = [], isLoading } = useQuery<FollowOn[]>({
    queryKey: ['follow-ons', filterUserId],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filterUserId) params.set('userId', filterUserId)
      return api.get(`/follow-ons?${params}`).then((r) => r.data)
    },
    refetchInterval: 30000,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/follow-ons/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-ons'] })
      toast({ title: 'Follow-on cancelado', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao cancelar', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/follow-ons/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-ons'] })
      toast({ title: 'Follow-on removido', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao remover', variant: 'destructive' }),
  })

  const { overdue, today, upcoming, done } = groupFollowOns(followOns)
  const activeUser = users.find((u) => u.id === filterUserId)

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Agenda</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Follow-ons agendados</p>
        </div>
        {isManager && (
          <div className="relative">
            <select
              value={filterUserId ?? ''}
              onChange={(e) => setFilterUserId(e.target.value || null)}
              className="h-9 rounded-lg border border-gray-200 pl-3 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none bg-white"
            >
              <option value="">Todos os atendentes</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (overdue.length + today.length + upcoming.length + done.length) === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Calendar className="h-10 w-10 opacity-20" />
          <p className="text-sm">Nenhum follow-on agendado</p>
        </div>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <Section
              title="Atrasados"
              items={overdue}
              onCancel={(id) => cancelMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          )}
          <Section
            title="Hoje"
            items={today}
            onCancel={(id) => cancelMutation.mutate(id)}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
          <Section
            title="Próximos"
            items={upcoming}
            onCancel={(id) => cancelMutation.mutate(id)}
            onDelete={(id) => deleteMutation.mutate(id)}
            defaultOpen={overdue.length === 0 && today.length === 0}
          />
          {done.length > 0 && (
            <div>
              <button
                onClick={() => setShowDone((v) => !v)}
                className="text-xs text-muted-foreground hover:text-gray-700"
              >
                {showDone ? 'Ocultar' : `Ver ${done.length} concluído(s)/cancelado(s)`}
              </button>
              {showDone && (
                <div className="mt-2 space-y-2">
                  <Section
                    title="Concluídos / Cancelados"
                    items={done}
                    onCancel={(id) => cancelMutation.mutate(id)}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    defaultOpen={true}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
