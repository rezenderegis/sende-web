'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Phone, CheckCheck, Check, Clock, X, Bot } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { TagSelector } from '@/components/tags/tag-selector'
import { toast } from '@/hooks/use-toast'
import { formatTime, formatPhone } from '@/lib/utils'
import type { Conversation, Message } from '@/types'

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
  const [message, setMessage] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

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
    sendMutation.mutate(text)
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
          <Badge variant={conversation?.status === 'open' ? 'success' : 'secondary'}>
            {conversation?.status === 'open' ? 'Aberta' : conversation?.status === 'pending' ? 'Pendente' : 'Fechada'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap px-6 pb-3">
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
              conversationId={id}
              assignedTags={conversation.tags ?? []}
            />
          )}
        </div>
      </div>

      {conversation?.aiState === 'human_requested' && (
        <div className="flex items-center justify-between gap-3 border-b bg-amber-50 px-6 py-2.5">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <Bot className="h-4 w-4 shrink-0" />
            <span>Bot pausado — cliente solicitou atendimento humano</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-amber-400 text-amber-800 hover:bg-amber-100"
            onClick={() => enableBotMutation.mutate()}
            disabled={enableBotMutation.isPending}
          >
            {enableBotMutation.isPending ? 'Reativando...' : 'Reativar bot'}
          </Button>
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
