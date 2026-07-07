'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Phone, RefreshCw, CheckCircle2, Clock, XCircle } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { WhatsappNumber, WhatsappTemplate } from '@/types'

const templateStatusConfig: Record<string, { label: string; icon: any; color: string }> = {
  APPROVED:  { label: 'Aprovado',  icon: CheckCircle2, color: 'text-green-500' },
  PENDING:   { label: 'Pendente',  icon: Clock,        color: 'text-amber-500' },
  REJECTED:  { label: 'Rejeitado', icon: XCircle,      color: 'text-red-500'   },
}

export default function NumberConfigPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const [promptDraft, setPromptDraft] = useState('')
  const [historyLimit, setHistoryLimit] = useState(20)

  const { data: numbers } = useQuery<WhatsappNumber[]>({
    queryKey: ['whatsapp-numbers'],
    queryFn: () => api.get('/whatsapp/numbers').then((r) => r.data),
  })

  const num = numbers?.find((n) => n.id === id)

  useEffect(() => {
    if (num) {
      setPromptDraft(num.systemPrompt ?? '')
      setHistoryLimit(num.botHistoryLimit ?? 20)
    }
  }, [num])

  const updateMutation = useMutation({
    mutationFn: (data: { systemPrompt?: string | null; botHistoryLimit?: number }) =>
      api.patch(`/whatsapp/numbers/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-numbers'] })
      toast({ title: 'Configurações salvas', variant: 'success' })
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao salvar',
        description: err.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const { data: templates = [], isLoading: templatesLoading } = useQuery<WhatsappTemplate[]>({
    queryKey: ['whatsapp-templates', id],
    queryFn: () => api.get(`/whatsapp/numbers/${id}/templates`).then((r) => r.data),
  })

  const syncMutation = useMutation({
    mutationFn: () => api.post(`/whatsapp/numbers/${id}/templates/sync`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-templates', id] })
      toast({ title: 'Templates sincronizados', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao sincronizar templates', variant: 'destructive' }),
  })

  if (!num) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        Carregando...
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b bg-white px-6 py-4">
        <button
          onClick={() => router.push('/settings/numbers')}
          className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para números
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
            <Phone className="h-4 w-4 text-whatsapp" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-gray-900">{num.displayName}</h1>
              <Badge variant={num.isActive ? 'success' : 'secondary'}>
                {num.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{num.phoneNumber}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden gap-6 p-6">

        {/* Prompt — ocupa todo o espaço vertical disponível */}
        <div className="flex flex-1 flex-col gap-3 min-w-0">
          <div>
            <Label className="text-sm font-semibold">Instruções do bot</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Use{' '}
              <code className="rounded bg-gray-100 px-1 py-0.5 font-mono">${'{contactName}'}</code>{' '}
              onde quiser que o nome do cliente apareça. Se vazio, usa o prompt padrão do servidor.
            </p>
          </div>
          <Textarea
            placeholder="Usando prompt padrão do servidor"
            value={promptDraft}
            onChange={(e) => setPromptDraft(e.target.value)}
            className="flex-1 resize-none font-mono text-sm leading-relaxed"
          />
          <div className="shrink-0">
            <Button
              onClick={() => updateMutation.mutate({ systemPrompt: promptDraft || null })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar prompt'}
            </Button>
          </div>
        </div>

        {/* Sidebar — configurações secundárias */}
        <div className="shrink-0 w-72 flex flex-col gap-4 overflow-y-auto">
          <div className="rounded-xl border bg-white p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">Contexto de memória</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Mensagens anteriores enviadas ao LLM em cada resposta. Mais = melhor memória, porém custo maior.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Mensagens de contexto</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={historyLimit}
                  onChange={(e) => setHistoryLimit(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">mensagens</span>
              </div>
              <p className="text-xs text-muted-foreground">Recomendado: 10 a 50</p>
            </div>
            <Button
              className="w-full"
              onClick={() => updateMutation.mutate({ botHistoryLimit: historyLimit })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar limite'}
            </Button>
          </div>

          {/* Templates */}
          <div className="rounded-xl border bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Templates WhatsApp</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Templates aprovados pela Meta para envios em massa.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 shrink-0"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', syncMutation.isPending && 'animate-spin')} />
                {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
            </div>

            {templatesLoading && (
              <p className="text-xs text-muted-foreground">Carregando templates...</p>
            )}

            {!templatesLoading && templates.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhum template encontrado. Clique em "Sincronizar" para buscar da Meta.
              </p>
            )}

            <div className="space-y-2">
              {templates.map((tpl) => {
                const cfg = templateStatusConfig[tpl.status] ?? { label: tpl.status, icon: Clock, color: 'text-gray-400' }
                const Icon = cfg.icon
                return (
                  <div key={tpl.id} className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{tpl.name}</span>
                      <div className={cn('flex items-center gap-1 shrink-0 text-xs', cfg.color)}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{tpl.language}</span>
                      {tpl.category && (
                        <>
                          <span>·</span>
                          <span className="capitalize">{tpl.category.toLowerCase()}</span>
                        </>
                      )}
                    </div>
                    {tpl.bodyText && (
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{tpl.bodyText}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
