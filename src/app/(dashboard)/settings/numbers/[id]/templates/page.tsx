'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw, CheckCircle2, Clock, XCircle, Plus, X } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  const [bodyExamples, setBodyExamples] = useState<string[]>([])
  const [headerExample, setHeaderExample] = useState('')

  const bodyVarCount = new Set(bodyText.match(/\{\{\d+\}\}/g) ?? []).size
  const headerHasVar = /\{\{\d+\}\}/.test(headerText)

  const createMutation = useMutation({
    mutationFn: () => api.post(`/whatsapp/numbers/${numberId}/templates`, {
      name: name.trim(),
      language,
      category,
      headerText: headerText.trim() || undefined,
      bodyText: bodyText.trim(),
      footerText: footerText.trim() || undefined,
      bodyExamples: bodyVarCount > 0 ? bodyExamples.slice(0, bodyVarCount) : undefined,
      headerExample: headerHasVar ? headerExample.trim() || undefined : undefined,
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
  const bodyExamplesFilled = bodyVarCount === 0 || bodyExamples.slice(0, bodyVarCount).every((v) => v?.trim())
  const headerExampleFilled = !headerHasVar || headerExample.trim().length > 0
  const isValid = /^[a-z0-9_]+$/.test(name) && bodyText.trim().length > 0 && !hasEmptyPlaceholder && bodyExamplesFilled && headerExampleFilled

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
            {headerHasVar && (
              <div className="mt-2">
                <label className="mb-1 block text-[11px] text-gray-500">Exemplo pra variável do cabeçalho</label>
                <Input value={headerExample} onChange={(e) => setHeaderExample(e.target.value)} placeholder="João" className="h-8 text-xs" />
              </div>
            )}
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
            {bodyVarCount > 0 && (
              <div className="mt-2 space-y-1.5 rounded-md bg-gray-50 p-2.5">
                <p className="text-[11px] font-medium text-gray-600">
                  A Meta exige um valor de exemplo pra cada variável:
                </p>
                {Array.from({ length: bodyVarCount }, (_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-9 shrink-0 text-[11px] text-gray-500">{`{{${i + 1}}}`}</span>
                    <Input
                      value={bodyExamples[i] ?? ''}
                      onChange={(e) => setBodyExamples((v) => { const next = [...v]; next[i] = e.target.value; return next })}
                      placeholder={`Exemplo pra {{${i + 1}}}`}
                      className="h-8 flex-1 text-xs"
                    />
                  </div>
                ))}
              </div>
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

const templateStatusConfig: Record<string, { label: string; icon: any; color: string; badge: string }> = {
  APPROVED:  { label: 'Aprovado',  icon: CheckCircle2, color: 'text-teal-500', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
  PENDING:   { label: 'Pendente',  icon: Clock,        color: 'text-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  REJECTED:  { label: 'Rejeitado', icon: XCircle,      color: 'text-red-500', badge: 'bg-red-50 text-red-700 border-red-200' },
}

const rejectedReasonLabels: Record<string, string> = {
  ABUSIVE_CONTENT: 'Conteúdo considerado abusivo/spam',
  INVALID_FORMAT: 'Formato inválido (variáveis ou estrutura incorreta)',
  PROMOTIONAL: 'Conteúdo promocional não permitido pra essa categoria',
  TAG_CONTENT_MISMATCH: 'Categoria não bate com o conteúdo (ex: marcado como Utility mas é Marketing)',
  INCORRECT_CATEGORY: 'Categoria incorreta',
  SCAM: 'Identificado como possível golpe',
}

export default function NumberTemplatesPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const isOwner = user?.role === 'owner'

  const [createTemplateOpen, setCreateTemplateOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'APPROVED' | 'PENDING' | 'REJECTED'>('all')

  const { data: numbers } = useQuery<WhatsappNumber[]>({
    queryKey: ['whatsapp-numbers'],
    queryFn: () => api.get('/whatsapp/numbers').then((r) => r.data),
  })

  const num = numbers?.find((n) => n.id === id)

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

  const filtered = statusFilter === 'all' ? templates : templates.filter((t) => t.status === statusFilter)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b bg-white px-6 py-4">
        <button
          onClick={() => router.push(`/settings/numbers/${id}`)}
          className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para {num?.displayName ?? 'o número'}
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-semibold text-teal-900">Templates WhatsApp</h1>
            <p className="text-xs text-muted-foreground">
              {num ? `${num.displayName} · ${num.phoneNumber}` : 'Templates aprovados pela Meta para envios em massa'}
            </p>
          </div>
          <div className="flex gap-2">
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
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Filters */}
        <div className="mb-4 flex items-center gap-2">
          {(['all', 'APPROVED', 'PENDING', 'REJECTED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                statusFilter === s
                  ? 'border-teal-600 bg-teal-600 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-teal-300 hover:text-teal-700',
              )}
            >
              {s === 'all' ? 'Todos' : templateStatusConfig[s].label}
              {s !== 'all' && ` (${templates.filter((t) => t.status === s).length})`}
            </button>
          ))}
        </div>

        {templatesLoading && (
          <p className="text-sm text-muted-foreground">Carregando templates...</p>
        )}

        {!templatesLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-white py-16 text-muted-foreground">
            <p className="text-sm">Nenhum template encontrado</p>
            <Button size="sm" variant="outline" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
              Sincronizar com a Meta
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tpl) => {
            const cfg = templateStatusConfig[tpl.status] ?? { label: tpl.status, icon: Clock, color: 'text-gray-400', badge: 'bg-gray-50 text-gray-600 border-gray-200' }
            const Icon = cfg.icon
            return (
              <div key={tpl.id} className="rounded-xl border bg-white p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900 truncate">{tpl.name}</span>
                  <span className={cn('flex items-center gap-1 shrink-0 rounded-full border px-2 py-0.5 text-xs', cfg.badge)}>
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </span>
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
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{tpl.bodyText}</p>
                )}
                {tpl.status === 'REJECTED' && tpl.rejectedReason && (
                  <p className="rounded bg-red-50 px-2.5 py-1.5 text-xs text-red-600 leading-relaxed">
                    Motivo: {rejectedReasonLabels[tpl.rejectedReason] ?? tpl.rejectedReason}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {createTemplateOpen && (
        <CreateTemplateModal numberId={id} onClose={() => setCreateTemplateOpen(false)} />
      )}
    </div>
  )
}
