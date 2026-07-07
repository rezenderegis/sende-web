'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Megaphone, Plus, CheckCircle2, Clock, XCircle, Pause, Send } from 'lucide-react'
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

  const { data: broadcasts = [], isLoading } = useQuery<Broadcast[]>({
    queryKey: ['broadcasts'],
    queryFn: () => api.get('/broadcasts').then((r) => r.data),
    refetchInterval: 10000,
  })

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Broadcasts</h1>
          <p className="text-sm text-muted-foreground">Envie mensagens em massa para seus contatos.</p>
        </div>
        <Button className="gap-2" onClick={() => router.push('/broadcasts/new')}>
          <Plus className="h-4 w-4" />
          Novo broadcast
        </Button>
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

        {broadcasts.map((bc) => {
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
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">{bc.name}</span>
                  <Badge variant={cfg.variant} className="shrink-0 gap-1 text-xs">
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </Badge>
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
    </div>
  )
}
