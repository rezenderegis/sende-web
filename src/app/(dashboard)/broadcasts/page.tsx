'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Megaphone, Plus, CheckCircle2, Clock, XCircle, Pause, Send, AlertTriangle, BotMessageSquare, X } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { timeAgo } from '@/lib/utils'
import type { Broadcast } from '@/types'

const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
  draft:     { label: 'Rascunho',   variant: 'secondary', icon: Clock },
  queued:    { label: 'Na fila',    variant: 'warning',   icon: Clock },
  sending:   { label: 'Enviando',   variant: 'warning',   icon: Send },
  completed: { label: 'Concluído',  variant: 'success',   icon: CheckCircle2 },
  paused:    { label: 'Pausado',    variant: 'secondary', icon: Pause },
  failed:    { label: 'Falhou',     variant: 'destructive', icon: XCircle },
}

export default function BroadcastsPage() {
  const router = useRouter()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [promptFilter, setPromptFilter] = useState<'all' | 'with' | 'without'>('all')
  const [viewingPrompt, setViewingPrompt] = useState<string | null>(null)

  const { data: broadcasts = [], isLoading } = useQuery<Broadcast[]>({
    queryKey: ['broadcasts'],
    queryFn: () => api.get('/broadcasts').then((r) => r.data),
    refetchInterval: 10000,
  })

  const filtered = useMemo(() => {
    return broadcasts.filter((bc) => {
      if (dateFrom) {
        const created = new Date(bc.createdAt)
        const from = new Date(dateFrom)
        if (created < from) return false
      }
      if (dateTo) {
        const created = new Date(bc.createdAt)
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        if (created > to) return false
      }
      if (promptFilter === 'with' && !bc.campaignPrompt) return false
      if (promptFilter === 'without' && bc.campaignPrompt) return false
      return true
    })
  }, [broadcasts, dateFrom, dateTo, promptFilter])

  const hasFilters = dateFrom || dateTo || promptFilter !== 'all'

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Broadcasts</h1>
          <p className="text-sm text-muted-foreground">Envie mensagens em massa para seus contatos.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {broadcasts.some((b) => b.failedCount > 0) && (
            <Button variant="outline" size="icon" className="border-red-200 text-red-600 hover:bg-red-50 sm:w-auto sm:px-3 sm:gap-2" onClick={() => router.push('/broadcasts/failures')}>
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Ver falhas</span>
            </Button>
          )}
          <Button className="gap-2" onClick={() => router.push('/broadcasts/new')}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo broadcast</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-8 rounded-md border border-gray-200 px-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-400"
            title="Data inicial"
          />
          <span className="text-xs text-muted-foreground">até</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-8 rounded-md border border-gray-200 px-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-400"
            title="Data final"
          />
        </div>

        <div className="flex items-center rounded-md border border-gray-200 bg-white overflow-hidden">
          {(['all', 'with', 'without'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setPromptFilter(v)}
              className={`px-3 py-1.5 text-xs transition-colors ${
                promptFilter === v
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {v === 'all' ? 'Todos' : v === 'with' ? 'Com prompt' : 'Sem prompt'}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setPromptFilter('all') }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-gray-700"
          >
            <X className="h-3 w-3" /> Limpar filtros
          </button>
        )}
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

        {!isLoading && broadcasts.length === 0 && (
          <div className="flex h-52 flex-col items-center justify-center gap-3 rounded-xl border bg-white text-muted-foreground">
            <Megaphone className="h-10 w-10 opacity-20" />
            <p className="text-sm">Nenhum broadcast criado ainda</p>
            <Button size="sm" variant="outline" onClick={() => router.push('/broadcasts/new')}>
              Criar primeiro broadcast
            </Button>
          </div>
        )}

        {!isLoading && broadcasts.length > 0 && filtered.length === 0 && (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border bg-white text-muted-foreground">
            <p className="text-sm">Nenhum broadcast encontrado com esses filtros</p>
          </div>
        )}

        {filtered.map((bc) => {
          const cfg = statusConfig[bc.status]
          const Icon = cfg.icon
          const pct = bc.totalCount > 0 ? Math.round((bc.sentCount / bc.totalCount) * 100) : 0

          return (
            <button
              key={bc.id}
              onClick={() => router.push(`/broadcasts/${bc.id}`)}
              className="flex w-full items-center gap-4 rounded-xl border bg-white p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50">
                <Megaphone className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 truncate">{bc.name}</span>
                  <Badge variant={cfg.variant} className="shrink-0 gap-1 text-xs">
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </Badge>
                  {bc.campaignPrompt && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setViewingPrompt(bc.campaignPrompt) }}
                      title="Ver prompt de IA"
                      className="flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 hover:bg-violet-200 transition-colors shrink-0"
                    >
                      <BotMessageSquare className="h-3 w-3" />
                      Prompt ativo
                    </button>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{bc.whatsappNumber?.displayName ?? bc.whatsappNumberId.slice(0, 8)}</span>
                  <span>•</span>
                  <span>{bc.type === 'template' ? 'Template' : 'Texto'}</span>
                  {bc.totalCount > 0 && (
                    <>
                      <span>•</span>
                      <span>{bc.sentCount}/{bc.totalCount} enviados ({pct}%)</span>
                    </>
                  )}
                </div>
                {bc.status === 'sending' && bc.totalCount > 0 && (
                  <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
                    <div
                      className="h-1.5 rounded-full bg-green-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {timeAgo(bc.updatedAt)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Prompt viewer modal */}
      {viewingPrompt !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setViewingPrompt(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-violet-700">
                <BotMessageSquare className="h-5 w-5" />
                <h2 className="font-semibold">Prompt de IA do broadcast</h2>
              </div>
              <button onClick={() => setViewingPrompt(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700 border max-h-96 overflow-y-auto">
              {viewingPrompt}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
