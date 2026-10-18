'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, MessageSquare, Calendar, Plus, Phone, Users as UsersIcon,
  Send, CheckCircle2, Ban, Pencil, StickyNote, XCircle, RotateCcw,
} from 'lucide-react'
import api from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { formatPhone } from '@/lib/utils'
import EditFollowOnModal from '@/components/follow-ons/edit-follow-on-modal'
import type { ActivityType, KanbanLead, FollowOn, FollowOnType, User, WhatsappNumber, WhatsappTemplate } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  meeting: 'Reunião',
  call: 'Ligação',
  message: 'Envio automático',
  message_manual: 'Mensagem',
  note: 'Anotação',
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  meeting: <UsersIcon className="h-3.5 w-3.5" />,
  call: <Phone className="h-3.5 w-3.5" />,
  message: <Send className="h-3.5 w-3.5" />,
  message_manual: <MessageSquare className="h-3.5 w-3.5" />,
  note: <StickyNote className="h-3.5 w-3.5" />,
}

// Cada tipo tem sua própria cor de destaque — mesma paleta usada na Agenda.
// Tons fortes (não pastel) e paleta escolhida pra ficar distinguível mesmo
// com daltonismo (azul/laranja/verde/âmbar são bem separados nos eixos de
// confusão comuns) — além disso cada tipo sempre tem ícone + texto junto,
// nunca só a cor, pra não depender de enxergar a diferença de matiz.
const TYPE_STYLES: Record<string, { badge: string; icon: string; border: string }> = {
  meeting: { badge: 'bg-blue-100 text-blue-800 ring-1 ring-blue-300', icon: 'bg-blue-600 text-white', border: 'border-l-blue-600' },
  call: { badge: 'bg-teal-100 text-teal-800 ring-1 ring-teal-300', icon: 'bg-teal-600 text-white', border: 'border-l-teal-600' },
  message: { badge: 'bg-orange-100 text-orange-800 ring-1 ring-orange-300', icon: 'bg-orange-600 text-white', border: 'border-l-orange-600' },
  message_manual: { badge: 'bg-teal-100 text-teal-800 ring-1 ring-teal-300', icon: 'bg-teal-600 text-white', border: 'border-l-teal-600' },
  note: { badge: 'bg-amber-100 text-amber-900 ring-1 ring-amber-300', icon: 'bg-amber-500 text-white', border: 'border-l-amber-500' },
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-200 text-amber-900 ring-1 ring-amber-400',
  done: 'bg-teal-200 text-teal-900 ring-1 ring-teal-400',
  cancelled: 'bg-gray-200 text-gray-700 ring-1 ring-gray-400',
}

// Estado "selecionado" do seletor de tipo no formulário de agendar — cada
// tipo mantém a cor que já usa no resto da tela em vez de todo mundo ficar teal.
const TYPE_SELECTED_STYLES: Record<string, string> = {
  meeting: 'border-blue-600 bg-blue-100 text-blue-800',
  call: 'border-teal-600 bg-teal-100 text-teal-800',
  message: 'border-orange-600 bg-orange-100 text-orange-800',
  message_manual: 'border-teal-600 bg-teal-100 text-teal-800',
}

function followOnLabel(fo: FollowOn): string {
  const d = new Date(fo.scheduledAt)
  const today = new Date()
  const label = TYPE_LABELS[fo.type] ?? fo.type
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === today.toDateString()) return `${label} · Hoje ${time}`
  return `${label} · ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} ${time}`
}

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

interface Props {
  lead: KanbanLead
  onBack: () => void
}

/**
 * Tela cheia de detalhe do lead — deixou de ser popup porque essa tela vai
 * crescer com cada vez mais dados (histórico, notas, campos de CRM).
 */
export default function LeadDetailScreen({ lead, onBack }: Props) {
  const router = useRouter()
  const qc = useQueryClient()
  const [editForm, setEditForm] = useState({
    name: lead.name || '',
    email: lead.email || '',
    notes: lead.notes || '',
    dealValue: lead.dealValue != null ? String(lead.dealValue) : '',
    dealOwnerId: lead.dealOwnerId || '',
  })
  const [dirty, setDirty] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [editingFo, setEditingFo] = useState<FollowOn | null>(null)
  const [showLostForm, setShowLostForm] = useState(false)
  const [lostReason, setLostReason] = useState('')

  const defaultScheduledAt = toLocalDatetimeValue(new Date(Date.now() + 60 * 60000))
  const [foType, setFoType] = useState<FollowOnType>('call')
  const [foScheduledAt, setFoScheduledAt] = useState(defaultScheduledAt)
  const [foTitle, setFoTitle] = useState('')
  const [foNote, setFoNote] = useState('')
  const [foAssignedUserId, setFoAssignedUserId] = useState('')
  const [foActivityTypeId, setFoActivityTypeId] = useState('')
  const [foNumberId, setFoNumberId] = useState('')
  const [foTemplateKey, setFoTemplateKey] = useState('')
  const [foTemplateVars, setFoTemplateVars] = useState<string[]>([])

  const [showStartConv, setShowStartConv] = useState(false)
  const [convNumberId, setConvNumberId] = useState('')
  const [convTemplateKey, setConvTemplateKey] = useState('')
  const [convTemplateVars, setConvTemplateVars] = useState<string[]>([])

  function setField(field: 'name' | 'email' | 'notes' | 'dealValue' | 'dealOwnerId', value: string) {
    setEditForm((f) => ({ ...f, [field]: value }))
    setDirty(true)
  }

  const followOnsKey = ['follow-ons-contact', lead.id]
  const invalidateFollowOns = () => qc.invalidateQueries({ queryKey: followOnsKey })

  const { data: followOns = [], isLoading } = useQuery<FollowOn[]>({
    queryKey: followOnsKey,
    queryFn: () => api.get(`/follow-ons/contact/${lead.id}`).then((r) => r.data),
  })

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  })

  const { data: numbers = [] } = useQuery<WhatsappNumber[]>({
    queryKey: ['whatsapp-numbers'],
    queryFn: () => api.get('/whatsapp/numbers').then((r) => r.data),
  })

  const { data: activityTypes = [] } = useQuery<ActivityType[]>({
    queryKey: ['activity-types'],
    queryFn: () => api.get('/activity-types').then((r) => r.data),
  })

  const { data: templates = [] } = useQuery<WhatsappTemplate[]>({
    queryKey: ['whatsapp-templates', foNumberId],
    queryFn: () => api.get(`/whatsapp/numbers/${foNumberId}/templates`).then((r) => r.data),
    enabled: !!foNumberId && foType === 'message',
  })
  const approvedTemplates = templates.filter((t) => t.status === 'APPROVED')
  const selectedTpl = approvedTemplates.find((t) => `${t.name}|${t.language}` === foTemplateKey) ?? null

  const { data: convTemplates = [] } = useQuery<WhatsappTemplate[]>({
    queryKey: ['whatsapp-templates', convNumberId],
    queryFn: () => api.get(`/whatsapp/numbers/${convNumberId}/templates`).then((r) => r.data),
    enabled: !!convNumberId,
  })
  const convApprovedTemplates = convTemplates.filter((t) => t.status === 'APPROVED')
  const convSelectedTpl = convApprovedTemplates.find((t) => `${t.name}|${t.language}` === convTemplateKey) ?? null

  const startConversationMutation = useMutation({
    mutationFn: () => {
      const [templateName, templateLanguage] = convTemplateKey.split('|')
      return api.post('/whatsapp/messages/send', {
        whatsappNumberId: convNumberId,
        to: lead.phone,
        type: 'template',
        templateName,
        templateLanguage,
        ...(convTemplateVars.length > 0 ? { templateVariables: convTemplateVars } : {}),
      })
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['kanban-leads'] })
      const conversationId = res.data?.conversationId
      toast({ title: 'Conversa iniciada', variant: 'success' })
      if (conversationId) router.push(`/conversations/${conversationId}`)
    },
    onError: (err: any) => toast({ title: 'Erro ao iniciar conversa', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: () => api.patch(`/contacts/${lead.id}`, {
      name: editForm.name.trim() || undefined,
      email: editForm.email.trim() || null,
      notes: editForm.notes.trim() || null,
      dealValue: editForm.dealValue.trim() ? Number(editForm.dealValue.replace(',', '.')) : null,
      dealOwnerId: editForm.dealOwnerId || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban-leads'] })
      qc.invalidateQueries({ queryKey: ['kanban-leads-lost'] })
      setDirty(false)
      toast({ title: 'Lead atualizado', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao atualizar', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const markLostMutation = useMutation({
    mutationFn: () => api.patch(`/contacts/${lead.id}/lost`, { reason: lostReason.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban-leads'] })
      qc.invalidateQueries({ queryKey: ['kanban-leads-lost'] })
      setShowLostForm(false)
      toast({ title: 'Lead marcado como perdido', variant: 'success' })
      onBack()
    },
    onError: (err: any) => toast({ title: 'Erro ao marcar como perdido', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const reopenMutation = useMutation({
    mutationFn: () => api.patch(`/contacts/${lead.id}/reopen`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban-leads'] })
      qc.invalidateQueries({ queryKey: ['kanban-leads-lost'] })
      toast({ title: 'Lead reaberto', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao reabrir', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const createFollowOnMutation = useMutation({
    mutationFn: (dto: any) => api.post('/follow-ons', dto),
    onSuccess: () => {
      invalidateFollowOns()
      setShowForm(false)
      resetForm()
      toast({ title: 'Follow-on agendado', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao agendar', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const createNoteMutation = useMutation({
    mutationFn: () => api.post('/follow-ons', { contactId: lead.id, type: 'note', note: noteText.trim() }),
    onSuccess: () => {
      invalidateFollowOns()
      setShowNoteForm(false)
      setNoteText('')
      toast({ title: 'Anotação registrada', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao registrar anotação', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/follow-ons/${id}/cancel`),
    onSuccess: () => {
      invalidateFollowOns()
      toast({ title: 'Follow-on cancelado', variant: 'success' })
    },
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/follow-ons/${id}/complete`),
    onSuccess: () => {
      invalidateFollowOns()
      toast({ title: 'Marcado como concluído', variant: 'success' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/follow-ons/${id}`),
    onSuccess: () => {
      invalidateFollowOns()
      toast({ title: 'Follow-on removido', variant: 'success' })
    },
  })

  function resetForm() {
    setFoType('call')
    setFoScheduledAt(toLocalDatetimeValue(new Date(Date.now() + 60 * 60000)))
    setFoTitle('')
    setFoNote('')
    setFoAssignedUserId('')
    setFoActivityTypeId('')
    setFoNumberId('')
    setFoTemplateKey('')
    setFoTemplateVars([])
  }

  function handleCreate() {
    const dto: any = {
      contactId: lead.id,
      type: foType,
      scheduledAt: new Date(foScheduledAt).toISOString(),
      ...(foTitle.trim() ? { title: foTitle.trim() } : {}),
      ...(foNote.trim() ? { note: foNote.trim() } : {}),
      ...(foAssignedUserId ? { assignedUserId: foAssignedUserId } : {}),
      ...(foActivityTypeId ? { activityTypeId: foActivityTypeId } : {}),
    }
    if (foType === 'message') {
      const [templateName, templateLanguage] = foTemplateKey.split('|')
      dto.whatsappNumberId = foNumberId
      dto.templateName = templateName
      dto.templateLanguage = templateLanguage
      if (foTemplateVars.length > 0) dto.templateVariables = foTemplateVars
    }
    createFollowOnMutation.mutate(dto)
  }

  const foIsValid = foType !== 'message' || (!!foNumberId && !!foTemplateKey)

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b-2 border-gray-200 bg-white px-4 py-4 md:px-7 md:py-5">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <button onClick={onBack} className="shrink-0 rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-700 text-base font-semibold text-white md:h-14 md:w-14 md:text-lg">
            {lead.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-teal-900 md:text-xl">{lead.name}</h2>
            <p className="text-xs text-gray-600 md:text-sm">{formatPhone(lead.phone)}</p>
          </div>
        </div>
        {lead.conversation && (
          <Button
            size="sm"
            className="shrink-0 gap-1.5 bg-teal-700 text-white hover:bg-teal-800"
            onClick={() => router.push(`/conversations/${lead.conversation!.id}`)}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Conversa</span>
          </Button>
        )}
      </div>

      {/* Corpo: no desktop, coluna fixa de dados à esquerda + timeline à direita
          (padrão HubSpot/Pipedrive); no celular empilha — dados em cima,
          atividades embaixo — porque lado a lado não cabe numa tela estreita. */}
      <div className="flex flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
        <aside className="w-full shrink-0 border-b-2 border-gray-200 bg-white p-5 space-y-5 md:h-full md:w-80 md:overflow-y-auto md:border-b-0 md:border-r-2 md:p-6">
          {lead.lostAt && (
            <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-red-800">
                <XCircle className="h-3.5 w-3.5" />
                Lead perdido
              </p>
              {lead.lostReason && <p className="text-sm text-red-900">{lead.lostReason}</p>}
              <p className="text-xs text-red-700/70">
                {new Date(lead.lostAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5 bg-white"
                disabled={reopenMutation.isPending}
                onClick={() => reopenMutation.mutate()}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {reopenMutation.isPending ? 'Reabrindo...' : 'Reabrir lead'}
              </Button>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Nome</label>
            <Input value={editForm.name} onChange={(e) => setField('name', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">E-mail</label>
            <Input type="email" value={editForm.email} onChange={(e) => setField('email', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Notas</label>
            <textarea
              rows={4}
              value={editForm.notes}
              onChange={(e) => setField('notes', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-600 resize-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Valor do negócio</label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="R$ 0,00"
              value={editForm.dealValue}
              onChange={(e) => setField('dealValue', e.target.value.replace(/[^\d.,]/g, ''))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Dono do negócio</label>
            <Select value={editForm.dealOwnerId || '__none__'} onValueChange={(v) => setField('dealOwnerId', v === '__none__' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Ninguém" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Ninguém</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(lead.tags ?? []).length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-700">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {lead.tags!.map((tag) => (
                  <span key={tag.id} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: tag.color }}>
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {dirty && (
            <Button className="w-full" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
              {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          )}

          {!lead.conversation && (
            <div className="rounded-xl border-2 border-teal-300 bg-teal-50 p-4">
              {!showStartConv ? (
                <Button size="sm" variant="outline" className="w-full gap-1.5 bg-white" onClick={() => setShowStartConv(true)}>
                  <Send className="h-3.5 w-3.5" />
                  Iniciar conversa
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-teal-800">Iniciar conversa com template</p>
                  <Select value={convNumberId} onValueChange={(v) => { setConvNumberId(v); setConvTemplateKey(''); setConvTemplateVars([]) }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o número..." />
                    </SelectTrigger>
                    <SelectContent>
                      {numbers.map((n) => (
                        <SelectItem key={n.id} value={n.id}>{n.displayName} · {n.phoneNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {convNumberId && (
                    <Select value={convTemplateKey} onValueChange={(v) => {
                      setConvTemplateKey(v)
                      const tpl = convApprovedTemplates.find((t) => `${t.name}|${t.language}` === v)
                      setConvTemplateVars(Array(tpl?.variablesCount ?? 0).fill(''))
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {convApprovedTemplates.map((t) => (
                          <SelectItem key={t.id} value={`${t.name}|${t.language}`}>{t.name} ({t.language})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {convSelectedTpl && (convSelectedTpl.variablesCount ?? 0) > 0 && (
                    <div className="space-y-1.5">
                      {Array.from({ length: convSelectedTpl.variablesCount! }, (_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="shrink-0 rounded bg-white px-2 py-1 text-xs font-mono text-gray-500">{`{{${i + 1}}}`}</span>
                          <input
                            type="text"
                            placeholder={`Valor para {{${i + 1}}}`}
                            value={convTemplateVars[i] ?? ''}
                            onChange={(e) => setConvTemplateVars((v) => { const next = [...v]; next[i] = e.target.value; return next })}
                            className="flex-1 rounded-md border bg-white px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 bg-white" onClick={() => setShowStartConv(false)}>Cancelar</Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={!convNumberId || !convTemplateKey || startConversationMutation.isPending}
                      onClick={() => startConversationMutation.mutate()}
                    >
                      {startConversationMutation.isPending ? 'Enviando...' : 'Enviar e iniciar'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!lead.lostAt && (
            <div>
              {!showLostForm ? (
                <button
                  onClick={() => setShowLostForm(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-gray-200 py-2.5 text-xs font-medium text-gray-500 hover:border-red-300 hover:text-red-600 transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Marcar como perdido
                </button>
              ) : (
                <div className="space-y-2 rounded-xl border-2 border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-semibold text-red-800">Por que esse negócio foi perdido?</p>
                  <textarea
                    autoFocus
                    rows={2}
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                    placeholder="Ex: Preço alto, escolheu concorrente, sumiu..."
                    className="w-full resize-none rounded-lg border-2 border-red-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 bg-white" onClick={() => { setShowLostForm(false); setLostReason('') }}>Cancelar</Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      disabled={!lostReason.trim() || markLostMutation.isPending}
                      onClick={() => markLostMutation.mutate()}
                    >
                      {markLostMutation.isPending ? 'Salvando...' : 'Confirmar perda'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        <main className="flex-1 bg-gray-100 md:overflow-y-auto">
          <div className="mx-auto max-w-2xl p-4 md:p-7">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-800">Atividades</h3>
              {followOns.length > 0 && <span className="rounded-full bg-gray-300 px-1.5 py-0.5 text-xs font-medium text-gray-800">{followOns.length}</span>}
            </div>
            <div className="space-y-3">
              {!showForm && !showNoteForm && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 border-2 border-teal-700 bg-teal-700 text-white hover:bg-teal-800"
                    onClick={() => setShowForm(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agendar follow-on
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 border-2 border-amber-600 bg-amber-500 text-white hover:bg-amber-600"
                    onClick={() => setShowNoteForm(true)}
                  >
                    <StickyNote className="h-3.5 w-3.5" />
                    Adicionar anotação
                  </Button>
                </div>
              )}

              {showNoteForm && (
                <div className="space-y-2.5 rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                    <StickyNote className="h-3.5 w-3.5" />
                    Anotação
                  </label>
                  <textarea
                    autoFocus
                    rows={3}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Ex: Cliente pediu orçamento por e-mail, disse que decide até sexta"
                    className="w-full resize-none rounded-lg border-2 border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-xs text-amber-900/70">
                    Registrada na hora, sem agendamento — fica no histórico junto com as outras atividades.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 bg-white" onClick={() => { setShowNoteForm(false); setNoteText('') }}>Cancelar</Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                      disabled={!noteText.trim() || createNoteMutation.isPending}
                      onClick={() => createNoteMutation.mutate()}
                    >
                      {createNoteMutation.isPending ? 'Salvando...' : 'Salvar anotação'}
                    </Button>
                  </div>
                </div>
              )}

              {showForm && (
                <div className="space-y-3 rounded-xl border-2 border-teal-400 bg-teal-50 p-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">Tipo</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['call', 'meeting', 'message_manual', 'message'] as FollowOnType[]).map((value) => (
                        <button
                          key={value}
                          onClick={() => setFoType(value)}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-colors text-left',
                            foType === value ? TYPE_SELECTED_STYLES[value] : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
                          )}
                        >
                          {TYPE_ICONS[value]}
                          {TYPE_LABELS[value]}
                        </button>
                      ))}
                    </div>
                    {foType === 'message_manual' && (
                      <p className="mt-1.5 text-xs text-muted-foreground">Lembrete pra você enviar manualmente — nada é disparado automaticamente.</p>
                    )}
                    {foType === 'message' && (
                      <p className="mt-1.5 text-xs text-muted-foreground">Envio automático por template — sem conversa aberta, só template aprovado garante entrega.</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">Atividade (meta) <span className="text-gray-400">(opcional)</span></label>
                    <select
                      value={foActivityTypeId}
                      onChange={(e) => setFoActivityTypeId(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="">Padrão (conforme o tipo)</option>
                      {activityTypes.filter((t) => t.isActive).map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">Data e hora</label>
                    <input
                      type="datetime-local"
                      value={foScheduledAt}
                      onChange={(e) => setFoScheduledAt(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">Título <span className="text-gray-400">(opcional)</span></label>
                    <input
                      type="text"
                      value={foTitle}
                      onChange={(e) => setFoTitle(e.target.value)}
                      placeholder="Ex: Reunião de parceria"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">Descrição <span className="text-gray-400">(opcional)</span></label>
                    <textarea
                      rows={2}
                      value={foNote}
                      onChange={(e) => setFoNote(e.target.value)}
                      placeholder="Ex: Ligar depois das 18h"
                      className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">Atribuir a <span className="text-gray-400">(opcional)</span></label>
                    <select
                      value={foAssignedUserId}
                      onChange={(e) => setFoAssignedUserId(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="">Ninguém</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  {foType === 'message' && (
                    <div className="space-y-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700">Número de WhatsApp</label>
                        <Select value={foNumberId} onValueChange={(v) => { setFoNumberId(v); setFoTemplateKey('') }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o número..." />
                          </SelectTrigger>
                          <SelectContent>
                            {numbers.map((n) => (
                              <SelectItem key={n.id} value={n.id}>{n.displayName} · {n.phoneNumber}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {foNumberId && (
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-gray-700">Template</label>
                          <Select value={foTemplateKey} onValueChange={(v) => {
                            setFoTemplateKey(v)
                            const tpl = approvedTemplates.find((t) => `${t.name}|${t.language}` === v)
                            setFoTemplateVars(Array(tpl?.variablesCount ?? 0).fill(''))
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um template..." />
                            </SelectTrigger>
                            <SelectContent>
                              {approvedTemplates.map((t) => (
                                <SelectItem key={t.id} value={`${t.name}|${t.language}`}>
                                  {t.name} <span className="text-xs text-muted-foreground">{t.language}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {selectedTpl && (selectedTpl.variablesCount ?? 0) > 0 && (
                        <div className="space-y-1.5">
                          {Array.from({ length: selectedTpl.variablesCount! }, (_, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="shrink-0 rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-500">{`{{${i + 1}}}`}</span>
                              <input
                                type="text"
                                placeholder={`Valor para {{${i + 1}}}`}
                                value={foTemplateVars[i] ?? ''}
                                onChange={(e) => setFoTemplateVars((v) => { const next = [...v]; next[i] = e.target.value; return next })}
                                className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setShowForm(false); resetForm() }}>Cancelar</Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={!foIsValid || createFollowOnMutation.isPending}
                      onClick={handleCreate}
                    >
                      {createFollowOnMutation.isPending ? 'Agendando...' : 'Agendar'}
                    </Button>
                  </div>
                </div>
              )}

              {isLoading && <p className="text-center text-sm text-muted-foreground py-4">Carregando...</p>}
              {!isLoading && followOns.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">Nenhum follow-on registrado pra essa pessoa ainda.</p>
              )}
              <div className="space-y-2">
                {followOns.map((fo) => {
                  const style = TYPE_STYLES[fo.type] ?? TYPE_STYLES.call
                  return (
                    <div
                      key={fo.id}
                      className={cn(
                        'flex items-start gap-3 rounded-lg border-2 border-gray-300 bg-white px-3 py-3 shadow-sm border-l-[6px] transition-colors hover:border-gray-400',
                        style.border,
                      )}
                    >
                      <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', style.icon)}>
                        {TYPE_ICONS[fo.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', style.badge)}>
                            {TYPE_LABELS[fo.type] ?? fo.type}
                          </span>
                          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', STATUS_STYLES[fo.status])}>
                            {fo.status === 'pending' ? 'Pendente' : fo.status === 'done' ? 'Concluído' : 'Cancelado'}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[11px] font-medium text-gray-500">{followOnLabel(fo)}</p>
                        {fo.title && <p className="mt-0.5 text-sm font-semibold text-gray-900">{fo.title}</p>}
                        {fo.note && <p className="mt-0.5 text-xs text-gray-600">{fo.note}</p>}
                        {fo.type === 'message' && (fo.message || fo.templateName) && (
                          <p className="mt-0.5 text-xs text-muted-foreground font-mono truncate">
                            {fo.templateName ? `Template: ${fo.templateName}` : fo.message}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => setEditingFo(fo)}
                          className="rounded-md border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                          title="Editar / anotar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {fo.status === 'pending' && (
                          <>
                            <button
                              onClick={() => completeMutation.mutate(fo.id)}
                              className="rounded-md border border-teal-300 p-1.5 text-teal-700 hover:bg-teal-100 transition-colors"
                              title="Marcar como concluído"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => cancelMutation.mutate(fo.id)}
                              className="rounded-md border border-red-300 p-1.5 text-red-600 hover:bg-red-100 transition-colors"
                              title="Cancelar"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </main>
      </div>

      {editingFo && (
        <EditFollowOnModal
          fo={editingFo}
          users={users}
          onClose={() => setEditingFo(null)}
          onDelete={(id) => deleteMutation.mutate(id)}
          onSaved={invalidateFollowOns}
        />
      )}
    </div>
  )
}
