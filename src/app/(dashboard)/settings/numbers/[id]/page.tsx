'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Phone, RefreshCw, CheckCircle2, Clock, XCircle, Plus, X } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import type { WhatsappNumber, WhatsappTemplate } from '@/types'

const TEMPLATE_CATEGORIES = [
  { value: 'UTILITY', label: 'Utility (transacional)' },
  { value: 'MARKETING', label: 'Marketing (promocional)' },
  { value: 'AUTHENTICATION', label: 'Authentication (código/OTP)' },
]

function CreateTemplateModal({ numberId, onClose }: { numberId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [language, setLanguage] = useState('pt_BR')
  const [category, setCategory] = useState('UTILITY')
  const [headerText, setHeaderText] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [footerText, setFooterText] = useState('')

  const createMutation = useMutation({
    mutationFn: () => api.post(`/whatsapp/numbers/${numberId}/templates`, {
      name: name.trim(),
      language,
      category,
      headerText: headerText.trim() || undefined,
      bodyText: bodyText.trim(),
      footerText: footerText.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-templates', numberId] })
      toast({ title: 'Template enviado pra aprovação da Meta', variant: 'success' })
      onClose()
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao criar template',
        description: err.response?.data?.error?.error_user_msg || err.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const hasEmptyPlaceholder = [bodyText, headerText, footerText].some((t) => t.includes('{{}}'))
  const isValid = /^[a-z0-9_]+$/.test(name) && bodyText.trim().length > 0 && !hasEmptyPlaceholder

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-sm font-semibold text-teal-900">Criar template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
              placeholder="lembrete_reuniao"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">Só minúsculas, números e underscore</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Idioma</label>
              <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="pt_BR" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-600"
              >
                {TEMPLATE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Cabeçalho <span className="text-gray-400">(opcional)</span></label>
            <Input value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="Lembrete de reunião" />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Corpo da mensagem</label>
            <Textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Olá {{1}}, passando pra lembrar da nossa reunião amanhã às {{2}}."
              className="min-h-[100px]"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">Use {'{{1}}, {{2}}...'} pra variáveis</p>
            {hasEmptyPlaceholder && (
              <p className="mt-1 text-[11px] text-red-600">
                Variável vazia encontrada ({'{{}}'}) — a Meta rejeita isso. Use {'{{1}}'}, {'{{2}}'} etc.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Rodapé <span className="text-gray-400">(opcional)</span></label>
            <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Responda se precisar remarcar" />
          </div>

          <p className="rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-700">
            O template vai ser enviado pra análise da Meta e pode demorar até 24h pra ser aprovado, rejeitado ou reclassificado de categoria.
          </p>
        </div>

        <div className="flex gap-2 border-t px-5 py-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            disabled={!isValid || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? 'Enviando...' : 'Enviar pra aprovação'}
          </Button>
        </div>
      </div>
    </div>
  )
}

const templateStatusConfig: Record<string, { label: string; icon: any; color: string }> = {
  APPROVED:  { label: 'Aprovado',  icon: CheckCircle2, color: 'text-teal-500' },
  PENDING:   { label: 'Pendente',  icon: Clock,        color: 'text-amber-500' },
  REJECTED:  { label: 'Rejeitado', icon: XCircle,      color: 'text-red-500'   },
}

const rejectedReasonLabels: Record<string, string> = {
  ABUSIVE_CONTENT: 'Conteúdo considerado abusivo/spam',
  INVALID_FORMAT: 'Formato inválido (variáveis ou estrutura incorreta)',
  PROMOTIONAL: 'Conteúdo promocional não permitido pra essa categoria',
  TAG_CONTENT_MISMATCH: 'Categoria não bate com o conteúdo (ex: marcado como Utility mas é Marketing)',
  INCORRECT_CATEGORY: 'Categoria incorreta',
  SCAM: 'Identificado como possível golpe',
}

export default function NumberConfigPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const isOwner = user?.role === 'owner'

  const [promptDraft, setPromptDraft] = useState('')
  const [historyLimit, setHistoryLimit] = useState(20)
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false)

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

          {/* Templates */}
          <div className="rounded-xl border bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-teal-900">Templates WhatsApp</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Templates aprovados pela Meta para envios em massa.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {isOwner && (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                    onClick={() => setCreateTemplateOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Criar template
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', syncMutation.isPending && 'animate-spin')} />
                  {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar'}
                </Button>
              </div>
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
                    {tpl.status === 'REJECTED' && tpl.rejectedReason && (
                      <p className="rounded bg-red-50 px-2 py-1.5 text-xs text-red-600 leading-relaxed">
                        Motivo: {rejectedReasonLabels[tpl.rejectedReason] ?? tpl.rejectedReason}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {createTemplateOpen && (
        <CreateTemplateModal numberId={id} onClose={() => setCreateTemplateOpen(false)} />
      )}
    </div>
  )
}
