'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Pause, Send, CheckCircle2, XCircle, Clock,
  MessageSquare, ExternalLink, Phone, SmilePlus, Frown, Minus,
} from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { cn, formatPhone } from '@/lib/utils'
import type { Broadcast, BroadcastResponses, BroadcastResponseEntry, BroadcastNoResponseEntry } from '@/types'

const statusConfig: Record<string, { label: string; variant: any }> = {
  draft:     { label: 'Rascunho',  variant: 'secondary' },
  queued:    { label: 'Na fila',   variant: 'warning' },
  sending:   { label: 'Enviando',  variant: 'warning' },
  completed: { label: 'Concluído', variant: 'success' },
  paused:    { label: 'Pausado',   variant: 'secondary' },
  failed:    { label: 'Falhou',    variant: 'destructive' },
}

const conversationStatusConfig: Record<string, { label: string; className: string }> = {
  open:    { label: 'Aberta',   className: 'bg-green-100 text-green-700' },
  closed:  { label: 'Fechada',  className: 'bg-gray-100 text-gray-600' },
  pending: { label: 'Pendente', className: 'bg-amber-100 text-amber-700' },
}

const sentimentConfig = {
  positive: { icon: SmilePlus, label: 'Positivo', className: 'text-green-600' },
  negative: { icon: Frown,     label: 'Negativo', className: 'text-red-500' },
  neutral:  { icon: Minus,     label: 'Neutro',   className: 'text-gray-400' },
}

function formatResponseTime(minutes: number | null): string {
  if (minutes === null) return '—'
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function ResponseRow({ entry, onOpenConversation }: {
  entry: BroadcastResponseEntry
  onOpenConversation: (id: string) => void
}) {
  const sentiment = entry.sentiment ? sentimentConfig[entry.sentiment] : null
  const SentimentIcon = sentiment?.icon
  const convStatus = entry.conversationStatus ? conversationStatusConfig[entry.conversationStatus] : null

  return (
    <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {SentimentIcon ? (
            <SentimentIcon className={cn('h-4 w-4', sentiment!.className)} />
          ) : (
            <Minus className="h-4 w-4 text-gray-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900">{entry.contactName}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-2.5 w-2.5" />
              {formatPhone(entry.contactPhone)}
            </span>
            {convStatus && (
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', convStatus.className)}>
                {convStatus.label}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto shrink-0">
              {formatResponseTime(entry.responseTimeMinutes)}
            </span>
          </div>

          <div className="mt-1.5 space-y-0.5">
            {entry.messages.map((m, i) => (
              <p key={i} className="text-xs text-gray-600 line-clamp-1">
                {i === 0 ? '' : '↳ '}{m.content}
              </p>
            ))}
          </div>
        </div>

        {entry.conversationId && (
          <button
            onClick={() => onOpenConversation(entry.conversationId!)}
            className="shrink-0 flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir
          </button>
        )}
      </div>
    </div>
  )
}

function NoResponseRow({ entry, onOpenConversation }: {
  entry: BroadcastNoResponseEntry
  onOpenConversation: (id: string) => void
}) {
  const convStatus = entry.conversationStatus ? conversationStatusConfig[entry.conversationStatus] : null

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
      <Clock className="h-4 w-4 shrink-0 text-gray-300" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900">{entry.contactName}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-2.5 w-2.5" />
            {formatPhone(entry.contactPhone)}
          </span>
          {convStatus && (
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', convStatus.className)}>
              {convStatus.label}
            </span>
          )}
        </div>
      </div>
      {entry.conversationId && (
        <button
          onClick={() => onOpenConversation(entry.conversationId!)}
          className="shrink-0 flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Abrir
        </button>
      )}
    </div>
  )
}

export default function BroadcastDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'responses' | 'no-response'>('responses')

  const { data: broadcast, isLoading } = useQuery<Broadcast>({
    queryKey: ['broadcast', id],
    queryFn: () => api.get(`/broadcasts/${id}`).then((r) => r.data),
    refetchInterval: 5000,
  })

  const { data: responsesData, isLoading: responsesLoading } = useQuery<BroadcastResponses>({
    queryKey: ['broadcast-responses', id],
    queryFn: () => api.get(`/broadcasts/${id}/responses`).then((r) => r.data),
    refetchInterval: 10000,
    enabled: !!broadcast,
  })

  const sendMutation = useMutation({
    mutationFn: () => api.post(`/broadcasts/${id}/send`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast', id] })
      toast({ title: 'Envio iniciado', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao iniciar envio', variant: 'destructive' }),
  })

  const pauseMutation = useMutation({
    mutationFn: () => api.post(`/broadcasts/${id}/pause`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast', id] })
      toast({ title: 'Broadcast pausado' })
    },
    onError: () => toast({ title: 'Erro ao pausar', variant: 'destructive' }),
  })

  function openConversation(conversationId: string) {
    router.push(`/conversations/${conversationId}`)
  }

  if (isLoading || !broadcast) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Carregando...</div>
  }

  const cfg = statusConfig[broadcast.status]
  const pct = broadcast.totalCount > 0 ? Math.round((broadcast.sentCount / broadcast.totalCount) * 100) : 0
  const stats = responsesData?.stats
  const responses = responsesData?.responses ?? []
  const noResponse = responsesData?.noResponse ?? []

  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={() => router.push('/broadcasts')}
        className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold text-gray-900">{broadcast.name}</h1>
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {broadcast.type === 'template' ? `Template: ${broadcast.templateName}` : 'Texto livre'}
            {' · '}{broadcast.whatsappNumber?.displayName ?? broadcast.whatsappNumberId.slice(0, 8)}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {broadcast.status === 'draft' && (
            <>
              <Button variant="outline" className="gap-2" onClick={() => router.push(`/broadcasts/new?draft=${id}`)}>
                Continuar configuração
              </Button>
              <Button className="gap-2" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
                <Send className="h-4 w-4" />
                {sendMutation.isPending ? 'Iniciando...' : 'Iniciar envio'}
              </Button>
            </>
          )}
          {broadcast.status === 'sending' && (
            <Button variant="outline" className="gap-2" onClick={() => pauseMutation.mutate()} disabled={pauseMutation.isPending}>
              <Pause className="h-4 w-4" />
              {pauseMutation.isPending ? 'Pausando...' : 'Pausar'}
            </Button>
          )}
          {broadcast.status === 'paused' && (
            <Button className="gap-2" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
              <Send className="h-4 w-4" />
              {sendMutation.isPending ? 'Retomando...' : 'Retomar envio'}
            </Button>
          )}
        </div>
      </div>

      {/* Envio stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: broadcast.totalCount, color: 'text-gray-900' },
          { label: 'Enviados', value: broadcast.sentCount, color: 'text-green-600' },
          { label: 'Falhas', value: broadcast.failedCount, color: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-white p-4 text-center">
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {broadcast.totalCount > 0 && (
        <div className="mb-6">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Progresso de envio</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Resposta stats */}
      {stats && (
        <div className="mb-6 rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-gray-900">Respostas</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.responded}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Responderam</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.responseRate}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Taxa de resposta</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgResponseMinutes !== null ? formatResponseTime(stats.avgResponseMinutes) : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Tempo médio</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-2 text-xs">
                <SmilePlus className="h-3.5 w-3.5 text-green-600" />
                <span className="font-medium text-green-600">{stats.sentiment.positive}</span>
                <Minus className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-medium text-gray-500">{stats.sentiment.neutral}</span>
                <Frown className="h-3.5 w-3.5 text-red-500" />
                <span className="font-medium text-red-500">{stats.sentiment.negative}</span>
              </div>
              <p className="text-xs text-muted-foreground">Sentimento</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-3 flex gap-1 rounded-lg border bg-gray-50 p-1">
        {([
          { key: 'responses', label: `Responderam (${responses.length})` },
          { key: 'no-response', label: `Sem resposta (${noResponse.length})` },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
              tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-muted-foreground hover:text-gray-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-white divide-y">
        {responsesLoading && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">Carregando respostas...</p>
        )}

        {!responsesLoading && tab === 'responses' && (
          <>
            {responses.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhum contato respondeu ainda.
              </p>
            ) : (
              responses.map((entry) => (
                <ResponseRow key={entry.recipientId} entry={entry} onOpenConversation={openConversation} />
              ))
            )}
          </>
        )}

        {!responsesLoading && tab === 'no-response' && (
          <>
            {noResponse.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Todos os contatos já responderam.
              </p>
            ) : (
              noResponse.map((entry) => (
                <NoResponseRow key={entry.recipientId} entry={entry} onOpenConversation={openConversation} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
