'use client'

import { useState, useMemo } from 'react'
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  SmilePlus, Frown, Minus, ExternalLink, Search,
  ChevronRight, MessageSquare, Clock, Users2, TrendingUp,
} from 'lucide-react'
import api from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { cn, formatPhone } from '@/lib/utils'
import type { Broadcast, BroadcastResponses, BroadcastResponseEntry } from '@/types'

const sentimentConfig = {
  positive: { icon: SmilePlus, label: 'Positivo', badge: 'bg-teal-100 text-teal-700', text: 'text-teal-600' },
  negative: { icon: Frown,     label: 'Negativo', badge: 'bg-red-100 text-red-700',   text: 'text-red-500' },
  neutral:  { icon: Minus,     label: 'Neutro',   badge: 'bg-gray-100 text-gray-600', text: 'text-gray-400' },
}

function formatResponseTime(minutes: number | null): string {
  if (minutes === null) return '—'
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}min atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  const d = Math.floor(h / 24)
  return `${d}d atrás`
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string; icon: any; color: string
}) {
  return (
    <div className="rounded-card bg-white border border-[#EEF2F6] p-5 shadow-sende-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold', color)}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-ink-faint">{sub}</p>}
        </div>
        <div className={cn('rounded-lg p-2', color === 'text-teal-600' ? 'bg-teal-50' : color === 'text-red-500' ? 'bg-red-50' : 'bg-gray-100')}>
          <Icon className={cn('h-4 w-4', color)} />
        </div>
      </div>
    </div>
  )
}

function LeadRow({ entry, onOpenConversation }: {
  entry: BroadcastResponseEntry
  onOpenConversation: (id: string) => void
}) {
  const s = entry.sentiment ? sentimentConfig[entry.sentiment] : null
  const SentimentIcon = s?.icon as React.ElementType | undefined
  const lastMsg = entry.messages?.[entry.messages.length - 1]

  return (
    <div className="group flex items-center gap-4 px-4 py-3.5 hover:bg-teal-50/40 transition-colors border-b border-[#EEF2F6] last:border-0">
      {/* Avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
        {entry.contactName?.charAt(0)?.toUpperCase() ?? '?'}
      </div>

      {/* Name + phone */}
      <div className="min-w-0 w-40 shrink-0">
        <p className="truncate text-sm font-semibold text-ink">{entry.contactName}</p>
        <p className="text-xs text-ink-faint">{formatPhone(entry.contactPhone)}</p>
      </div>

      {/* Sentiment */}
      <div className="w-28 shrink-0">
        {s ? (
          <span className={cn('inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium', s.badge)}>
            {SentimentIcon && <SentimentIcon className="h-3 w-3" />}
            {s.label}
          </span>
        ) : (
          <span className="text-xs text-ink-faint">—</span>
        )}
      </div>

      {/* Last message */}
      <div className="min-w-0 flex-1 hidden md:block">
        {lastMsg ? (
          <p className="truncate text-sm text-ink-soft">{lastMsg.content}</p>
        ) : (
          <p className="text-sm text-ink-faint">—</p>
        )}
      </div>

      {/* Response time */}
      <div className="w-24 shrink-0 hidden lg:block text-right">
        <p className="text-xs text-ink-faint">{formatResponseTime(entry.responseTimeMinutes)}</p>
      </div>

      {/* Responded at */}
      <div className="w-24 shrink-0 hidden lg:block text-right">
        <p className="text-xs text-ink-faint">{timeAgo(entry.respondedAt)}</p>
      </div>

      {/* Action */}
      <div className="shrink-0">
        {entry.conversationId ? (
          <button
            onClick={() => onOpenConversation(entry.conversationId!)}
            className="flex items-center gap-1.5 rounded-pill border border-teal-200 px-3 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-600 hover:text-white hover:border-teal-600"
          >
            <MessageSquare className="h-3 w-3" />
            <span className="hidden sm:inline">Ver conversa</span>
            <ChevronRight className="h-3 w-3 sm:hidden" />
          </button>
        ) : (
          <span className="text-xs text-ink-faint">—</span>
        )}
      </div>
    </div>
  )
}

export default function LeadsPage() {
  const router = useRouter()
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string>('')
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all')
  const [search, setSearch] = useState('')

  const { data: broadcasts = [], isLoading: loadingBroadcasts } = useQuery<Broadcast[]>({
    queryKey: ['broadcasts'],
    queryFn: () => api.get('/broadcasts').then((r) => r.data),
  })

  const completedBroadcasts = useMemo(
    () => broadcasts.filter((b) => b.status === 'completed' || b.status === 'sending'),
    [broadcasts],
  )

  const activeBroadcastId = selectedBroadcastId || completedBroadcasts[0]?.id || ''

  const { data: responses, isLoading: loadingResponses } = useQuery<BroadcastResponses>({
    queryKey: ['broadcast-responses', activeBroadcastId],
    queryFn: () => api.get(`/broadcasts/${activeBroadcastId}/responses`).then((r) => r.data),
    enabled: !!activeBroadcastId,
  })

  const filtered = useMemo(() => {
    if (!responses?.responses) return []
    return responses.responses.filter((r) => {
      if (sentimentFilter !== 'all' && r.sentiment !== sentimentFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!r.contactName.toLowerCase().includes(q) && !r.contactPhone.includes(q)) return false
      }
      return true
    })
  }, [responses, sentimentFilter, search])

  const stats = responses?.stats

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[#EEF2F6] bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-teal-900">Leads</h1>
            <p className="text-sm text-ink-faint">Contatos que responderam aos seus broadcasts</p>
          </div>

          {/* Broadcast selector */}
          <select
            value={activeBroadcastId}
            onChange={(e) => setSelectedBroadcastId(e.target.value)}
            className="rounded-pill border border-[#EEF2F6] bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 min-w-[220px]"
            disabled={loadingBroadcasts}
          >
            {completedBroadcasts.length === 0 ? (
              <option value="">Nenhum broadcast concluído</option>
            ) : (
              completedBroadcasts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Responderam"
              value={stats.responded}
              sub={`de ${stats.sent} enviados`}
              icon={Users2}
              color="text-teal-600"
            />
            <StatCard
              label="Taxa de resposta"
              value={`${stats.responseRate}%`}
              icon={TrendingUp}
              color="text-teal-600"
            />
            <StatCard
              label="Tempo médio"
              value={formatResponseTime(stats.avgResponseMinutes)}
              icon={Clock}
              color="text-ink"
            />
            <StatCard
              label="Positivos"
              value={stats.sentiment.positive}
              sub={`${stats.sentiment.negative} negativos · ${stats.sentiment.neutral} neutros`}
              icon={SmilePlus}
              color="text-teal-600"
            />
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-pill border border-[#EEF2F6] bg-white py-2 pl-9 pr-4 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>

          {/* Sentiment filter */}
          <div className="flex items-center gap-2">
            {(['all', 'positive', 'neutral', 'negative'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSentimentFilter(s)}
                className={cn(
                  'rounded-pill px-3 py-1.5 text-xs font-medium transition-colors',
                  sentimentFilter === s
                    ? 'bg-teal-600 text-white'
                    : 'border border-[#EEF2F6] bg-white text-ink-soft hover:border-teal-200 hover:text-teal-700',
                )}
              >
                {s === 'all' ? 'Todos' : sentimentConfig[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-card border border-[#EEF2F6] bg-white shadow-sende-sm overflow-hidden">
          {/* Table header */}
          <div className="hidden md:flex items-center gap-4 border-b border-[#EEF2F6] bg-gray-50/60 px-4 py-2.5">
            <div className="w-9 shrink-0" />
            <div className="w-40 shrink-0 text-xs font-semibold uppercase tracking-wider text-ink-faint">Contato</div>
            <div className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wider text-ink-faint">Sentimento</div>
            <div className="flex-1 text-xs font-semibold uppercase tracking-wider text-ink-faint">Última mensagem</div>
            <div className="w-24 shrink-0 hidden lg:block text-right text-xs font-semibold uppercase tracking-wider text-ink-faint">Resp. em</div>
            <div className="w-24 shrink-0 hidden lg:block text-right text-xs font-semibold uppercase tracking-wider text-ink-faint">Quando</div>
            <div className="shrink-0 w-28" />
          </div>

          {loadingResponses ? (
            <div className="flex items-center justify-center py-16 text-sm text-ink-faint">
              Carregando leads...
            </div>
          ) : !activeBroadcastId ? (
            <div className="flex flex-col items-center justify-center py-16 text-sm text-ink-faint gap-2">
              <Users2 className="h-8 w-8 text-teal-200" />
              <p>Selecione um broadcast para ver os leads</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-sm text-ink-faint gap-2">
              <MessageSquare className="h-8 w-8 text-teal-200" />
              <p>Nenhum lead encontrado</p>
            </div>
          ) : (
            filtered.map((entry) => (
              <LeadRow
                key={entry.recipientId}
                entry={entry}
                onOpenConversation={(id) => router.push(`/conversations/${id}`)}
              />
            ))
          )}
        </div>

        {filtered.length > 0 && (
          <p className="mt-3 text-xs text-ink-faint text-right">
            {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  )
}
