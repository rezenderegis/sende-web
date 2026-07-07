'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Send, BotMessageSquare, X, Search, ExternalLink } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { WhatsappNumber, Tag, Broadcast, WhatsappTemplate, CampaignPrompt } from '@/types'

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

  const [recipients, setRecipients] = useState<{ tagId?: string; contactIds?: string[] }>({})

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

  function handleStep1Continue() {
    const hasSelection = recipients.tagId || (recipients.contactIds && recipients.contactIds.length > 0)
    if (recipientsAdded && !hasSelection) {
      // Já adicionados antes, só avança
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

  const step0Valid =
    form.name.trim() &&
    form.whatsappNumberId &&
    (form.type === 'text' ? form.message.trim() : form.templateName.trim())

  const step1Valid =
    recipientsAdded ||
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
          <p className="text-sm text-muted-foreground">
            Escolha quem vai receber o broadcast. Você pode selecionar por tag ou digitar IDs de
            contatos.
          </p>

          {recipientsAdded && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              Destinatários já adicionados. Selecione novos para incluir mais, ou clique em Continuar.
            </div>
          )}

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
              disabled={!step1Valid || addRecipientsMutation.isPending}
              onClick={handleStep1Continue}
            >
              {addRecipientsMutation.isPending ? 'Adicionando...' : 'Continuar'}
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
