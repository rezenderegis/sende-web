'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Send, BotMessageSquare, X, Search, ExternalLink, Upload, FileText, AlertCircle, CheckCircle2, Plus, Tag as TagIcon } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { WhatsappNumber, Tag, Broadcast, WhatsappTemplate, CampaignPrompt, IntentRule } from '@/types'

const steps = ['Configuração', 'Destinatários', 'Revisar e enviar']

function PromptPickerModal({
  prompts,
  onSelect,
  onClose,
}: {
  prompts: CampaignPrompt[]
  onSelect: (p: CampaignPrompt) => void
  onClose: () => void
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const filtered = prompts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border bg-white shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <BotMessageSquare className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-gray-900">Selecionar prompt de campanha</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar prompt..."
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <BotMessageSquare className="h-8 w-8 opacity-20" />
              {prompts.length === 0 ? (
                <>
                  <p className="text-sm">Nenhum prompt criado ainda</p>
                  <button
                    onClick={() => { onClose(); router.push('/settings/prompts') }}
                    className="flex items-center gap-1.5 text-xs text-green-700 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Criar prompts na biblioteca
                  </button>
                </>
              ) : (
                <p className="text-sm">Nenhum resultado para "{search}"</p>
              )}
            </div>
          )}
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="w-full rounded-lg px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900">{p.name}</p>
              <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 font-mono">{p.content}</p>
            </button>
          ))}
        </div>

        <div className="border-t px-4 py-3 flex justify-between items-center">
          <button
            onClick={() => { onClose(); router.push('/settings/prompts') }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gray-900 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Gerenciar biblioteca
          </button>
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </div>
  )
}

function NewBroadcastContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const draftId = searchParams.get('draft')

  const [step, setStep] = useState(0)
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null)
  const [recipientsAdded, setRecipientsAdded] = useState(false)
  const [promptPickerOpen, setPromptPickerOpen] = useState(false)
  const [selectedPromptName, setSelectedPromptName] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    whatsappNumberId: '',
    type: 'text' as 'text' | 'template',
    message: '',
    templateName: '',
    templateLanguage: 'pt_BR',
    campaignPrompt: '',
  })
  const [intentRules, setIntentRules] = useState<IntentRule[]>([])

  const [recipients, setRecipients] = useState<{ tagId?: string; contactIds?: string[] }>({})
  const [recipientMode, setRecipientMode] = useState<'contacts' | 'csv'>('contacts')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<string[][]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvUploadResult, setCsvUploadResult] = useState<{
    added: number
    skipped: number
    errors: { row: number; phone: string; reason: string }[]
  } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [csvVarWarning, setCsvVarWarning] = useState<string | null>(null)

  // Carrega rascunho se ?draft=ID estiver presente
  const { data: draftData } = useQuery<Broadcast>({
    queryKey: ['broadcast', draftId],
    queryFn: () => api.get(`/broadcasts/${draftId}`).then((r) => r.data),
    enabled: !!draftId,
  })

  useEffect(() => {
    if (draftData && draftData.status === 'draft') {
      setBroadcast(draftData)
      setForm({
        name: draftData.name,
        whatsappNumberId: draftData.whatsappNumberId,
        type: draftData.type as 'text' | 'template',
        message: draftData.message ?? '',
        templateName: draftData.templateName ?? '',
        templateLanguage: draftData.templateLanguage ?? 'pt_BR',
        campaignPrompt: draftData.campaignPrompt ?? '',
      })
      setIntentRules(draftData.intentRules ?? [])
      // Se já tem destinatários, começa no passo 1
      if (draftData.totalCount > 0) {
        setRecipientsAdded(true)
        setStep(1)
      }
    }
  }, [draftData])

  const { data: numbers = [] } = useQuery<WhatsappNumber[]>({
    queryKey: ['whatsapp-numbers'],
    queryFn: () => api.get('/whatsapp/numbers').then((r) => r.data),
  })

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: () => api.get('/tags').then((r) => r.data),
  })

  const { data: campaignPrompts = [] } = useQuery<CampaignPrompt[]>({
    queryKey: ['campaign-prompts'],
    queryFn: () => api.get('/campaign-prompts').then((r) => r.data),
  })

  const { data: templates = [], isLoading: templatesLoading } = useQuery<WhatsappTemplate[]>({
    queryKey: ['whatsapp-templates', form.whatsappNumberId],
    queryFn: () =>
      api.get(`/whatsapp/numbers/${form.whatsappNumberId}/templates`).then((r) => r.data),
    enabled: !!form.whatsappNumberId && form.type === 'template',
  })

  const createMutation = useMutation({
    mutationFn: () =>
      api
        .post('/broadcasts', {
          name: form.name,
          whatsappNumberId: form.whatsappNumberId,
          type: form.type,
          ...(form.type === 'text'
            ? { message: form.message }
            : { templateName: form.templateName, templateLanguage: form.templateLanguage }),
          ...(form.campaignPrompt.trim() ? { campaignPrompt: form.campaignPrompt.trim() } : {}),
          intentRules: intentRules.filter((r) => r.intent.trim() && r.tagId),
        })
        .then((r) => r.data),
    onSuccess: (data: Broadcast) => {
      setBroadcast(data)
      setStep(1)
    },
    onError: (err: any) =>
      toast({
        title: 'Erro ao criar broadcast',
        description: err.response?.data?.message,
        variant: 'destructive',
      }),
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      api
        .patch(`/broadcasts/${broadcast!.id}`, {
          name: form.name,
          whatsappNumberId: form.whatsappNumberId,
          type: form.type,
          message: form.type === 'text' ? form.message : undefined,
          templateName: form.type === 'template' ? form.templateName : undefined,
          templateLanguage: form.type === 'template' ? form.templateLanguage : undefined,
          campaignPrompt: form.campaignPrompt.trim() || undefined,
          intentRules: intentRules.filter((r) => r.intent.trim() && r.tagId),
        })
        .then((r) => r.data),
    onSuccess: (data: Broadcast) => {
      setBroadcast(data)
      setStep(1)
    },
    onError: (err: any) =>
      toast({
        title: 'Erro ao atualizar broadcast',
        description: err.response?.data?.message,
        variant: 'destructive',
      }),
  })

  const addRecipientsMutation = useMutation({
    mutationFn: () =>
      api.post(`/broadcasts/${broadcast!.id}/recipients`, recipients).then((r) => r.data),
    onSuccess: (result: { added: number; skipped: number }) => {
      if (result.added === 0 && !recipientsAdded) {
        toast({
          title: 'Nenhum destinatário encontrado',
          description: 'Verifique se a tag possui contatos ou se os IDs estão corretos.',
          variant: 'destructive',
        })
        return
      }
      if (result.added > 0) {
        toast({ title: `${result.added} destinatário(s) adicionado(s)`, variant: 'success' })
      }
      setRecipientsAdded(true)
      setStep(2)
    },
    onError: () => toast({ title: 'Erro ao adicionar destinatários', variant: 'destructive' }),
  })

  const addCsvMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData()
      formData.append('file', csvFile!)
      return api
        .post(`/broadcasts/${broadcast!.id}/recipients/csv?type=${form.type}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data)
    },
    onSuccess: (result: { added: number; skipped: number; errors: { row: number; phone: string; reason: string }[] }) => {
      setCsvUploadResult(result)
      if (result.added > 0) {
        toast({ title: `${result.added} destinatário(s) importado(s)`, variant: 'success' })
        setRecipientsAdded(true)
        setStep(2)
      } else {
        toast({ title: 'Nenhum destinatário importado', description: 'Verifique os erros abaixo.', variant: 'destructive' })
      }
    },
    onError: (err: any) =>
      toast({ title: 'Erro ao importar CSV', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const sendMutation = useMutation({
    mutationFn: () => api.post(`/broadcasts/${broadcast!.id}/send`),
    onSuccess: () => {
      toast({ title: 'Broadcast enviado!', variant: 'success' })
      router.push(`/broadcasts/${broadcast!.id}`)
    },
    onError: () => toast({ title: 'Erro ao iniciar envio', variant: 'destructive' }),
  })

  function handleStep0Continue() {
    if (broadcast) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  function handleCsvFile(file: File) {
    setCsvFile(file)
    setCsvUploadResult(null)
    setCsvVarWarning(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim())
      if (lines.length === 0) return
      const delim = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ','
      const firstCell = lines[0].split(delim)[0].trim()
      const hasHeader = !/^\d{8,}$/.test(firstCell)
      const defaultHeaders = ['telefone', 'nome', 'mensagem', 'var1', 'var2', 'var3', 'var4', 'var5']
      const headers = hasHeader
        ? lines[0].split(delim).map((h) => h.trim().replace(/^"|"$/g, ''))
        : defaultHeaders.slice(0, lines[0].split(delim).length)
      setCsvHeaders(headers)
      const dataLines = hasHeader ? lines.slice(1, 6) : lines.slice(0, 5)
      const preview = dataLines.map((l) =>
        l.split(delim).map((c) => c.trim().replace(/^"|"$/g, '')),
      )
      setCsvPreview(preview)

      if (form.type === 'template' && form.templateName) {
        const selectedTpl = templates.find((t) => t.name === form.templateName)
        if (selectedTpl && selectedTpl.variablesCount > 0) {
          const csvVarCols = headers.filter((h) => /^var\d+$/i.test(h)).length
          if (csvVarCols !== selectedTpl.variablesCount) {
            setCsvVarWarning(
              `O template "${form.templateName}" tem ${selectedTpl.variablesCount} variável(is) mas o CSV tem ${csvVarCols} coluna(s) var. Corrija o CSV antes de importar.`
            )
          }
        }
      }
    }
    reader.readAsText(file)
  }

  function handleStep1Continue() {
    if (recipientMode === 'csv' || templateRequiresCsv) {
      if (csvFile) {
        addCsvMutation.mutate()
      } else if (recipientsAdded) {
        setStep(2)
      }
      return
    }
    const hasSelection = recipients.tagId || (recipients.contactIds && recipients.contactIds.length > 0)
    if (recipientsAdded && !hasSelection) {
      setStep(2)
      return
    }
    addRecipientsMutation.mutate()
  }

  function selectPrompt(p: CampaignPrompt) {
    setForm((f) => ({ ...f, campaignPrompt: p.content }))
    setSelectedPromptName(p.name)
    setPromptPickerOpen(false)
  }

  function clearPrompt() {
    setForm((f) => ({ ...f, campaignPrompt: '' }))
    setSelectedPromptName(null)
  }

  const selectedTemplate = form.type === 'template'
    ? templates.find((t) => t.name === form.templateName)
    : null
  const templateRequiresCsv = (selectedTemplate?.variablesCount ?? 0) > 0

  const step0Valid =
    form.name.trim() &&
    form.whatsappNumberId &&
    (form.type === 'text' ? form.message.trim() : form.templateName.trim())

  const step1Valid =
    recipientMode === 'csv' || templateRequiresCsv
      ? csvFile !== null || recipientsAdded
      : recipientsAdded ||
        recipients.tagId ||
        (recipients.contactIds && recipients.contactIds.length > 0)

  const isPendingStep0 = createMutation.isPending || updateMutation.isPending

  return (
    <div className="p-6 max-w-2xl">
      {promptPickerOpen && (
        <PromptPickerModal
          prompts={campaignPrompts}
          onSelect={selectPrompt}
          onClose={() => setPromptPickerOpen(false)}
        />
      )}

      <button
        onClick={() => router.push('/broadcasts')}
        className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para broadcasts
      </button>

      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        {broadcast ? 'Editar broadcast' : 'Novo Broadcast'}
      </h1>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                i < step
                  ? 'bg-green-500 text-white'
                  : i === step
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-400',
              )}
            >
              {i < step ? '✓' : i + 1}
            </div>
            <span
              className={cn(
                'text-sm',
                i === step ? 'font-medium text-gray-900' : 'text-muted-foreground',
              )}
            >
              {s}
            </span>
            {i < steps.length - 1 && <div className="mx-1 h-px w-8 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 0 — Configuração */}
      {step === 0 && (
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <div className="space-y-2">
            <Label>Nome do broadcast</Label>
            <Input
              placeholder="Ex: Promoção Julho 2025"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Número de envio</Label>
            <Select
              value={form.whatsappNumberId}
              onValueChange={(v) => setForm((f) => ({ ...f, whatsappNumberId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o número" />
              </SelectTrigger>
              <SelectContent>
                {numbers.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.displayName} ({n.phoneNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de mensagem</Label>
            <div className="flex gap-2">
              {(['text', 'template'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                    form.type === t
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:bg-gray-50',
                  )}
                >
                  {t === 'text' ? 'Texto livre' : 'Template WhatsApp'}
                </button>
              ))}
            </div>
          </div>

          {form.type === 'text' ? (
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Olá, {{nome}}! Temos uma oferta especial para você..."
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="min-h-32 resize-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {[['{{nome}}', 'nome completo'], ['{{primeiro_nome}}', 'primeiro nome']].map(([tag, label]) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, message: f.message + tag }))}
                    className="rounded border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors font-mono"
                  >
                    {tag} <span className="font-sans not-italic text-gray-400">— {label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Requer janela ativa de 24h com o contato.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Template</Label>
              {!form.whatsappNumberId ? (
                <p className="text-xs text-muted-foreground">
                  Selecione um número primeiro para ver os templates disponíveis.
                </p>
              ) : templatesLoading ? (
                <p className="text-xs text-muted-foreground">Carregando templates...</p>
              ) : templates.filter((t) => t.status === 'APPROVED').length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum template aprovado encontrado. Sincronize os templates nas configurações do
                  número.
                </p>
              ) : (
                <div className="space-y-2">
                  {templates
                    .filter((t) => t.status === 'APPROVED')
                    .map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, templateName: t.name, templateLanguage: t.language }))
                        }
                        className={cn(
                          'w-full rounded-lg border p-3 text-left transition-colors',
                          form.templateName === t.name
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:bg-gray-50',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-900">{t.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {t.language}
                          </span>
                        </div>
                        {t.bodyText && (
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{t.bodyText}</p>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Campaign Prompt */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label>
                Prompt de campanha{' '}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <button
                type="button"
                onClick={() => setPromptPickerOpen(true)}
                className="flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 font-medium transition-colors"
              >
                <BotMessageSquare className="h-3.5 w-3.5" />
                {selectedPromptName ? 'Trocar prompt' : 'Selecionar da biblioteca'}
              </button>
            </div>

            {selectedPromptName && form.campaignPrompt && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BotMessageSquare className="h-3.5 w-3.5 shrink-0 text-green-700" />
                  <span className="text-sm font-medium text-green-800 truncate">
                    {selectedPromptName}
                  </span>
                </div>
                <button onClick={clearPrompt} className="text-green-600 hover:text-green-800 shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <Textarea
              placeholder="Você é um assistente de vendas especializado em [produto]. Seu objetivo é..."
              value={form.campaignPrompt}
              onChange={(e) => setForm((f) => ({ ...f, campaignPrompt: e.target.value }))}
              className="min-h-24 resize-none font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Quando o contato responder, o bot usará este prompt. Ativo por 72h ou até um atendente
              responder.
            </p>
          </div>

          {/* Intent Rules */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label>
                Intenções de resposta{' '}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <button
                type="button"
                onClick={() => setIntentRules((r) => [...r, { intent: '', tagId: '' }])}
                className="flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 font-medium transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar intenção
              </button>
            </div>

            {intentRules.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Quando o contato responder com uma intenção detectada pela IA, a tag correspondente será aplicada automaticamente.
              </p>
            )}

            {intentRules.map((rule, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ex: cliente quer agendar uma reunião"
                  value={rule.intent}
                  onChange={(e) =>
                    setIntentRules((rules) =>
                      rules.map((r, idx) => (idx === i ? { ...r, intent: e.target.value } : r)),
                    )
                  }
                  className="flex-1 h-9 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <select
                  value={rule.tagId}
                  onChange={(e) =>
                    setIntentRules((rules) =>
                      rules.map((r, idx) => (idx === i ? { ...r, tagId: e.target.value } : r)),
                    )
                  }
                  className="h-9 rounded-md border border-gray-200 px-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">Tag...</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIntentRules((rules) => rules.filter((_, idx) => idx !== i))}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <Button
            className="w-full gap-2"
            disabled={!step0Valid || isPendingStep0}
            onClick={handleStep0Continue}
          >
            {isPendingStep0 ? 'Salvando...' : 'Continuar'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 1 — Destinatários */}
      {step === 1 && (
        <div className="rounded-xl border bg-white p-6 space-y-5">
          {/* Mode toggle */}
          {templateRequiresCsv ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              <span className="font-medium">CSV obrigatório</span> — o template <span className="font-mono font-medium">{form.templateName}</span> tem {selectedTemplate?.variablesCount} variável(is). Para personalizar cada mensagem, envie via planilha com as colunas de variáveis preenchidas.
            </div>
          ) : (
            <div className="flex rounded-lg border p-1 gap-1">
              {(['contacts', 'csv'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setRecipientMode(mode)}
                  className={cn(
                    'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
                    recipientMode === mode
                      ? 'bg-gray-900 text-white'
                      : 'text-muted-foreground hover:text-gray-900',
                  )}
                >
                  {mode === 'contacts' ? 'Contatos / Tags' : 'Importar CSV'}
                </button>
              ))}
            </div>
          )}

          {recipientsAdded && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              Destinatários já adicionados. Selecione novos para incluir mais, ou clique em Continuar.
            </div>
          )}

          {!templateRequiresCsv && recipientMode === 'contacts' && (
            <>
              <p className="text-sm text-muted-foreground">
                Escolha quem vai receber o broadcast. Você pode selecionar por tag ou digitar IDs de
                contatos.
              </p>

              <div className="space-y-2">
                <Label>Filtrar por tag</Label>
                <Select
                  value={recipients.tagId ?? ''}
                  onValueChange={(v) => setRecipients({ tagId: v || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma tag (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: t.color }}
                          />
                          {t.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-muted-foreground">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="space-y-2">
                <Label>IDs de contatos (um por linha)</Label>
                <Textarea
                  placeholder={'uuid-contato-1\nuuid-contato-2'}
                  className="min-h-28 resize-none font-mono text-xs"
                  value={(recipients.contactIds ?? []).join('\n')}
                  onChange={(e) => {
                    const ids = e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean)
                    setRecipients({ contactIds: ids.length ? ids : undefined })
                  }}
                />
              </div>
            </>
          )}

          {(recipientMode === 'csv' || templateRequiresCsv) && (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800 space-y-1.5">
                <p className="font-medium">Formato esperado do CSV:</p>
                {form.type === 'text' ? (
                  <p className="font-mono">telefone; nome (opcional); mensagem</p>
                ) : (() => {
                  const selectedTpl = templates.find((t) => t.name === form.templateName)
                  const varCount = selectedTpl?.variablesCount ?? 0
                  const cols = ['telefone', 'nome (opcional)', ...Array.from({ length: varCount }, (_, i) => `var${i + 1}`)].join('; ')
                  return (
                    <div className="space-y-1.5">
                      <p className="font-mono">{cols}</p>
                      {varCount > 0 && (
                        <p className="text-blue-700">
                          Template <strong>{form.templateName}</strong> usa {varCount} variável{varCount !== 1 ? 'is' : ''}: {Array.from({ length: varCount }, (_, i) => `{{${i + 1}}} → var${i + 1}`).join(', ')}
                        </p>
                      )}
                      {varCount > 0 && selectedTpl?.bodyText && (
                        <div className="rounded border border-blue-200 bg-white px-2 py-1.5 space-y-1">
                          <p className="font-medium text-blue-700">Texto do template — use como referência para preencher cada coluna:</p>
                          <p className="text-blue-900 whitespace-pre-wrap leading-relaxed">{selectedTpl.bodyText}</p>
                        </div>
                      )}
                    </div>
                  )
                })()}
                <div className="flex items-center justify-between pt-0.5">
                  <p className="text-blue-600">Máximo 1.000 linhas. Contatos novos serão criados automaticamente.</p>
                  <button
                    type="button"
                    className="ml-3 shrink-0 underline font-medium hover:text-blue-900"
                    onClick={() => {
                      const selectedTpl = templates.find((t) => t.name === form.templateName)
                      const varCount = form.type === 'template' ? (selectedTpl?.variablesCount ?? 0) : 0
                      const headers = form.type === 'text'
                        ? ['telefone', 'nome', 'mensagem']
                        : ['telefone', 'nome', ...Array.from({ length: varCount }, (_, i) => `var${i + 1}`)]
                      const example = form.type === 'text'
                        ? ['5561999990000', 'João Silva', 'Olá João, tudo bem?']
                        : ['5561999990000', 'João Silva', ...Array.from({ length: varCount }, (_, i) => `valor${i + 1}`)]
                      const csv = [headers.join(';'), example.join(';')].join('\n')
                      const blob = new Blob([csv], { type: 'text/csv' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `modelo_${form.templateName || 'broadcast'}.csv`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                  >
                    Baixar modelo
                  </button>
                </div>
              </div>

              {/* Aviso de variáveis incorretas */}
              {csvVarWarning && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
                  ⚠️ {csvVarWarning}
                </div>
              )}

              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                  const file = e.dataTransfer.files[0]
                  if (file) handleCsvFile(file)
                }}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer',
                  isDragging
                    ? 'border-green-500 bg-green-50'
                    : csvFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                )}
                onClick={() => document.getElementById('csv-file-input')?.click()}
              >
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleCsvFile(file)
                    e.target.value = ''
                  }}
                />
                {csvFile ? (
                  <>
                    <FileText className="h-8 w-8 text-green-600" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{csvFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(csvFile.size / 1024).toFixed(1)} KB · {csvPreview.length > 0 ? `${csvPreview.length}+ linhas pré-visualizadas` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCsvFile(null); setCsvPreview([]); setCsvHeaders([]); setCsvUploadResult(null) }}
                      className="text-xs text-red-500 hover:text-red-700 underline"
                    >
                      Remover arquivo
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">Arraste o CSV aqui ou clique para selecionar</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Apenas arquivos .csv</p>
                    </div>
                  </>
                )}
              </div>

              {/* Preview table */}
              {csvPreview.length > 0 && (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {csvHeaders.map((h, i) => (
                          <th key={i} className="px-3 py-2 text-left font-medium text-gray-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 text-gray-700 truncate max-w-[180px]">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="px-3 py-2 text-xs text-muted-foreground bg-gray-50 border-t">
                    Mostrando até 5 linhas de pré-visualização
                  </p>
                </div>
              )}

              {/* Upload result */}
              {csvUploadResult && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-green-700 font-medium">{csvUploadResult.added} adicionado(s)</span>
                    {csvUploadResult.skipped > 0 && (
                      <span className="text-muted-foreground">· {csvUploadResult.skipped} duplicado(s) ignorado(s)</span>
                    )}
                    {csvUploadResult.errors.length > 0 && (
                      <span className="text-red-600">· {csvUploadResult.errors.length} erro(s)</span>
                    )}
                  </div>
                  {csvUploadResult.errors.length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1 max-h-40 overflow-y-auto">
                      {csvUploadResult.errors.map((e, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-red-700">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span>Linha {e.row}{e.phone ? ` (${e.phone})` : ''}: {e.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setStep(0)}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button
              className="flex-1 gap-2"
              disabled={!step1Valid || addRecipientsMutation.isPending || addCsvMutation.isPending}
              onClick={handleStep1Continue}
            >
              {addRecipientsMutation.isPending || addCsvMutation.isPending ? 'Processando...' : 'Continuar'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2 — Revisar e enviar */}
      {step === 2 && broadcast && (
        <div className="rounded-xl border bg-white p-6 space-y-5">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium">{broadcast.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tipo</span>
              <span className="font-medium">
                {broadcast.type === 'text' ? 'Texto livre' : 'Template'}
              </span>
            </div>
            {broadcast.type === 'text' && broadcast.message && (
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                {broadcast.message}
              </div>
            )}
            {broadcast.type === 'template' && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Template</span>
                <span className="font-medium">{broadcast.templateName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Destinatários</span>
              <span className="font-medium">{broadcast.totalCount}</span>
            </div>
          </div>

          {broadcast.campaignPrompt && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 space-y-1">
              <div className="flex items-center gap-1.5">
                <BotMessageSquare className="h-3.5 w-3.5 text-orange-700" />
                <p className="text-xs font-medium text-orange-800">Prompt de campanha ativo</p>
              </div>
              <p className="text-xs text-orange-700 font-mono line-clamp-3">
                {broadcast.campaignPrompt}
              </p>
              <p className="text-xs text-orange-600">
                O bot usará este prompt por 72h após o envio.
              </p>
            </div>
          )}

          {intentRules.filter((r) => r.intent.trim() && r.tagId).length > 0 && (
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <TagIcon className="h-3.5 w-3.5 text-violet-700" />
                <p className="text-xs font-medium text-violet-800">Intenções de resposta configuradas</p>
              </div>
              {intentRules.filter((r) => r.intent.trim() && r.tagId).map((r, i) => {
                const tag = tags.find((t) => t.id === r.tagId)
                return (
                  <div key={i} className="flex items-center gap-2 text-xs text-violet-700">
                    <span className="flex-1 truncate">"{r.intent}"</span>
                    <span>→</span>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-white text-xs font-medium"
                      style={{ backgroundColor: tag?.color ?? '#8b5cf6' }}
                    >
                      {tag?.name ?? r.tagId}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            Após confirmar, o envio será iniciado imediatamente e não poderá ser desfeito.
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/broadcasts')}
            >
              Salvar rascunho
            </Button>
            <Button
              className="flex-1 gap-2"
              disabled={sendMutation.isPending}
              onClick={() => sendMutation.mutate()}
            >
              <Send className="h-4 w-4" />
              {sendMutation.isPending ? 'Enviando...' : 'Confirmar envio'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewBroadcastPage() {
  return (
    <Suspense>
      <NewBroadcastContent />
    </Suspense>
  )
}
