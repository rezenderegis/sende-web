'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Phone, CheckCheck, Clock, X, Bot, UserCircle, ChevronDown, BookMarked, Zap, History, Calendar, Plus, Users, MessageSquare } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TagSelector } from '@/components/tags/tag-selector'
import { toast } from '@/hooks/use-toast'
import { formatTime, formatPhone, cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import type { Conversation, ConversationEvent, FollowOn, FollowOnType, Message, User, SavedMessage, WhatsappTemplate } from '@/types'

function renderContent(content: string, contactName?: string): string {
  if (!content.includes('{{')) return content
  let out = content
  if (contactName) out = out.replace(/\{\{1\}\}/g, contactName.split(' ')[0])
  out = out.replace(/\{\{\d+\}\}/g, '_____')
  return out
}

function getWindowStatus(lastInboundAt: string | null): 'open' | 'closing' | 'closed' {
  if (!lastInboundAt) return 'closed'
  const remaining = 24 * 3600000 - (Date.now() - new Date(lastInboundAt).getTime())
  if (remaining <= 0) return 'closed'
  if (remaining <= 3 * 3600000) return 'closing'
  return 'open'
}

function getWindowTimeLeft(lastInboundAt: string | null): string {
  if (!lastInboundAt) return 'Expirada'
  const remaining = 24 * 3600000 - (Date.now() - new Date(lastInboundAt).getTime())
  if (remaining <= 0) return 'Expirada'
  const hours = Math.floor(remaining / 3600000)
  const minutes = Math.floor((remaining % 3600000) / 60000)
  if (hours >= 1) return `fecha em ${hours}h`
  return `fecha em ${minutes}min`
}

function campaignTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'expirado'
  const hours = Math.floor(diff / 3600000)
  if (hours >= 24) return `expira em ${Math.floor(hours / 24)}d`
  if (hours >= 1) return `expira em ${hours}h`
  const minutes = Math.floor(diff / 60000)
  return `expira em ${minutes}min`
}

function followOnLabel(fo: FollowOn): string {
  const d = new Date(fo.scheduledAt)
  const today = new Date()
  const label = TYPE_LABELS[fo.type] ?? fo.type
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === today.toDateString()) return `${label} · Hoje ${time}`
  return `${label} · ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} ${time}`
}

const statusIcon: Record<string, any> = {
  sent: <Clock className="h-3 w-3 text-gray-400" />,
  delivered: <CheckCheck className="h-3 w-3 text-gray-400" />,
  read: <CheckCheck className="h-3 w-3 text-blue-500" />,
  failed: <X className="h-3 w-3 text-red-500" />,
}

const TYPE_ICONS: Record<string, any> = {
  meeting: <Users className="h-3.5 w-3.5" />,
  call: <Phone className="h-3.5 w-3.5" />,
  message: <MessageSquare className="h-3.5 w-3.5" />,
  message_manual: <MessageSquare className="h-3.5 w-3.5" />,
}

const TYPE_LABELS: Record<string, string> = {
  meeting: 'Reunião',
  call: 'Ligação',
  message: 'Envio automático',
  message_manual: 'Mensagem',
}

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [message, setMessage] = useState('')
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('')
  const [templateVars, setTemplateVars] = useState<string[]>([])
  const [assignOpen, setAssignOpen] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const [savedSearch, setSavedSearch] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [showFollowOns, setShowFollowOns] = useState(false)
  const [followOnModal, setFollowOnModal] = useState(false)
  const assignRef = useRef<HTMLDivElement>(null)
  const savedRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Follow-on form state
  const defaultScheduledAt = toLocalDatetimeValue(new Date(Date.now() + 60 * 60000))
  const [foType, setFoType] = useState<FollowOnType>('call')
  const [foScheduledAt, setFoScheduledAt] = useState(defaultScheduledAt)
  const [foNote, setFoNote] = useState('')
  const [foAssignedUserId, setFoAssignedUserId] = useState(user?.id ?? '')
  const [foMessage, setFoMessage] = useState('')
  const [foTemplateKey, setFoTemplateKey] = useState('')
  const [foTemplateVars, setFoTemplateVars] = useState<string[]>([])

  const firstName = user?.name?.split(' ')[0] ?? ''

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (assignRef.current && !assignRef.current.contains(e.target as Node)) setAssignOpen(false)
      if (savedRef.current && !savedRef.current.contains(e.target as Node)) { setSavedOpen(false); setSavedSearch('') }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: conversation } = useQuery<Conversation>({
    queryKey: ['conversation', id],
    queryFn: () => api.get(`/conversations/${id}`).then((r) => r.data),
  })

  const { data: messages } = useQuery<{ data: Message[] }>({
    queryKey: ['messages', id],
    queryFn: async () => {
      const LIMIT = 50
      const first = await api
        .get(`/conversations/${id}/messages?page=1&limit=${LIMIT}`)
        .then((r) => r.data)

      const totalPages = Math.ceil(first.total / LIMIT)

      if (totalPages <= 1) return { data: first.data }

      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          api
            .get(`/conversations/${id}/messages?page=${i + 2}&limit=${LIMIT}`)
            .then((r) => r.data.data as Message[]),
        ),
      )

      const seen = new Set<string>()
      const all = [...first.data, ...rest.flat()]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .filter((msg) => { if (seen.has(msg.id)) return false; seen.add(msg.id); return true })

      return { data: all }
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  })

  const { data: savedMessages = [] } = useQuery<SavedMessage[]>({
    queryKey: ['saved-messages'],
    queryFn: () => api.get('/saved-messages').then((r) => r.data),
  })

  const { data: templates = [] } = useQuery<WhatsappTemplate[]>({
    queryKey: ['whatsapp-templates', conversation?.whatsappNumberId],
    queryFn: () =>
      api.get(`/whatsapp/numbers/${conversation!.whatsappNumberId}/templates`).then((r) => r.data),
    enabled: !!conversation?.whatsappNumberId,
  })
  const approvedTemplates = templates.filter((t) => t.status === 'APPROVED')
  const selectedTpl = approvedTemplates.find((t) => `${t.name}|${t.language}` === selectedTemplateKey) ?? null

  const { data: events = [] } = useQuery<ConversationEvent[]>({
    queryKey: ['conversation-events', id],
    queryFn: () => api.get(`/conversations/${id}/events`).then((r) => r.data),
    enabled: showHistory,
  })

  const { data: followOns = [] } = useQuery<FollowOn[]>({
    queryKey: ['follow-ons-conv', id],
    queryFn: () => api.get(`/follow-ons/conversation/${id}`).then((r) => r.data),
    refetchInterval: 30000,
  })
  const activeFollowOns = followOns.filter((fo) => fo.status === 'pending')

  const assignMutation = useMutation({
    mutationFn: (assignedUserId: string | null) =>
      api.patch(`/conversations/${id}`, {
        status: conversation?.status,
        assignedUserId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation', id] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setAssignOpen(false)
      toast({ title: 'Conversa delegada', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao delegar conversa', variant: 'destructive' }),
  })

  const enableBotMutation = useMutation({
    mutationFn: () => api.post(`/conversations/${id}/bot/enable`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation', id] })
      toast({ title: 'Bot reativado', variant: 'success' })
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível reativar o bot', variant: 'destructive' })
    },
  })

  const disableBotMutation = useMutation({
    mutationFn: () => api.post(`/conversations/${id}/bot/disable`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation', id] })
      toast({ title: 'Bot pausado', variant: 'success' })
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível pausar o bot', variant: 'destructive' })
    },
  })

  const resetCampaignMutation = useMutation({
    mutationFn: () => api.patch(`/conversations/${id}/campaign/reset`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation', id] })
      toast({ title: 'Contexto de campanha encerrado' })
    },
    onError: () => toast({ title: 'Erro ao encerrar campanha', variant: 'destructive' }),
  })

  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      api.post('/whatsapp/messages/send', {
        whatsappNumberId: conversation?.whatsappNumberId,
        to: conversation?.contact?.phone,
        type: 'text',
        message: text,
      }),
    onSuccess: () => {
      setMessage('')
      qc.invalidateQueries({ queryKey: ['messages', id] })
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível enviar a mensagem', variant: 'destructive' })
    },
  })

  const sendTemplateMutation = useMutation({
    mutationFn: () => {
      const [templateName, templateLanguage] = selectedTemplateKey.split('|')
      return api.post('/whatsapp/messages/send', {
        whatsappNumberId: conversation?.whatsappNumberId,
        to: conversation?.contact?.phone,
        type: 'template',
        templateName,
        templateLanguage,
        ...(templateVars.length > 0 ? { templateVariables: templateVars } : {}),
      })
    },
    onSuccess: () => {
      setSelectedTemplateKey('')
      setTemplateVars([])
      qc.invalidateQueries({ queryKey: ['messages', id] })
      qc.invalidateQueries({ queryKey: ['conversation', id] })
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível enviar o template', variant: 'destructive' })
    },
  })

  const cancelFollowOnMutation = useMutation({
    mutationFn: (foId: string) => api.patch(`/follow-ons/${foId}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-ons-conv', id] })
      toast({ title: 'Follow-on cancelado', variant: 'success' })
    },
  })

  const createFollowOnMutation = useMutation({
    mutationFn: (dto: any) => api.post('/follow-ons', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-ons-conv', id] })
      qc.invalidateQueries({ queryKey: ['follow-ons'] })
      setFollowOnModal(false)
      resetFollowOnForm()
      toast({ title: 'Follow-on agendado', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao agendar follow-on', variant: 'destructive' }),
  })

  function resetFollowOnForm() {
    setFoType('call')
    setFoScheduledAt(toLocalDatetimeValue(new Date(Date.now() + 60 * 60000)))
    setFoNote('')
    setFoAssignedUserId(user?.id ?? '')
    setFoMessage('')
    setFoTemplateKey('')
    setFoTemplateVars([])
  }

  function handleCreateFollowOn() {
    const scheduledDate = new Date(foScheduledAt)
    const isBeyond24h = scheduledDate.getTime() - Date.now() > 24 * 3600000
    const dto: any = {
      conversationId: id,
      type: foType,
      scheduledAt: scheduledDate.toISOString(),
      ...(foNote.trim() ? { note: foNote.trim() } : {}),
      ...(foAssignedUserId ? { assignedUserId: foAssignedUserId } : {}),
    }
    if (foType === 'message') {
      if (isBeyond24h) {
        const [templateName, templateLanguage] = foTemplateKey.split('|')
        dto.templateName = templateName
        dto.templateLanguage = templateLanguage
        if (foTemplateVars.length > 0) dto.templateVariables = foTemplateVars
      } else {
        dto.message = foMessage.trim()
      }
    }
    createFollowOnMutation.mutate(dto)
  }

  const windowStatus = getWindowStatus(conversation?.lastInboundAt ?? null)
  const windowLabel = getWindowTimeLeft(conversation?.lastInboundAt ?? null)

  // For follow-on modal: determine if scheduledAt is beyond 24h from now
  const foScheduledDate = foScheduledAt ? new Date(foScheduledAt) : null
  const foIsBeyond24h = foScheduledDate ? foScheduledDate.getTime() - Date.now() > 24 * 3600000 : false
  const foSelectedTpl = approvedTemplates.find((t) => `${t.name}|${t.language}` === foTemplateKey) ?? null

  const foIsValid = (() => {
    if (!foScheduledAt) return false
    if (foType === 'message') {
      if (foIsBeyond24h) {
        if (!foTemplateKey) return false
        if ((foSelectedTpl?.variablesCount ?? 0) > 0 && foTemplateVars.some((v) => !v.trim())) return false
      } else {
        if (!foMessage.trim()) return false
      }
    }
    return true
  })()

  function handleSend() {
    const text = message.trim()
    if (!text || sendMutation.isPending) return
    const payload = firstName ? `*${firstName}:* ${text}` : text
    sendMutation.mutate(payload)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const contact = conversation?.contact

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-white">
        <div className="flex items-center gap-4 px-6 py-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/conversations')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
            {contact?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{contact?.name || formatPhone(contact?.phone || '')}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {formatPhone(contact?.phone || '')}
              {conversation?.whatsappNumber && (
                <span className="text-gray-300 mx-1">·</span>
              )}
              {conversation?.whatsappNumber && (
                <span>{conversation.whatsappNumber.displayName} ({conversation.whatsappNumber.phoneNumber})</span>
              )}
            </p>
          </div>
          <Badge variant={conversation?.status === 'open' ? 'success' : 'secondary'} className="shrink-0">
            {conversation?.status === 'open' ? 'Aberta' : conversation?.status === 'pending' ? 'Pendente' : 'Fechada'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap px-6 pb-3">
          {conversation?.aiState === 'human_requested' ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-amber-400 text-amber-700 hover:bg-amber-50 h-7 text-xs"
              onClick={() => enableBotMutation.mutate()}
              disabled={enableBotMutation.isPending}
            >
              <Bot className="h-3 w-3" />
              {enableBotMutation.isPending ? 'Reativando...' : 'Reativar bot'}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-muted-foreground hover:text-gray-900 h-7 text-xs"
              onClick={() => disableBotMutation.mutate()}
              disabled={disableBotMutation.isPending}
            >
              <Bot className="h-3 w-3" />
              {disableBotMutation.isPending ? 'Pausando...' : 'Pausar bot'}
            </Button>
          )}
          {conversation?.campaignPrompt &&
           conversation?.campaignExpiresAt &&
           new Date(conversation.campaignExpiresAt) > new Date() && (
            <div className="flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-50 px-2.5 py-0.5 text-xs text-orange-700">
              <Zap className="h-3 w-3 shrink-0" />
              <span>Campanha ativa · {campaignTimeLeft(conversation.campaignExpiresAt)}</span>
              <button
                onClick={() => resetCampaignMutation.mutate()}
                disabled={resetCampaignMutation.isPending}
                className="ml-0.5 rounded-full hover:text-orange-900 disabled:opacity-50"
                title="Encerrar contexto de campanha"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {conversation?.tags?.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {conversation && (
            <TagSelector
              assignedTags={conversation.tags ?? []}
              addEndpoint={`/conversations/${id}/tags`}
              removeEndpoint={(tagId) => `/conversations/${id}/tags/${tagId}`}
              invalidateKeys={[['conversation', id], ['conversations']]}
            />
          )}

          <button
            onClick={() => setShowHistory((v) => !v)}
            title="Histórico de contexto"
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
              showHistory
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <History className="h-3 w-3" />
            Histórico
          </button>

          <button
            onClick={() => setShowFollowOns((v) => !v)}
            title="Follow-ons agendados"
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
              showFollowOns
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <Calendar className="h-3 w-3" />
            Follow-ons
            {activeFollowOns.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                {activeFollowOns.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { resetFollowOnForm(); setFollowOnModal(true) }}
            className="flex items-center gap-1 rounded-full border border-dashed border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Agendar
          </button>

          <div ref={assignRef} className="relative">
            <button
              onClick={() => setAssignOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <UserCircle className="h-3 w-3" />
              {conversation?.assignedUser
                ? conversation.assignedUser.name.split(' ')[0]
                : 'Delegar'}
              <ChevronDown className="h-3 w-3" />
            </button>

            {assignOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-lg border bg-white shadow-lg">
                <div className="p-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => assignMutation.mutate(u.id)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 text-left truncate">{u.name}</span>
                      {conversation?.assignedUserId === u.id && (
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
                      )}
                    </button>
                  ))}
                  {conversation?.assignedUserId && (
                    <>
                      <div className="my-1 border-t" />
                      <button
                        onClick={() => assignMutation.mutate(null)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        Remover delegação
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showHistory && (
        <div className="shrink-0 border-b bg-indigo-50 px-4 py-3 max-h-56 overflow-y-auto">
          <p className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wide">Histórico de contexto</p>
          {events.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum evento registrado.</p>
          ) : (
            <ol className="space-y-2">
              {events.map((ev) => {
                const label: Record<string, string> = {
                  campaign_activated: '⚡ Campanha ativada',
                  campaign_reset_human: '👤 Atendente encerrou campanha',
                  campaign_reset_manual: '✕ Reset manual da campanha',
                  campaign_expired: '⏱ Campanha expirada',
                }
                return (
                  <li key={ev.id} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-indigo-900">{label[ev.type] ?? ev.type}</span>
                      <span className="text-xs text-indigo-400">{new Date(ev.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                    {ev.type === 'campaign_activated' && ev.metadata && (
                      <div className="text-xs text-indigo-700 ml-1">
                        <span className="font-medium">Broadcast:</span> {ev.metadata.broadcastName}
                        {ev.metadata.expiresAt && (
                          <> · <span className="font-medium">Expira:</span> {new Date(ev.metadata.expiresAt).toLocaleString('pt-BR')}</>
                        )}
                        {ev.metadata.promptPreview && (
                          <p className="text-indigo-500 mt-0.5 italic truncate">&ldquo;{ev.metadata.promptPreview}&rdquo;</p>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      )}

      {showFollowOns && (
        <div className="shrink-0 border-b bg-blue-50 px-4 py-3 max-h-52 overflow-y-auto">
          <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Follow-ons agendados</p>
          {followOns.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum follow-on agendado para esta conversa.</p>
          ) : (
            <div className="space-y-1.5">
              {followOns.map((fo) => (
                <div key={fo.id} className="flex items-start gap-2 rounded-lg border bg-white px-3 py-2">
                  <div className="mt-0.5 text-blue-600 shrink-0">{TYPE_ICONS[fo.type]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900">{followOnLabel(fo)}</p>
                    {fo.note && <p className="text-xs text-muted-foreground truncate">{fo.note}</p>}
                    {fo.type === 'message' && (fo.message || fo.templateName) && (
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {fo.templateName ? `Template: ${fo.templateName}` : fo.message}
                      </p>
                    )}
                  </div>
                  <span className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                    fo.status === 'pending' && 'bg-amber-100 text-amber-700',
                    fo.status === 'done' && 'bg-teal-100 text-teal-700',
                    fo.status === 'cancelled' && 'bg-gray-100 text-gray-500',
                  )}>
                    {fo.status === 'pending' ? 'Pendente' : fo.status === 'done' ? 'Concluído' : 'Cancelado'}
                  </span>
                  {fo.status === 'pending' && (
                    <button
                      onClick={() => cancelFollowOnMutation.mutate(fo.id)}
                      className="shrink-0 text-gray-400 hover:text-red-500"
                      title="Cancelar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto bg-gray-100 p-4 space-y-2">
        {messages?.data?.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 text-sm shadow-sm ${
                msg.direction === 'outbound'
                  ? 'bg-teal-600 text-white rounded-br-none'
                  : 'bg-white text-gray-900 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{renderContent(msg.content, contact?.name)}</p>
              <div className={`flex items-center justify-end gap-1 mt-1 ${
                msg.direction === 'outbound' ? 'text-teal-100' : 'text-gray-400'
              }`}>
                {msg.direction === 'outbound' && msg.aiPromptSource && (
                  <span className={`text-xs rounded-full px-1.5 py-0 mr-1 ${
                    msg.aiPromptSource === 'campaign'
                      ? 'bg-orange-400/30 text-orange-100'
                      : 'bg-white/20 text-white/70'
                  }`}>
                    {msg.aiPromptSource === 'campaign' ? '⚡ campanha' : msg.aiPromptSource === 'system' ? 'prompt do número' : 'padrão'}
                  </span>
                )}
                <span className="text-xs">{formatTime(msg.createdAt)}</span>
                {msg.direction === 'outbound' && statusIcon[msg.status]}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t bg-white p-4 space-y-3">
        <div className={cn(
          'flex items-center gap-1.5 text-xs rounded-md px-3 py-1.5',
          windowStatus === 'open' && 'bg-gray-50 text-gray-500',
          windowStatus === 'closing' && 'bg-amber-50 text-amber-700 font-medium',
          windowStatus === 'closed' && 'bg-gray-100 text-gray-500',
        )}>
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {windowStatus === 'closed'
            ? 'Janela de 24h expirada — use um template para retomar a conversa'
            : `Janela aberta · ${windowLabel}`}
        </div>

        {windowStatus === 'closed' ? (
          <div className="space-y-2">
            <Select value={selectedTemplateKey} onValueChange={(v) => {
              setSelectedTemplateKey(v)
              const tpl = approvedTemplates.find((t) => `${t.name}|${t.language}` === v)
              setTemplateVars(Array(tpl?.variablesCount ?? 0).fill(''))
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template para enviar..." />
              </SelectTrigger>
              <SelectContent>
                {approvedTemplates.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    Nenhum template aprovado. Sincronize em Configurações → Números.
                  </div>
                ) : (
                  approvedTemplates.map((t) => (
                    <SelectItem key={t.id} value={`${t.name}|${t.language}`}>
                      <span className="font-medium">{t.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{t.language}</span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedTpl && (selectedTpl.variablesCount ?? 0) > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Preencha as variáveis do template:</p>
                {Array.from({ length: selectedTpl.variablesCount! }, (_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="shrink-0 rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-500">{`{{${i + 1}}}`}</span>
                    <input
                      type="text"
                      placeholder={`Valor para {{${i + 1}}}`}
                      value={templateVars[i] ?? ''}
                      onChange={(e) => setTemplateVars((v) => {
                        const next = [...v]
                        next[i] = e.target.value
                        return next
                      })}
                      className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                ))}
              </div>
            )}
            {selectedTpl?.bodyText && (
              <p className="rounded border bg-gray-50 px-3 py-2 text-xs text-gray-600 whitespace-pre-wrap">
                {(() => {
                  let preview = selectedTpl.bodyText
                  templateVars.forEach((val, i) => {
                    preview = preview.replace(new RegExp(`\\{\\{${i + 1}\\}\\}`, 'g'), val || `{{${i + 1}}}`)
                  })
                  if (contact?.name) preview = preview.replace(/\{\{1\}\}/g, contact.name.split(' ')[0])
                  return preview
                })()}
              </p>
            )}
            <Button
              className="w-full gap-2"
              variant="whatsapp"
              disabled={
                !selectedTemplateKey ||
                ((selectedTpl?.variablesCount ?? 0) > 0 && templateVars.some((v) => !v.trim())) ||
                sendTemplateMutation.isPending
              }
              onClick={() => sendTemplateMutation.mutate()}
            >
              <Send className="h-4 w-4" />
              {sendTemplateMutation.isPending ? 'Enviando...' : 'Enviar template'}
            </Button>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <div ref={savedRef} className="relative shrink-0">
              <button
                onClick={() => setSavedOpen((v) => !v)}
                className="flex h-11 w-11 items-center justify-center rounded-md border text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                title="Mensagens salvas"
              >
                <BookMarked className="h-4 w-4" />
              </button>
              {savedOpen && (
                <div className="absolute bottom-full left-0 z-50 mb-1 w-72 rounded-lg border bg-white shadow-lg">
                  <div className="p-2">
                    <input
                      autoFocus
                      value={savedSearch}
                      onChange={(e) => setSavedSearch(e.target.value)}
                      placeholder="Buscar mensagem..."
                      className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto pb-1">
                    {savedMessages
                      .filter((m) => m.name.toLowerCase().includes(savedSearch.toLowerCase()) || m.content.toLowerCase().includes(savedSearch.toLowerCase()))
                      .map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { setMessage(m.content); setSavedOpen(false); setSavedSearch('') }}
                          className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-gray-50"
                        >
                          <span className="text-sm font-medium text-gray-900">{m.name}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1">{m.content}</span>
                        </button>
                      ))}
                    {savedMessages.length === 0 && (
                      <p className="px-3 py-2 text-xs text-gray-400">Nenhuma mensagem salva.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Textarea
                placeholder="Digite uma mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[44px] max-h-32 resize-none"
                rows={1}
              />
            </div>
            <Button
              size="icon"
              variant="whatsapp"
              onClick={handleSend}
              disabled={!message.trim() || sendMutation.isPending}
              className="shrink-0 h-11 w-11"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Follow-on creation modal */}
      {followOnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-teal-900">Agendar Follow-on</h2>
              </div>
              <button onClick={() => setFollowOnModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {/* Tipo */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'call', icon: <Phone className="h-4 w-4" /> },
                    { value: 'meeting', icon: <Users className="h-4 w-4" /> },
                    { value: 'message_manual', icon: <MessageSquare className="h-4 w-4" /> },
                    { value: 'message', icon: <Send className="h-4 w-4" /> },
                  ] as { value: FollowOnType; icon: React.ReactNode }[]).map(({ value, icon }) => (
                    <button
                      key={value}
                      onClick={() => setFoType(value)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors text-left',
                        foType === value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                      )}
                    >
                      {icon}
                      {TYPE_LABELS[value]}
                    </button>
                  ))}
                </div>
                {foType === 'message_manual' && (
                  <p className="mt-1.5 text-xs text-muted-foreground">Lembrete para enviar manualmente. Nenhuma mensagem será disparada automaticamente.</p>
                )}
                {foType === 'message' && (
                  <p className="mt-1.5 text-xs text-muted-foreground">A mensagem ou template será enviado automaticamente no horário agendado.</p>
                )}
              </div>

              {/* Data/hora */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">Data e hora</label>
                <input
                  type="datetime-local"
                  value={foScheduledAt}
                  onChange={(e) => setFoScheduledAt(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
                {foIsBeyond24h && (
                  <p className="mt-1 text-xs text-amber-600">Agendado além de 24h — apenas template permitido.</p>
                )}
              </div>

              {/* Nota */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">Nota <span className="text-gray-400">(opcional)</span></label>
                <input
                  type="text"
                  value={foNote}
                  onChange={(e) => setFoNote(e.target.value)}
                  placeholder="Ex: Cliente pediu para ligar depois das 18h"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Mensagem (só quando tipo = message) */}
              {foType === 'message' && (
                foIsBeyond24h ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700">Template</label>
                    <Select value={foTemplateKey} onValueChange={(v) => {
                      setFoTemplateKey(v)
                      const tpl = approvedTemplates.find((t) => `${t.name}|${t.language}` === v)
                      setFoTemplateVars(Array(tpl?.variablesCount ?? 0).fill(''))
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {approvedTemplates.map((t) => (
                          <SelectItem key={t.id} value={`${t.name}|${t.language}`}>
                            {t.name} <span className="text-xs text-muted-foreground">{t.language}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {foSelectedTpl && (foSelectedTpl.variablesCount ?? 0) > 0 && (
                      <div className="space-y-1.5">
                        {Array.from({ length: foSelectedTpl.variablesCount! }, (_, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="shrink-0 rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-500">{`{{${i + 1}}}`}</span>
                            <input
                              type="text"
                              placeholder={`Valor para {{${i + 1}}}`}
                              value={foTemplateVars[i] ?? ''}
                              onChange={(e) => setFoTemplateVars((v) => { const next = [...v]; next[i] = e.target.value; return next })}
                              className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {foSelectedTpl?.bodyText && (
                      <p className="rounded border bg-gray-50 px-3 py-2 text-xs text-gray-600 whitespace-pre-wrap">
                        {(() => {
                          let preview = foSelectedTpl.bodyText
                          foTemplateVars.forEach((val, i) => {
                            preview = preview.replace(new RegExp(`\\{\\{${i + 1}\\}\\}`, 'g'), val || `{{${i + 1}}}`)
                          })
                          return preview
                        })()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">Mensagem a enviar</label>
                    <Textarea
                      value={foMessage}
                      onChange={(e) => setFoMessage(e.target.value)}
                      placeholder="Texto da mensagem que será enviada automaticamente..."
                      className="min-h-[80px] resize-none text-sm"
                    />
                  </div>
                )
              )}

              {/* Atribuir a */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">Atribuir a</label>
                <select
                  value={foAssignedUserId}
                  onChange={(e) => setFoAssignedUserId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}{u.id === user?.id ? ' (eu)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 border-t px-5 py-4">
              <Button variant="outline" className="flex-1" onClick={() => setFollowOnModal(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!foIsValid || createFollowOnMutation.isPending}
                onClick={handleCreateFollowOn}
              >
                {createFollowOnMutation.isPending ? 'Agendando...' : 'Agendar follow-on'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
