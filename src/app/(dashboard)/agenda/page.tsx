'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Calendar, Phone, Users, MessageSquare, Clock, CheckCheck, RotateCcw, X, ChevronDown, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import type { FollowOn, User } from '@/types'

const TYPE_CONFIG = {
  meeting: { label: 'Reunião', icon: Users, className: 'bg-blue-100 text-blue-700' },
  call: { label: 'Ligação', icon: Phone, className: 'bg-teal-100 text-teal-700' },
  message: { label: 'Envio automático', icon: MessageSquare, className: 'bg-violet-100 text-violet-700' },
  message_manual: { label: 'Mensagem', icon: MessageSquare, className: 'bg-teal-100 text-teal-700' },
} as const

const STATUS_CONFIG = {
  pending: { label: 'Pendente', className: 'bg-amber-100 text-amber-700' },
  done: { label: 'Concluído', className: 'bg-teal-100 text-teal-700' },
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

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDateHeader(d: Date): string {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === tomorrow.toDateString()) return 'Amanhã'
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

function groupByDate(items: FollowOn[]): { label: string; items: FollowOn[] }[] {
  const map = new Map<string, FollowOn[]>()
  for (const fo of items) {
    const key = new Date(fo.scheduledAt).toDateString()
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(fo)
  }
  return Array.from(map.entries()).map(([key, dayItems]) => ({
    label: formatDateHeader(new Date(key)),
    items: dayItems,
  }))
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

function FollowOnCard({ fo, onDelete, onEdit }: {
  fo: FollowOn
  onDelete: (id: string) => void
  onEdit: (fo: FollowOn) => void
}) {
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
            onClick={() => onEdit(fo)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-gray-900"
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => router.push(`/conversations/${fo.conversationId}`)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-gray-900"
            title="Abrir conversa"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(fo.id)} className="text-xs text-muted-foreground hover:text-red-500" title="Excluir">
            <X className="h-3.5 w-3.5" />
          </button>
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

function Section({ title, items, onDelete, onEdit, defaultOpen = true, byDate = false }: {
  title: string
  items: FollowOn[]
  onDelete: (id: string) => void
  onEdit: (fo: FollowOn) => void
  defaultOpen?: boolean
  byDate?: boolean
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
        <div className="space-y-4 pl-6">
          {byDate ? (
            groupByDate(items).map(({ label, items: dayItems }) => (
              <div key={label} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                <div className="space-y-2">
                  {dayItems.map((fo) => <FollowOnCard key={fo.id} fo={fo} onDelete={onDelete} onEdit={onEdit} />)}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-2">
              {items.map((fo) => <FollowOnCard key={fo.id} fo={fo} onDelete={onDelete} onEdit={onEdit} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EditFollowOnModal({ fo, users, onClose, onDelete }: {
  fo: FollowOn
  users: User[]
  onClose: () => void
  onDelete: (id: string) => void
}) {
  const qc = useQueryClient()
  const [type, setType] = useState<FollowOn['type']>(fo.type)
  const [scheduledAt, setScheduledAt] = useState(toDatetimeLocal(fo.scheduledAt))
  const [note, setNote] = useState(fo.note ?? '')
  const [assignedUserId, setAssignedUserId] = useState(fo.assignedUserId ?? '')
  const [message, setMessage] = useState(fo.message ?? '')
  const isPending = fo.status === 'pending'

  const invalidate = () => qc.invalidateQueries({ queryKey: ['follow-ons'] })

  const saveMutation = useMutation({
    mutationFn: () => api.patch(`/follow-ons/${fo.id}`, {
      type,
      scheduledAt: new Date(scheduledAt).toISOString(),
      note: note || undefined,
      assignedUserId: assignedUserId || undefined,
      ...(type === 'message' ? { message: message || undefined } : {}),
    }),
    onSuccess: () => {
      invalidate()
      toast({ title: 'Follow-on atualizado', variant: 'success' })
      onClose()
    },
    onError: () => toast({ title: 'Erro ao salvar', variant: 'destructive' }),
  })

  const completeMutation = useMutation({
    mutationFn: () => api.patch(`/follow-ons/${fo.id}/complete`),
    onSuccess: () => {
      invalidate()
      toast({ title: 'Follow-on concluído', variant: 'success' })
      onClose()
    },
    onError: () => toast({ title: 'Erro ao concluir', variant: 'destructive' }),
  })

  const reopenMutation = useMutation({
    mutationFn: () => api.patch(`/follow-ons/${fo.id}/reopen`),
    onSuccess: () => {
      invalidate()
      toast({ title: 'Follow-on marcado como pendente', variant: 'success' })
      onClose()
    },
    onError: () => toast({ title: 'Erro ao reabrir', variant: 'destructive' }),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-teal-900">Editar follow-on</h2>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_CONFIG[fo.status].className)}>
              {STATUS_CONFIG[fo.status].label}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FollowOn['type'])}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="call">Ligação</option>
              <option value="meeting">Reunião</option>
              <option value="message_manual">Mensagem (lembrete manual)</option>
              <option value="message">Mensagem (envio automático)</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Data e hora</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Anotação</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Adicione uma anotação sobre esse follow-on..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {type === 'message' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Mensagem a enviar</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              />
              {fo.templateName && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Este follow-on usa o template <span className="font-mono">{fo.templateName}</span>; editar a mensagem acima não altera o template.
                </p>
              )}
            </div>
          )}

          {users.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Atribuir a</label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t px-5 py-4">
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => { onDelete(fo.id); onClose() }}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Excluir
          </Button>
          {isPending ? (
            <Button
              variant="outline"
              className="text-teal-700 border-teal-200 hover:bg-teal-50"
              disabled={completeMutation.isPending}
              onClick={() => completeMutation.mutate()}
            >
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              Marcar como concluído
            </Button>
          ) : (
            <Button
              variant="outline"
              className="text-amber-700 border-amber-200 hover:bg-amber-50"
              disabled={reopenMutation.isPending}
              onClick={() => reopenMutation.mutate()}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Marcar como pendente
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AgendaPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const isManager = user?.role === 'owner' || user?.role === 'admin'
  const [filterUserId, setFilterUserId] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)
  const [editingFo, setEditingFo] = useState<FollowOn | null>(null)

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
          <h1 className="text-xl font-semibold text-teal-900">Agenda</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Follow-ons agendados</p>
        </div>
        {isManager && (
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
              onDelete={(id) => deleteMutation.mutate(id)}
              onEdit={setEditingFo}
            />
          )}
          <Section
            title="Hoje"
            items={today}
            onDelete={(id) => deleteMutation.mutate(id)}
            onEdit={setEditingFo}
          />
          <Section
            title="Próximos"
            items={upcoming}
            onDelete={(id) => deleteMutation.mutate(id)}
            onEdit={setEditingFo}
            defaultOpen={overdue.length === 0 && today.length === 0}
            byDate
          />
          {done.length > 0 && (
            <div>
              <button
                onClick={() => setShowDone((v) => !v)}
                className="text-xs text-muted-foreground hover:text-gray-700"
              >
                {showDone ? 'Ocultar' : `Ver ${done.length} concluído(s)`}
              </button>
              {showDone && (
                <div className="mt-2 space-y-2">
                  <Section
                    title="Concluídos"
                    items={done}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onEdit={setEditingFo}
                    defaultOpen={true}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {editingFo && (
        <EditFollowOnModal
          fo={editingFo}
          users={users}
          onClose={() => setEditingFo(null)}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}
    </div>
  )
}
