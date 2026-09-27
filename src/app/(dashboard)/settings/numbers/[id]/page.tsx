'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Phone, CheckCircle2, Clock, XCircle, ArrowRight, FileText } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PromptEditor } from '@/components/bot/prompt-editor'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { ToolFlowSelector } from '@/components/bot/tool-flow-selector'
import type { WhatsappNumber, WhatsappTemplate, CampaignPrompt } from '@/types'

export default function NumberConfigPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const [promptDraft, setPromptDraft] = useState('')
  const [historyLimit, setHistoryLimit] = useState(20)
  const [selectedPromptId, setSelectedPromptId] = useState('')
  const [enabledToolNames, setEnabledToolNames] = useState<string[] | null>(null)
  const [enabledFlowNames, setEnabledFlowNames] = useState<string[] | null>(null)

  const { data: numbers } = useQuery<WhatsappNumber[]>({
    queryKey: ['whatsapp-numbers'],
    queryFn: () => api.get('/whatsapp/numbers').then((r) => r.data),
  })

  const { data: savedPrompts = [] } = useQuery<CampaignPrompt[]>({
    queryKey: ['campaign-prompts'],
    queryFn: () => api.get('/campaign-prompts').then((r) => r.data),
  })

  const num = numbers?.find((n) => n.id === id)

  useEffect(() => {
    if (num) {
      setPromptDraft(num.systemPrompt ?? '')
      setHistoryLimit(num.botHistoryLimit ?? 20)
      setEnabledToolNames(num.enabledToolNames ?? null)
      setEnabledFlowNames(num.enabledFlowNames ?? null)
    }
  }, [num])

  const updateMutation = useMutation({
    mutationFn: (data: { systemPrompt?: string | null; botHistoryLimit?: number; enabledToolNames?: string[] | null; enabledFlowNames?: string[] | null }) =>
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

  const templateCounts = {
    APPROVED: templates.filter((t) => t.status === 'APPROVED').length,
    PENDING: templates.filter((t) => t.status === 'PENDING').length,
    REJECTED: templates.filter((t) => t.status === 'REJECTED').length,
  }

  function applyPrompt(promptId: string) {
    setSelectedPromptId(promptId)
    const prompt = savedPrompts.find((p) => p.id === promptId)
    if (prompt) setPromptDraft(prompt.content)
  }

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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50">
            <Phone className="h-4 w-4 text-teal-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-teal-900">{num.displayName}</h1>
              <Badge variant={num.isActive ? 'success' : 'secondary'}>
                {num.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{num.phoneNumber}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-auto flex-col lg:flex-row lg:overflow-hidden gap-6 p-4 md:p-6">

        {/* Prompt — ocupa todo o espaço vertical disponível */}
        <div className="flex flex-1 flex-col gap-3 min-w-0 min-h-[320px] lg:min-h-0">
          <div>
            <Label className="text-sm font-semibold">Instruções do bot</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Use{' '}
              <code className="rounded bg-gray-100 px-1 py-0.5 font-mono">${'{contactName}'}</code>{' '}
              onde quiser que o nome do cliente apareça. Se vazio, usa o prompt padrão do servidor.
            </p>
          </div>
          {savedPrompts.length > 0 && (
            <div className="shrink-0">
              <select
                value={selectedPromptId}
                onChange={(e) => applyPrompt(e.target.value)}
                className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-600"
              >
                <option value="">Carregar um prompt salvo...</option>
                {savedPrompts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Selecionar preenche o texto abaixo — você pode ajustar antes de salvar.{' '}
                <Link href="/settings/prompts" className="text-teal-600 hover:underline">Gerenciar prompts</Link>
              </p>
            </div>
          )}
          <PromptEditor
            wrapperClassName="flex-1 flex flex-col min-h-0"
            placeholder="Usando prompt padrão do servidor"
            value={promptDraft}
            onChange={setPromptDraft}
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
        <div className="w-full lg:w-72 lg:shrink-0 flex flex-col gap-4 lg:overflow-y-auto">
          <div className="rounded-xl border bg-white p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-teal-900">Contexto de memória</h2>
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

          {/* Bot Tools e Fluxos */}
          <div className="rounded-xl border bg-white p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-teal-900">Tools e Fluxos</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Quais Bot Tools e Fluxos Guiados esse número pode usar.
              </p>
            </div>
            <ToolFlowSelector
              enabledToolNames={enabledToolNames}
              enabledFlowNames={enabledFlowNames}
              onChange={(patch) => {
                if ('enabledToolNames' in patch) setEnabledToolNames(patch.enabledToolNames ?? null)
                if ('enabledFlowNames' in patch) setEnabledFlowNames(patch.enabledFlowNames ?? null)
              }}
            />
            <Button
              className="w-full"
              onClick={() => updateMutation.mutate({ enabledToolNames, enabledFlowNames })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar seleção'}
            </Button>
          </div>

          {/* Templates */}
          <Link
            href={`/settings/numbers/${id}/templates`}
            className="block rounded-xl border bg-white p-5 space-y-3 hover:border-teal-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-teal-900 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Templates WhatsApp
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Templates aprovados pela Meta para envios em massa.
                </p>
              </div>
            </div>

            {templatesLoading ? (
              <p className="text-xs text-muted-foreground">Carregando...</p>
            ) : templates.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum template ainda</p>
            ) : (
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-teal-600"><CheckCircle2 className="h-3.5 w-3.5" />{templateCounts.APPROVED} aprovado{templateCounts.APPROVED !== 1 ? 's' : ''}</span>
                {templateCounts.PENDING > 0 && (
                  <span className="flex items-center gap-1 text-amber-600"><Clock className="h-3.5 w-3.5" />{templateCounts.PENDING} pendente{templateCounts.PENDING !== 1 ? 's' : ''}</span>
                )}
                {templateCounts.REJECTED > 0 && (
                  <span className="flex items-center gap-1 text-red-600"><XCircle className="h-3.5 w-3.5" />{templateCounts.REJECTED} rejeitado{templateCounts.REJECTED !== 1 ? 's' : ''}</span>
                )}
              </div>
            )}

            <span className="flex items-center gap-1 text-xs font-medium text-teal-700">
              Ver todos os templates
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
