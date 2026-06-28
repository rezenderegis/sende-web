'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Phone, CheckCheck, Check, Clock, X } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
    queryFn: () => api.get(`/conversations/${id}/messages`).then((r) => r.data),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      <div className="flex items-center gap-4 border-b bg-white px-6 py-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/conversations')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
          {contact?.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{contact?.name || formatPhone(contact?.phone || '')}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {formatPhone(contact?.phone || '')}
          </p>
        </div>
        <Badge variant={conversation?.status === 'open' ? 'success' : 'secondary'}>
          {conversation?.status === 'open' ? 'Aberta' : conversation?.status === 'pending' ? 'Pendente' : 'Fechada'}
        </Badge>
      </div>

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
        <div className="flex gap-3">
          <Textarea
            placeholder="Digite uma mensagem... (Enter para enviar)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            size="icon"
            variant="whatsapp"
            onClick={handleSend}
            disabled={!message.trim() || sendMutation.isPending}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Shift+Enter para enviar. Mensagens de texto requerem janela ativa de 24h.
        </p>
      </div>
    </div>
  )
}
