'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Phone, CheckCheck, Clock, X, Bot, UserCircle, ChevronDown, BookMarked, Zap, History } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { TagSelector } from '@/components/tags/tag-selector'
import { toast } from '@/hooks/use-toast'
import { formatTime, formatPhone } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import type { Conversation, ConversationEvent, Message, User, SavedMessage } from '@/types'

function campaignTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'expirado'
  const hours = Math.floor(diff / 3600000)
  if (hours >= 24) return `expira em ${Math.floor(hours / 24)}d`
  if (hours >= 1) return `expira em ${hours}h`
  const minutes = Math.floor(diff / 60000)
  return `expira em ${minutes}min`
}

const statusIcon: Record<string, any> = {
  sent: <Clock className="h-3 w-3 text-gray-400" />,
  delivered: <CheckCheck className="h-3 w-3 text-gray-400" />,
  read: <CheckCheck className="h-3 w-3 text-blue-500" />,
  failed: <X className="h-3 w-3 text-red-500" />,
}

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [message, setMessage] = useState('')
  const [assignOpen, setAssignOpen] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const [savedSearch, setSavedSearch] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const assignRef = useRef<HTMLDivElement>(null)
  const savedRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

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

      const all = [...first.data, ...rest.flat()].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )

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

  const { data: events = [] } = useQuery<ConversationEvent[]>({
    queryKey: ['conversation-events', id],
    queryFn: () => api.get(`/conversations/${id}/events`).then((r) => r.data),
    enabled: showHistory,
  })

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

  function handleSend() {
    const text = message.trim()
    if (!text) return
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
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
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

      <div className="flex-1 overflow-auto bg-gray-100 p-4 space-y-2">
        {messages?.data?.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 text-sm shadow-sm ${
                msg.direction === 'outbound'
                  ? 'bg-whatsapp text-white rounded-br-none'
                  : 'bg-white text-gray-900 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              <div className={`flex items-center justify-end gap-1 mt-1 ${
                msg.direction === 'outbound' ? 'text-green-100' : 'text-gray-400'
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

      <div className="border-t bg-white p-4">
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
                    className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
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
        <p className="mt-2 text-xs text-muted-foreground">
          Mensagens de texto requerem janela ativa de 24h.
        </p>
      </div>
    </div>
  )
}
