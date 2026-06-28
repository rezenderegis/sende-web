'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Search, MessageSquare, Plus, X } from 'lucide-react'
import api from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { timeAgo, formatPhone, cn } from '@/lib/utils'
import type { Conversation, WhatsappNumber, Tag } from '@/types'

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

export default function ConversationsPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [activeTagId, setActiveTagId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
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
      setForm({ whatsappNumberId: '', to: '', templateName: 'hello_world', templateLanguage: 'pt_BR' })
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

  const conversations = data?.data?.filter((c) =>
    !search ||
    c.contact?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.contact?.phone?.includes(search),
  ) ?? []

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Conversas</h1>
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
        {tagsData.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
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
        )}
      </div>

      {showNew && (
        <div className="border-b bg-green-50 px-6 py-4">
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
                onValueChange={(v) => setForm((f) => ({ ...f, whatsappNumberId: v }))}
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
            <div className="space-y-1">
              <Label className="text-xs">Nome do template</Label>
              <Input
                className="bg-white"
                placeholder="hello_world"
                value={form.templateName}
                onChange={(e) => setForm((f) => ({ ...f, templateName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Idioma do template</Label>
              <Select
                value={form.templateLanguage}
                onValueChange={(v) => setForm((f) => ({ ...f, templateLanguage: v }))}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt_BR">Português (pt_BR)</SelectItem>
                  <SelectItem value="en_US">Inglês (en_US)</SelectItem>
                  <SelectItem value="es">Espanhol (es)</SelectItem>
                </SelectContent>
              </Select>
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
            <p>Nenhuma conversa ainda</p>
            <Button size="sm" variant="outline" onClick={() => setShowNew(true)}>
              Iniciar primeira conversa
            </Button>
          </div>
        )}
        {conversations.map((conv) => (
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
                <span className="shrink-0 text-xs text-muted-foreground">
                  {timeAgo(conv.lastMessageAt || conv.updatedAt)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="truncate text-sm text-muted-foreground">
                  {conv.whatsappNumber?.phoneNumber}
                </span>
                <Badge variant={statusVariant[conv.status]}>{statusLabel[conv.status]}</Badge>
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
        ))}
      </div>
    </div>
  )
}
