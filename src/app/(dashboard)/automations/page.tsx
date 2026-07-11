'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Zap, X, ChevronDown, ChevronUp, CheckCircle2, XCircle, Cake, CreditCard, RefreshCw,
  Pencil, Trash2, Power, Calendar, History, List, Check, Clock, MailOpen, Reply, RotateCcw,
  ChevronLeft, ChevronRight, Play, Users, PhoneCall,
} from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type {
  AutomationRule, AutomationExecution, AutomationTriggerType, WhatsappNumber, WhatsappTemplate,
  UpcomingDispatch, AutomationStats, AutomationAudience,
} from '@/types'
import { formatPhone } from '@/lib/utils'

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
  payment_overdue: ['{nome}', '{primeiro_nome}', '{produto}', '{data_compra}', '{data_vencimento}', '{dias_atraso}'],
  repurchase: ['{nome}', '{primeiro_nome}', '{produto}', '{data_compra}'],
}

const VAR_DESCRIPTIONS: Record<string, string> = {
  '{nome}': 'Nome completo do contato',
  '{primeiro_nome}': 'Primeiro nome do contato',
  '{produto}': 'Nome do produto da venda',
  '{data_compra}': 'Data da última compra (DD/MM/AAAA)',
  '{data_vencimento}': 'Data de vencimento da cobrança (DD/MM/AAAA)',
  '{dias_atraso}': 'Dias em atraso desde o vencimento',
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

  const [activeVarIndex, setActiveVarIndex] = useState<number | null>(null)

  function insertVar(v: string) {
    if (form.messageType === 'template' && activeVarIndex !== null) {
      setTemplateVar(activeVarIndex, (form.templateVariables[activeVarIndex] ?? '') + v)
    } else {
      setForm((f) => ({ ...f, messageTemplate: (f.messageTemplate ?? '') + v }))
    }
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
          {form.type === 'payment_overdue' ? 'Dias após o vencimento (0 = no dia do vencimento)' : 'Offset em dias (0 = no dia, negativo = antes, positivo = depois)'}
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

              {/* Referência de variáveis disponíveis */}
              {dynamicVars.length > 0 && (
                <div className="rounded-lg border bg-gray-50 p-3 space-y-2">
                  <p className="text-xs font-medium text-gray-600">
                    Variáveis disponíveis — clique para inserir no campo selecionado:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {dynamicVars.map((v) => (
                      <button
                        key={v}
                        type="button"
                        title={VAR_DESCRIPTIONS[v] ?? v}
                        onClick={() => insertVar(v)}
                        className="rounded-full border bg-white px-2 py-0.5 text-xs text-gray-600 hover:bg-green-50 hover:border-green-400 hover:text-green-700 transition-colors font-mono"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <div className="border-t pt-2 space-y-0.5">
                    {dynamicVars.map((v) => (
                      <p key={v} className="text-xs text-muted-foreground">
                        <span className="font-mono text-gray-600">{v}</span>
                        {' → '}
                        {VAR_DESCRIPTIONS[v] ?? ''}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {Array.from({ length: selectedTemplate.variablesCount }).map((_, i) => (
                <div key={i}>
                  <label className="mb-0.5 block text-xs text-muted-foreground">
                    {`{{${i + 1}}}`}
                    {activeVarIndex === i && (
                      <span className="ml-1.5 text-green-600">← campo ativo</span>
                    )}
                  </label>
                  <Input
                    placeholder={`Ex: ${dynamicVars[i] ?? '{nome}'}`}
                    value={form.templateVariables[i] ?? ''}
                    onChange={(e) => setTemplateVar(i, e.target.value)}
                    onFocus={() => setActiveVarIndex(i)}
                    className={activeVarIndex === i ? 'border-green-400 ring-1 ring-green-300' : ''}
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

function RuleStatsRow({ ruleId }: { ruleId: string }) {
  const { data: stats } = useQuery<AutomationStats>({
    queryKey: ['automation-stats', ruleId],
    queryFn: () => api.get(`/automations/${ruleId}/stats`).then((r) => r.data),
  })

  if (!stats) return null

  return (
    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Check className="h-3 w-3 text-green-500" />
        {stats.sent} enviados
      </span>
      <span>·</span>
      <span className="flex items-center gap-1">
        <MailOpen className="h-3 w-3 text-blue-500" />
        {stats.read} lidos
      </span>
      <span>·</span>
      <span className="flex items-center gap-1">
        <Reply className="h-3 w-3 text-purple-500" />
        {stats.responded} respostas
      </span>
    </div>
  )
}

// --- Audience Modal ---
function AudienceModal({ rule, onClose }: { rule: AutomationRule; onClose: () => void }) {
  const { data, isLoading } = useQuery<AutomationAudience>({
    queryKey: ['automation-audience', rule.id],
    queryFn: () => api.get(`/automations/${rule.id}/audience`).then((r) => r.data),
  })

  const meta = TRIGGER_LABELS[rule.type]
  const Icon = meta?.icon ?? Zap

  const STATUS_CONFIG = {
    will_send: { label: 'Vai receber', className: 'bg-green-100 text-green-700' },
    already_sent: { label: 'Já recebeu hoje', className: 'bg-gray-100 text-gray-500' },
    opted_out: { label: 'Opt-out', className: 'bg-red-100 text-red-600' },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl border bg-white shadow-xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl', meta?.color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{rule.name}</h2>
              <p className="text-xs text-muted-foreground">Público de hoje</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && <p className="text-center text-sm text-muted-foreground py-8">Carregando...</p>}

          {!isLoading && data && (
            <>
              {/* Resumo */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-xl border bg-green-50 p-3 text-center">
                  <p className="text-lg font-bold text-green-700">{data.willSend}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Vão receber</p>
                </div>
                <div className="rounded-xl border bg-gray-50 p-3 text-center">
                  <p className="text-lg font-bold text-gray-600">{data.contacts.filter(c => c.status === 'already_sent').length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Já receberam</p>
                </div>
                <div className="rounded-xl border bg-red-50 p-3 text-center">
                  <p className="text-lg font-bold text-red-600">{data.contacts.filter(c => c.status === 'opted_out').length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Opt-out</p>
                </div>
              </div>

              {data.total === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">
                  Nenhum contato se enquadra nesta regra hoje
                </p>
              )}

              <div className="space-y-2">
                {data.contacts.map((c) => {
                  const statusCfg = STATUS_CONFIG[c.status]
                  return (
                    <div key={c.contactId} className="flex items-center gap-3 rounded-xl border px-4 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600 shrink-0">
                        {c.contactName?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.contactName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <PhoneCall className="h-3 w-3" />
                          {formatPhone(c.contactPhone)}
                          {c.extra && <span className="ml-1">· {c.extra}</span>}
                        </p>
                      </div>
                      <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium', statusCfg.className)}>
                        {statusCfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Tab: Regras ---
function RulesTab() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [audienceRule, setAudienceRule] = useState<AutomationRule | null>(null)

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

  const [runningRuleId, setRunningRuleId] = useState<string | null>(null)
  const runRuleMutation = useMutation({
    mutationFn: ({ id, force }: { id: string; force: boolean }) =>
      api.post(`/automations/${id}/run-now${force ? '?force=true' : ''}`),
    onSuccess: (res) => {
      setRunningRuleId(null)
      qc.invalidateQueries({ queryKey: ['automations-history'] })
      const triggered = res.data?.triggered ?? 0
      toast({
        title: triggered > 0 ? `${triggered} mensagem(ns) enviada(s)` : 'Nenhum contato para disparar hoje',
        variant: triggered > 0 ? 'success' : 'default',
      })
    },
    onError: (err: any) => {
      setRunningRuleId(null)
      toast({ title: 'Erro ao executar', description: err.response?.data?.message, variant: 'destructive' })
    },
  })

  function handleRunNow(rule: { id: string; name: string }) {
    const confirmed = window.confirm(
      `Executar "${rule.name}" agora?\n\nSe já foi executado hoje, as mensagens serão enviadas novamente para os contatos elegíveis.`
    )
    if (!confirmed) return
    setRunningRuleId(rule.id)
    runRuleMutation.mutate({ id: rule.id, force: true })
  }

  return (
    <div>
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
                  <RuleStatsRow ruleId={rule.id} />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setAudienceRule(rule)}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                    title="Ver público de hoje"
                  >
                    <Users className="h-3 w-3" />
                    Ver público
                  </button>
                  <button
                    onClick={() => handleRunNow(rule)}
                    disabled={runningRuleId === rule.id}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 transition-colors"
                    title="Executar agora"
                  >
                    <Play className="h-3 w-3" />
                    {runningRuleId === rule.id ? 'Executando...' : 'Executar agora'}
                  </button>
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

      {!showCreate && (
        <div className="mt-4 flex justify-end">
          <Button className="gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Nova automação
          </Button>
        </div>
      )}

      {audienceRule && <AudienceModal rule={audienceRule} onClose={() => setAudienceRule(null)} />}
    </div>
  )
}

// --- Tab: Agenda ---
function AgendaTab() {
  const { data: upcoming = [], isLoading } = useQuery<UpcomingDispatch[]>({
    queryKey: ['automations-upcoming'],
    queryFn: () => api.get('/automations/upcoming?days=7').then((r) => r.data),
  })

  const grouped: Record<string, UpcomingDispatch[]> = {}
  for (const item of upcoming) {
    if (!grouped[item.date]) grouped[item.date] = []
    grouped[item.date].push(item)
  }
  const sortedDates = Object.keys(grouped).sort()
  const today = new Date().toISOString().slice(0, 10)

  function formatDateLabel(dateStr: string): string {
    if (dateStr === today) return 'Hoje'
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  if (isLoading) return <p className="text-center text-sm text-muted-foreground py-12">Carregando...</p>

  if (upcoming.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-12 text-center">
        <Calendar className="mx-auto h-8 w-8 text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-500">Nenhum disparo agendado nos próximos 7 dias</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => {
        const items = grouped[date]
        return (
          <div key={date}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{formatDateLabel(date)}</p>
            <div className="space-y-2">
              {items.map((item, idx) => {
                const meta = TRIGGER_LABELS[item.rule.type]
                const Icon = meta?.icon ?? Zap
                return (
                  <div
                    key={`${date}-${item.rule.id}-${item.contact.id}-${idx}`}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border bg-white px-4 py-3',
                      item.wouldSkip && 'opacity-50',
                    )}
                  >
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', meta?.color ?? 'text-gray-500 bg-gray-100')}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium text-gray-900', item.wouldSkip && 'line-through')}>{item.contact.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.rule.name} · {item.contact.phone}</p>
                    </div>
                    {item.wouldSkip && (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        já enviado / opt-out
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// --- Tab: Histórico ---
function HistoryTab() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [ruleId, setRuleId] = useState('')
  const [status, setStatus] = useState('')
  const limit = 50

  const { data: rules = [] } = useQuery<AutomationRule[]>({
    queryKey: ['automations'],
    queryFn: () => api.get('/automations').then((r) => r.data),
  })

  const { data, isLoading } = useQuery<{
    data: AutomationExecution[]
    total: number
    page: number
    limit: number
  }>({
    queryKey: ['automations-history', page, ruleId, status],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (ruleId) params.set('ruleId', ruleId)
      if (status) params.set('status', status)
      return api.get(`/automations/history?${params}`).then((r) => r.data)
    },
  })

  const retryMutation = useMutation({
    mutationFn: (id: string) => api.post(`/automations/executions/${id}/retry`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['automations-history'] })
      toast({ title: 'Reenvio agendado', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao retentar', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const executions = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / limit)

  function resetPage() { setPage(1) }

  function statusBadge(exec: AutomationExecution) {
    if (exec.status === 'failed') {
      return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700"><XCircle className="h-3 w-3" />Falhou</span>
    }
    return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"><CheckCircle2 className="h-3 w-3" />Enviado</span>
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={ruleId}
          onChange={(e) => { setRuleId(e.target.value); resetPage() }}
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todas as automações</option>
          {rules.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); resetPage() }}
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todos os status</option>
          <option value="sent">Enviado</option>
          <option value="failed">Falhou</option>
        </select>
      </div>

      {isLoading && <p className="text-center text-sm text-muted-foreground py-12">Carregando...</p>}

      {!isLoading && executions.length === 0 && (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <History className="mx-auto h-8 w-8 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">Nenhum histórico encontrado</p>
        </div>
      )}

      {executions.length > 0 && (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-500">
                <th className="px-4 py-2.5 text-left font-medium">Data</th>
                <th className="px-4 py-2.5 text-left font-medium">Contato</th>
                <th className="px-4 py-2.5 text-left font-medium">Automação</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-center font-medium">Entregue</th>
                <th className="px-4 py-2.5 text-center font-medium">Lido</th>
                <th className="px-4 py-2.5 text-center font-medium">Respondeu</th>
                <th className="px-4 py-2.5 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {executions.map((exec) => (
                <tr key={exec.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(exec.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' } as Intl.DateTimeFormatOptions)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 truncate max-w-[140px]">{(exec as any).contactName || exec.contact?.name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{(exec as any).contactPhone || exec.contact?.phone || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 truncate max-w-[120px]">
                    {(exec as any).ruleName || exec.rule?.name || '—'}
                  </td>
                  <td className="px-4 py-3">{statusBadge(exec)}</td>
                  <td className="px-4 py-3 text-center">
                    {exec.messageStatus === 'delivered' || exec.messageStatus === 'read'
                      ? <span title="Entregue"><Check className="h-4 w-4 text-green-500 mx-auto" /></span>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {exec.messageStatus === 'read'
                      ? <span title="Lido"><MailOpen className="h-4 w-4 text-blue-500 mx-auto" /></span>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {exec.responded
                      ? <span title="Respondeu"><Reply className="h-4 w-4 text-purple-500 mx-auto" /></span>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {exec.status === 'failed' && (
                      <button
                        onClick={() => retryMutation.mutate(exec.id)}
                        disabled={retryMutation.isPending}
                        className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        title="Retentar"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Retentar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {total} registro{total !== 1 ? 's' : ''} · página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="gap-1"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Main Page ---
export default function AutomationsPage() {
  const [tab, setTab] = useState<'rules' | 'agenda' | 'history'>('rules')

  const tabs = [
    { key: 'rules' as const, label: 'Regras', icon: List },
    { key: 'agenda' as const, label: 'Agenda', icon: Calendar },
    { key: 'history' as const, label: 'Histórico', icon: History },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Automações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Disparos automáticos por aniversário, pagamento em atraso e recompra
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Roda automaticamente todo dia às 08:00
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex border-b">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                tab === key
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-muted-foreground hover:text-gray-700',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'rules' && <RulesTab />}
        {tab === 'agenda' && <AgendaTab />}
        {tab === 'history' && <HistoryTab />}
      </div>
    </div>
  )
}
