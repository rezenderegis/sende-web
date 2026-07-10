'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Zap, X, ChevronDown, ChevronUp, CheckCircle2, XCircle, Cake, CreditCard, RefreshCw, Pencil, Trash2, Power } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { AutomationRule, AutomationExecution, AutomationTriggerType, WhatsappNumber, WhatsappTemplate } from '@/types'

const TRIGGER_LABELS: Record<string, { label: string; description: string; icon: React.ElementType; color: string }> = {
  birthday: {
    label: 'Aniversário',
    description: 'Dispara no aniversário do contato',
    icon: Cake,
    color: 'text-pink-600 bg-pink-50',
  },
  payment_overdue: {
    label: 'Pagamento em atraso',
    description: 'Dispara quando uma venda vence sem pagamento',
    icon: CreditCard,
    color: 'text-amber-600 bg-amber-50',
  },
  repurchase: {
    label: 'Recompra',
    description: 'Dispara quando é hora do cliente voltar a comprar',
    icon: RefreshCw,
    color: 'text-blue-600 bg-blue-50',
  },
}

const TEMPLATE_VARS: Record<string, string[]> = {
  birthday: ['{nome}', '{primeiro_nome}'],
  payment_overdue: ['{nome}', '{primeiro_nome}', '{produto}', '{data_vencimento}', '{dias_atraso}'],
  repurchase: ['{nome}', '{primeiro_nome}', '{produto}'],
}

const DEFAULT_TEMPLATES: Record<string, string> = {
  birthday: 'Olá {primeiro_nome}! 🎂 A equipe deseja um feliz aniversário! Esperamos você em breve.',
  payment_overdue: 'Olá {primeiro_nome}, seu pagamento de {produto} com vencimento em {data_vencimento} está em aberto há {dias_atraso} dia(s). Podemos ajudar?',
  repurchase: 'Olá {primeiro_nome}! Já faz um tempinho desde seu último {produto}. Que tal agendar?',
}

function offsetLabel(type: string, offset: number): string {
  if (offset === 0) return 'No dia do evento'
  if (type === 'payment_overdue') {
    return offset > 0 ? `${offset} dia(s) após o vencimento` : `${Math.abs(offset)} dia(s) antes do vencimento`
  }
  return offset < 0 ? `${Math.abs(offset)} dia(s) antes` : `${offset} dia(s) depois`
}

function RuleForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: Partial<AutomationRule>
  onSave: (data: any) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    type: (initial?.type ?? 'birthday') as AutomationTriggerType,
    whatsappNumberId: initial?.whatsappNumberId ?? '',
    triggerOffsetDays: String(initial?.triggerOffsetDays ?? 0),
    messageType: (initial?.messageType ?? 'text') as 'text' | 'template',
    messageTemplate: initial?.messageTemplate ?? DEFAULT_TEMPLATES['birthday'],
    templateName: initial?.templateName ?? '',
    templateLanguage: initial?.templateLanguage ?? 'pt_BR',
    templateVariables: initial?.templateVariables ?? [] as string[],
  })

  const { data: numbers = [] } = useQuery<WhatsappNumber[]>({
    queryKey: ['whatsapp-numbers'],
    queryFn: () => api.get('/whatsapp/numbers').then((r) => r.data),
  })

  const { data: templates = [] } = useQuery<WhatsappTemplate[]>({
    queryKey: ['whatsapp-templates', form.whatsappNumberId],
    queryFn: () => api.get(`/whatsapp/numbers/${form.whatsappNumberId}/templates`).then((r) => r.data),
    enabled: !!form.whatsappNumberId && form.messageType === 'template',
  })

  const selectedTemplate = templates.find((t) => t.name === form.templateName)

  function setType(type: AutomationTriggerType) {
    setForm((f) => ({
      ...f,
      type,
      messageTemplate: f.messageTemplate === DEFAULT_TEMPLATES[f.type] ? DEFAULT_TEMPLATES[type] : f.messageTemplate,
    }))
  }

  function setMessageType(messageType: 'text' | 'template') {
    setForm((f) => ({ ...f, messageType }))
  }

  function selectTemplate(name: string) {
    const tpl = templates.find((t) => t.name === name)
    const slots = tpl?.variablesCount ?? 0
    setForm((f) => ({
      ...f,
      templateName: name,
      templateLanguage: tpl?.language ?? 'pt_BR',
      templateVariables: Array.from({ length: slots }, (_, i) => f.templateVariables[i] ?? ''),
    }))
  }

  function setTemplateVar(index: number, value: string) {
    setForm((f) => {
      const vars = [...f.templateVariables]
      vars[index] = value
      return { ...f, templateVariables: vars }
    })
  }

  function insertVar(v: string) {
    setForm((f) => ({ ...f, messageTemplate: (f.messageTemplate ?? '') + v }))
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.whatsappNumberId) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' })
      return
    }
    if (form.messageType === 'text' && !form.messageTemplate?.trim()) {
      toast({ title: 'Digite a mensagem', variant: 'destructive' })
      return
    }
    if (form.messageType === 'template' && !form.templateName) {
      toast({ title: 'Selecione um template', variant: 'destructive' })
      return
    }
    onSave({
      name: form.name.trim(),
      type: form.type,
      whatsappNumberId: form.whatsappNumberId,
      triggerOffsetDays: parseInt(form.triggerOffsetDays) || 0,
      messageType: form.messageType,
      messageTemplate: form.messageType === 'text' ? form.messageTemplate?.trim() : null,
      templateName: form.messageType === 'template' ? form.templateName : null,
      templateLanguage: form.messageType === 'template' ? form.templateLanguage : null,
      templateVariables: form.messageType === 'template' && form.templateVariables.length ? form.templateVariables : null,
    })
  }

  const dynamicVars = TEMPLATE_VARS[form.type] || []

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Nome da automação *</label>
        <Input placeholder="Ex: Parabéns aniversariantes" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Gatilho *</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(TRIGGER_LABELS).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              onClick={() => setType(key as AutomationTriggerType)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-colors',
                form.type === key ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50',
              )}
            >
              <meta.icon className="h-4 w-4" />
              {meta.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{TRIGGER_LABELS[form.type]?.description}</p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Número WhatsApp *</label>
        <select
          value={form.whatsappNumberId}
          onChange={(e) => setForm((f) => ({ ...f, whatsappNumberId: e.target.value }))}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Selecionar número...</option>
          {numbers.map((n) => (
            <option key={n.id} value={n.id}>{n.displayName} ({n.phoneNumber})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          {form.type === 'payment_overdue' ? 'Dias após o vencimento' : 'Dias antes do evento (negativo = antecipação)'}
        </label>
        <Input
          type="number"
          value={form.triggerOffsetDays}
          onChange={(e) => setForm((f) => ({ ...f, triggerOffsetDays: e.target.value }))}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {offsetLabel(form.type, parseInt(form.triggerOffsetDays) || 0)}
        </p>
      </div>

      {/* Tipo de mensagem */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Tipo de mensagem *</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMessageType('template')}
            className={cn(
              'flex-1 rounded-lg border py-2 text-xs font-medium transition-colors',
              form.messageType === 'template' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50',
            )}
          >
            Template Meta
          </button>
          <button
            type="button"
            onClick={() => setMessageType('text')}
            className={cn(
              'flex-1 rounded-lg border py-2 text-xs font-medium transition-colors',
              form.messageType === 'text' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50',
            )}
          >
            Texto livre
          </button>
        </div>
        {form.messageType === 'template' && (
          <p className="mt-1 text-xs text-muted-foreground">
            Recomendado — funciona mesmo sem conversa ativa nas últimas 24h
          </p>
        )}
        {form.messageType === 'text' && (
          <p className="mt-1 text-xs text-amber-600">
            Só funciona se o contato interagiu nas últimas 24h
          </p>
        )}
      </div>

      {/* Template Meta */}
      {form.messageType === 'template' && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Template aprovado *</label>
            {!form.whatsappNumberId ? (
              <p className="text-xs text-muted-foreground">Selecione um número primeiro</p>
            ) : (
              <select
                value={form.templateName}
                onChange={(e) => selectTemplate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecionar template...</option>
                {templates
                  .filter((t) => t.status === 'APPROVED')
                  .map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} {t.variablesCount > 0 ? `(${t.variablesCount} variável(is))` : ''}
                    </option>
                  ))}
              </select>
            )}
          </div>

          {selectedTemplate && selectedTemplate.bodyText && (
            <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600 border">
              <p className="font-medium text-gray-500 mb-1">Prévia do template:</p>
              <p className="whitespace-pre-wrap">{selectedTemplate.bodyText}</p>
            </div>
          )}

          {selectedTemplate && selectedTemplate.variablesCount > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">
                Variáveis do template
              </label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                <p className="w-full text-xs text-muted-foreground">Clique para inserir no campo ativo:</p>
                {dynamicVars.map((v) => (
                  <span key={v} className="rounded-full border bg-gray-50 px-2 py-0.5 text-xs text-gray-500 font-mono">{v}</span>
                ))}
              </div>
              {Array.from({ length: selectedTemplate.variablesCount }).map((_, i) => (
                <div key={i}>
                  <label className="mb-0.5 block text-xs text-muted-foreground">{`{{${i + 1}}}`}</label>
                  <Input
                    placeholder={`Ex: ${dynamicVars[i] ?? '{nome}'}`}
                    value={form.templateVariables[i] ?? ''}
                    onChange={(e) => setTemplateVar(i, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Texto livre */}
      {form.messageType === 'text' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Mensagem *</label>
          {dynamicVars.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {dynamicVars.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVar(v)}
                  className="rounded-full border bg-gray-50 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 transition-colors font-mono"
                >
                  {v}
                </button>
              ))}
            </div>
          )}
          <textarea
            rows={4}
            value={form.messageTemplate ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, messageTemplate: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
            placeholder="Digite a mensagem..."
          />
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
        <Button className="flex-1" disabled={isPending} onClick={handleSubmit}>
          {isPending ? 'Salvando...' : 'Salvar automação'}
        </Button>
      </div>
    </div>
  )
}

function ExecutionsPanel({ rule }: { rule: AutomationRule }) {
  const { data: executions = [], isLoading } = useQuery<AutomationExecution[]>({
    queryKey: ['automation-executions', rule.id],
    queryFn: () => api.get(`/automations/${rule.id}/executions`).then((r) => r.data),
  })

  if (isLoading) return <p className="py-4 text-center text-sm text-muted-foreground">Carregando...</p>
  if (executions.length === 0) return <p className="py-4 text-center text-sm text-muted-foreground">Nenhum disparo registrado ainda</p>

  return (
    <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
      {executions.map((e) => (
        <div key={e.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
          {e.status === 'sent'
            ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />
            : <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />}
          <span className="flex-1 text-gray-700 truncate">{e.contact?.name || e.contactId}</span>
          <span className="text-muted-foreground shrink-0">{new Date(e.createdAt).toLocaleDateString('pt-BR')}</span>
          {e.error && <span className="text-red-500 truncate max-w-[120px]" title={e.error}>{e.error}</span>}
        </div>
      ))}
    </div>
  )
}

export default function AutomationsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: rules = [], isLoading } = useQuery<AutomationRule[]>({
    queryKey: ['automations'],
    queryFn: () => api.get('/automations').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/automations', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['automations'] })
      setShowCreate(false)
      toast({ title: 'Automação criada', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao criar', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/automations/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['automations'] })
      setEditingId(null)
      toast({ title: 'Automação atualizada', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao atualizar', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/automations/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/automations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['automations'] })
      toast({ title: 'Automação excluída', variant: 'success' })
    },
  })

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Automações</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Disparos automáticos por aniversário, pagamento em atraso e recompra
            </p>
          </div>
          {!showCreate && (
            <Button className="gap-1.5" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Nova automação
            </Button>
          )}
        </div>

        {showCreate && (
          <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Nova automação</h2>
            <RuleForm
              onSave={(data) => createMutation.mutate(data)}
              onCancel={() => setShowCreate(false)}
              isPending={createMutation.isPending}
            />
          </div>
        )}

        {isLoading && <p className="text-center text-sm text-muted-foreground py-12">Carregando...</p>}

        {!isLoading && rules.length === 0 && !showCreate && (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <Zap className="mx-auto h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">Nenhuma automação criada</p>
            <p className="text-xs text-muted-foreground mt-1">
              Crie regras para disparar mensagens automaticamente por aniversário, cobrança ou recompra
            </p>
          </div>
        )}

        <div className="space-y-3">
          {rules.map((rule) => {
            const meta = TRIGGER_LABELS[rule.type]
            const Icon = meta?.icon ?? Zap
            const isExpanded = expandedId === rule.id
            const isEditing = editingId === rule.id

            if (isEditing) {
              return (
                <div key={rule.id} className="rounded-2xl border bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900">Editar automação</h2>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <RuleForm
                    initial={rule}
                    onSave={(data) => updateMutation.mutate({ id: rule.id, data })}
                    onCancel={() => setEditingId(null)}
                    isPending={updateMutation.isPending}
                  />
                </div>
              )
            }

            return (
              <div key={rule.id} className="rounded-2xl border bg-white shadow-sm">
                <div className="flex items-center gap-3 p-4">
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', meta?.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{rule.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {meta?.label} · {offsetLabel(rule.type, rule.triggerOffsetDays)} · {rule.whatsappNumber?.displayName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                      className={cn('flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors', rule.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}
                      title={rule.isActive ? 'Desativar' : 'Ativar'}
                    >
                      <Power className="h-3 w-3" />
                      {rule.isActive ? 'Ativa' : 'Inativa'}
                    </button>
                    <button onClick={() => setEditingId(rule.id)} className="text-gray-400 hover:text-gray-700 transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm('Excluir esta automação?')) deleteMutation.mutate(rule.id) }}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : rule.id)}
                      className="text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 pb-4">
                    <div className="mt-3 rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        {rule.messageType === 'template' ? 'Template Meta' : 'Mensagem de texto'}
                      </p>
                      {rule.messageType === 'template' ? (
                        <div>
                          <p className="text-sm text-gray-700 font-mono">{rule.templateName}</p>
                          {rule.templateVariables && rule.templateVariables.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {rule.templateVariables.map((v, i) => (
                                <span key={i} className="rounded bg-white border px-1.5 py-0.5 text-xs text-gray-600 font-mono">{`{{${i+1}}}`} = {v}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{rule.messageTemplate}</p>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Histórico de disparos</p>
                      <ExecutionsPanel rule={rule} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
