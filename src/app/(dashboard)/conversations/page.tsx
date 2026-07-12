'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Search, MessageSquare, Plus, X, UserCircle, ChevronDown, Zap, Clock } from 'lucide-react'
import api from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { timeAgo, formatPhone, cn } from '@/lib/utils'
import type { Conversation, WhatsappNumber, WhatsappTemplate, Tag, User } from '@/types'

type WindowFilter = 'all' | 'open' | 'closing' | 'closed'

const statusLabel: Record<string, string> = {
  open: 'Aberta',
  pending: 'Pendente',
  closed: 'Fechada',
}

const statusVariant: Record<string, any> = {
  open: 'success',
  pending: 'warning',
  closed: 'secondary',
}

function getWindowStatus(lastInboundAt: string | null): 'open' | 'closing' | 'closed' {
  if (!lastInboundAt) return 'closed'
  const elapsed = Date.now() - new Date(lastInboundAt).getTime()
  const remaining = 24 * 3600000 - elapsed
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
  if (hours >= 1) return `${hours}h`
  return `${minutes}min`
}

const windowFilters: { key: WindowFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'open', label: 'Janela aberta' },
  { key: 'closing', label: 'Fechando' },
  { key: 'closed', label: 'Expirada' },
]

export default function ConversationsPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [activeTagId, setActiveTagId] = useState<string | null>(null)
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [windowFilter, setWindowFilter] = useState<WindowFilter>('all')
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const userFilterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userFilterRef.current && !userFilterRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false)
        setUserSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const [form, setForm] = useState({
    whatsappNumberId: '',
    to: '',
    templateName: 'hello_world',
    templateLanguage: 'pt_BR',
  })

  const { data: tagsData = [] } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: () => api.get('/tags').then((r) => r.data),
  })

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  })

  const { data, isLoading } = useQuery<{ data: Conversation[]; total: number }>({
    queryKey: ['conversations', activeTagId],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '50' })
      if (activeTagId) params.set('tagId', activeTagId)
      return api.get(`/conversations?${params}`).then((r) => r.data)
    },
    refetchInterval: 10000,
  })

  const { data: numbers } = useQuery<WhatsappNumber[]>({
    queryKey: ['whatsapp-numbers'],
    queryFn: () => api.get('/whatsapp/numbers').then((r) => r.data),
  })

  const { data: templates = [] } = useQuery<WhatsappTemplate[]>({
    queryKey: ['whatsapp-templates', form.whatsappNumberId],
    queryFn: () =>
      api.get(`/whatsapp/numbers/${form.whatsappNumberId}/templates`).then((r) => r.data),
    enabled: !!form.whatsappNumberId,
  })

  const approvedTemplates = templates.filter((t) => t.status === 'APPROVED')
  const selectedTemplate = approvedTemplates.find((t) => t.name === form.templateName && t.language === form.templateLanguage)

  const sendMutation = useMutation({
    mutationFn: () =>
      api.post('/whatsapp/messages/send', {
        whatsappNumberId: form.whatsappNumberId,
        to: form.to,
        type: 'template',
        templateName: form.templateName,
        templateLanguage: form.templateLanguage,
      }),
    onSuccess: () => {
      toast({ title: 'Mensagem enviada!', description: 'A conversa aparecerá em instantes.', variant: 'success' })
      setShowNew(false)
      setForm({ whatsappNumberId: '', to: '', templateName: '', templateLanguage: '' })
      setTimeout(() => qc.invalidateQueries({ queryKey: ['conversations'] }), 2000)
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao enviar',
        description: err.response?.data?.message || 'Verifique o número e o template',
        variant: 'destructive',
      })
    },
  })

  const activeUser = users.find((u) => u.id === activeUserId)
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()),
  )

  let conversations = data?.data?.filter((c) => {
    if (search && !c.contact?.name?.toLowerCase().includes(search.toLowerCase()) && !c.contact?.phone?.includes(search)) return false
    if (activeUserId && c.assignedUserId !== activeUserId) return false
    if (windowFilter !== 'all') {
      const ws = getWindowStatus(c.lastInboundAt)
      if (windowFilter === 'open' && ws === 'closed') return false
      if (windowFilter === 'closing' && ws !== 'closing') return false
      if (windowFilter === 'closed' && ws !== 'closed') return false
    }
    return true
  }) ?? []

  if (windowFilter === 'closing') {
    conversations = [...conversations].sort((a, b) => {
      const ta = a.lastInboundAt ? new Date(a.lastInboundAt).getTime() : 0
      const tb = b.lastInboundAt ? new Date(b.lastInboundAt).getTime() : 0
      return ta - tb
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-teal-900">Conversas</h1>
          <Button size="sm" className="gap-2" onClick={() => setShowNew(!showNew)}>
            <Plus className="h-4 w-4" />
            Nova conversa
          </Button>
        </div>
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filtros de janela */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          {windowFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setWindowFilter(f.key)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                windowFilter === f.key
                  ? 'border-gray-700 bg-gray-900 text-white'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              {f.key === 'closing' && <Clock className="h-3 w-3" />}
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {/* Filtro por atendente */}
          <div ref={userFilterRef} className="relative">
            <button
              onClick={() => setUserDropdownOpen((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                activeUserId
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              <UserCircle className="h-3 w-3" />
              {activeUser ? activeUser.name.split(' ')[0] : 'Atendente'}
              {activeUserId ? (
                <X
                  className="h-3 w-3"
                  onClick={(e) => { e.stopPropagation(); setActiveUserId(null) }}
                />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {userDropdownOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border bg-white shadow-lg">
                <div className="p-2">
                  <input
                    autoFocus
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Buscar atendente..."
                    className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto pb-1">
                  {!userSearch && (
                    <button
                      onClick={() => { setActiveUserId(null); setUserDropdownOpen(false) }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-500">
                        —
                      </div>
                      <span className="flex-1 text-left text-gray-600">Todos</span>
                      {activeUserId === null && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </button>
                  )}
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setActiveUserId(activeUserId === u.id ? null : u.id)
                        setUserDropdownOpen(false)
                        setUserSearch('')
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 text-left truncate">{u.name}</span>
                      {activeUserId === u.id && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </button>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="px-3 py-2 text-xs text-gray-400">Nenhum atendente encontrado</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Filtro por tag */}
          {tagsData.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setActiveTagId(activeTagId === tag.id ? null : tag.id)}
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white transition-opacity',
                activeTagId !== null && activeTagId !== tag.id && 'opacity-40',
              )}
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {showNew && (
        <div className="border-b bg-teal-50 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-gray-900">Nova conversa via template</p>
            <button onClick={() => setShowNew(false)}>
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Número de envio</Label>
              <Select
                value={form.whatsappNumberId}
                onValueChange={(v) => setForm((f) => ({ ...f, whatsappNumberId: v, templateName: '', templateLanguage: '' }))}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione o número" />
                </SelectTrigger>
                <SelectContent>
                  {numbers?.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.displayName} ({n.phoneNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Número do destinatário</Label>
              <Input
                className="bg-white"
                placeholder="5561984402868"
                value={form.to}
                onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Template</Label>
              {!form.whatsappNumberId ? (
                <p className="text-xs text-muted-foreground py-1">Selecione um número primeiro</p>
              ) : approvedTemplates.length === 0 ? (
                <p className="text-xs text-muted-foreground py-1">
                  Nenhum template aprovado. Sincronize em Configurações → Números.
                </p>
              ) : (
                <>
                  <Select
                    value={form.templateName ? `${form.templateName}|${form.templateLanguage}` : ''}
                    onValueChange={(v) => {
                      const [name, language] = v.split('|')
                      setForm((f) => ({ ...f, templateName: name, templateLanguage: language }))
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedTemplates.map((t) => (
                        <SelectItem key={t.id} value={`${t.name}|${t.language}`}>
                          <span className="font-medium">{t.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{t.language}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTemplate?.bodyText && (
                    <p className="mt-1 rounded border bg-white px-3 py-2 text-xs text-gray-600 whitespace-pre-wrap">
                      {selectedTemplate.bodyText}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            O destinatário deve estar no formato internacional sem + (ex: 5561984402868)
          </p>
          <Button
            className="mt-3"
            size="sm"
            onClick={() => sendMutation.mutate()}
            disabled={!form.whatsappNumberId || !form.to || !form.templateName || sendMutation.isPending}
          >
            {sendMutation.isPending ? 'Enviando...' : 'Enviar template e iniciar conversa'}
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            Carregando...
          </div>
        )}
        {!isLoading && !conversations.length && (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <MessageSquare className="h-10 w-10 opacity-30" />
            <p>Nenhuma conversa encontrada</p>
            {windowFilter === 'all' && (
              <Button size="sm" variant="outline" onClick={() => setShowNew(true)}>
                Iniciar primeira conversa
              </Button>
            )}
          </div>
        )}
        {conversations.map((conv) => {
          const ws = getWindowStatus(conv.lastInboundAt)
          const wLabel = getWindowLabel(conv.lastInboundAt)
          return (
            <button
              key={conv.id}
              onClick={() => router.push(`/conversations/${conv.id}`)}
              className="flex w-full items-center gap-4 border-b px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-200 text-base font-semibold text-gray-600">
                {conv.contact?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-gray-900">
                    {conv.contact?.name || formatPhone(conv.contact?.phone || '')}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {(() => {
                      const assigned = conv.assignedUser ?? users.find((u) => u.id === conv.assignedUserId)
                      if (!assigned) return null
                      return (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600">
                            {assigned.name.charAt(0).toUpperCase()}
                          </div>
                          {assigned.name.split(' ')[0]}
                        </span>
                      )
                    })()}
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(conv.lastMessageAt || conv.updatedAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="truncate text-sm text-muted-foreground">
                    {conv.whatsappNumber?.phoneNumber}
                    {conv.whatsappNumber?.id && (
                      <span className="ml-1 font-mono text-xs opacity-60">
                        #{conv.whatsappNumber.id.slice(0, 4)}
                      </span>
                    )}
                  </span>
                  <Badge variant={statusVariant[conv.status]}>{statusLabel[conv.status]}</Badge>

                  {/* Badge de janela */}
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                    ws === 'open' && 'bg-gray-100 text-gray-600',
                    ws === 'closing' && 'bg-amber-100 text-amber-800 font-semibold',
                    ws === 'closed' && 'bg-gray-100 text-gray-400',
                  )}>
                    <Clock className="h-3 w-3 shrink-0" />
                    {wLabel}
                  </span>

                  {conv.campaignPrompt && conv.campaignExpiresAt && new Date(conv.campaignExpiresAt) > new Date() && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      <Zap className="h-3 w-3" />
                      Campanha
                    </span>
                  )}
                  {conv.tags?.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
