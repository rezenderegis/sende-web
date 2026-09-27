'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Megaphone, Zap } from 'lucide-react'
import api from '@/lib/api'
import { cn, formatPhone } from '@/lib/utils'
import type { CampaignPrompt, Message } from '@/types'

interface ExecutionRow {
  conversationId: string
  contactName: string
  contactPhone: string
  activatedAt: string
  source: 'broadcast' | 'automation'
  sourceLabel: string
}

function ExecutionTranscript({ conversationId }: { conversationId: string }) {
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['conversation-messages', conversationId],
    queryFn: () => api.get(`/conversations/${conversationId}/messages`).then((r) => r.data),
  })
  const ordered = [...messages].reverse()

  if (isLoading) return <p className="p-3 text-xs text-muted-foreground">Carregando...</p>
  if (ordered.length === 0) return <p className="p-3 text-xs text-muted-foreground">Sem mensagens nessa conversa.</p>

  return (
    <div className="max-h-80 space-y-2 overflow-y-auto rounded-b-lg bg-gray-50 p-3">
      {ordered.map((m) => (
        <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-start' : 'justify-end'}`}>
          <div
            className={cn(
              'max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm',
              m.direction === 'outbound' ? 'rounded-bl-sm border bg-white text-gray-800' : 'rounded-br-sm bg-teal-600 text-white',
            )}
          >
            {m.content}
          </div>
        </div>
      ))}
    </div>
  )
}

export function PromptExecutions({ prompt }: { prompt: CampaignPrompt }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: executions = [], isLoading } = useQuery<ExecutionRow[]>({
    queryKey: ['campaign-prompt-executions', prompt.id],
    queryFn: () => api.get(`/campaign-prompts/${prompt.id}/executions`).then((r) => r.data),
  })

  if (isLoading) return <p className="text-xs text-muted-foreground">Carregando...</p>

  if (executions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Esse prompt ainda não foi usado em nenhuma conversa real (via broadcast ou automação).
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Últimas {executions.length} conversas reais onde esse prompt foi ativado — clique pra ver o que foi mostrado ao cliente e o que ele respondeu.
      </p>
      {executions.map((ex) => (
        <div key={`${ex.conversationId}-${ex.activatedAt}`} className="overflow-hidden rounded-lg border">
          <button
            onClick={() => setExpandedId(expandedId === ex.conversationId ? null : ex.conversationId)}
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50"
          >
            <div className="flex min-w-0 items-center gap-2">
              {ex.source === 'broadcast' ? (
                <Megaphone className="h-3.5 w-3.5 shrink-0 text-blue-600" />
              ) : (
                <Zap className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{ex.contactName}</p>
                <p className="text-xs text-muted-foreground">{formatPhone(ex.contactPhone)} · {ex.sourceLabel}</p>
              </div>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {new Date(ex.activatedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </button>
          {expandedId === ex.conversationId && <ExecutionTranscript conversationId={ex.conversationId} />}
        </div>
      ))}
    </div>
  )
}
