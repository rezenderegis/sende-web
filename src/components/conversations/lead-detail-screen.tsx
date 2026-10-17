'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, MessageSquare, Calendar, Plus, Phone, Users as UsersIcon,
  Send, CheckCircle2, Ban, Pencil, StickyNote,
} from 'lucide-react'
import api from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { formatPhone } from '@/lib/utils'
import EditFollowOnModal from '@/components/follow-ons/edit-follow-on-modal'
import type { KanbanLead, FollowOn, FollowOnType, User, WhatsappNumber, WhatsappTemplate } from '@/types'

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

// Cada tipo tem sua própria cor de destaque — mesma paleta usada na Agenda —
// pra dar pra identificar o tipo de atividade só pelo olhar, sem ler o texto.
const TYPE_STYLES: Record<string, { badge: string; icon: string; border: string }> = {
  meeting: { badge: 'bg-blue-50 text-blue-700', icon: 'bg-blue-100 text-blue-600', border: 'border-l-blue-400' },
  call: { badge: 'bg-teal-50 text-teal-700', icon: 'bg-teal-100 text-teal-600', border: 'border-l-teal-400' },
  message: { badge: 'bg-violet-50 text-violet-700', icon: 'bg-violet-100 text-violet-600', border: 'border-l-violet-400' },
  message_manual: { badge: 'bg-teal-50 text-teal-700', icon: 'bg-teal-100 text-teal-600', border: 'border-l-teal-400' },
  note: { badge: 'bg-amber-50 text-amber-700', icon: 'bg-amber-100 text-amber-600', border: 'border-l-amber-400' },
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
  done: 'bg-teal-100 text-teal-800 ring-1 ring-teal-200',
  cancelled: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
}

// Estado "selecionado" do seletor de tipo no formulário de agendar — cada
// tipo mantém a cor que já usa no resto da tela em vez de todo mundo ficar teal.
const TYPE_SELECTED_STYLES: Record<string, string> = {
  meeting: 'border-blue-400 bg-blue-50 text-blue-700',
  call: 'border-teal-400 bg-teal-50 text-teal-700',
  message: 'border-violet-400 bg-violet-50 text-violet-700',
  message_manual: 'border-teal-400 bg-teal-50 text-teal-700',
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
  const [tab, setTab] = useState<'info' | 'followups'>(lead.conversation ? 'followups' : 'info')
  const [editForm, setEditForm] = useState({ name: lead.name || '', email: lead.email || '', notes: lead.notes || '' })
  const [dirty, setDirty] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [editingFo, setEditingFo] = useState<FollowOn | null>(null)

  const defaultScheduledAt = toLocalDatetimeValue(new Date(Date.now() + 60 * 60000))
  const [foType, setFoType] = useState<FollowOnType>('call')
  const [foScheduledAt, setFoScheduledAt] = useState(defaultScheduledAt)
  const [foNote, setFoNote] = useState('')
  const [foAssignedUserId, setFoAssignedUserId] = useState('')
  const [foNumberId, setFoNumberId] = useState('')
  const [foTemplateKey, setFoTemplateKey] = useState('')
  const [foTemplateVars, setFoTemplateVars] = useState<string[]>([])

  const [showStartConv, setShowStartConv] = useState(false)
  const [convNumberId, setConvNumberId] = useState('')
  const [convTemplateKey, setConvTemplateKey] = useState('')
  const [convTemplateVars, setConvTemplateVars] = useState<string[]>([])

  function setField(field: 'name' | 'email' | 'notes', value: string) {
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
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban-leads'] })
      setDirty(false)
      toast({ title: 'Lead atualizado', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao atualizar', description: err.response?.data?.message, variant: 'destructive' }),
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
    setFoNote('')
    setFoAssignedUserId('')
    setFoNumberId('')
    setFoTemplateKey('')
    setFoTemplateVars([])
  }

  function handleCreate() {
    const dto: any = {
      contactId: lead.id,
      type: foType,
      scheduledAt: new Date(foScheduledAt).toISOString(),
      ...(foNote.trim() ? { note: foNote.trim() } : {}),
      ...(foAssignedUserId ? { assignedUserId: foAssignedUserId } : {}),
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
      <div className="flex items-center justify-between border-b px-7 py-5">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-lg font-semibold text-gray-600">
            {lead.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-teal-900">{lead.name}</h2>
            <p className="text-sm text-muted-foreground">{formatPhone(lead.phone)}</p>
          </div>
        </div>
        {lead.conversation && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => router.push(`/conversations/${lead.conversation!.id}`)}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Conversa
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b px-7">
        <button
          onClick={() => setTab('followups')}
          className={cn('flex items-center gap-1.5 px-5 py-3 text-sm font-medium transition-colors border-b-2',
            tab === 'followups' ? 'border-teal-600 text-teal-700' : 'border-transparent text-muted-foreground hover:text-gray-700')}
        >
          <Calendar className="h-3.5 w-3.5" />
          Follow-ons
          {followOns.length > 0 && <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{followOns.length}</span>}
        </button>
        <button
          onClick={() => setTab('info')}
          className={cn('px-5 py-3 text-sm font-medium transition-colors border-b-2',
            tab === 'info' ? 'border-teal-600 text-teal-700' : 'border-transparent text-muted-foreground hover:text-gray-700')}
        >
          Informações
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl p-7">
          {tab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Nome</label>
                  <Input value={editForm.name} onChange={(e) => setField('name', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">E-mail</label>
                  <Input type="email" value={editForm.email} onChange={(e) => setField('email', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Notas</label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-600 resize-none"
                />
              </div>
              {!lead.conversation && (
                <div className="rounded-xl border border-teal-100 bg-teal-50 p-4">
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

              {(lead.tags ?? []).length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-700">Tags</p>
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
            </div>
          )}

          {tab === 'followups' && (
            <div className="space-y-3">
              {!showForm && !showNoteForm && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800"
                    onClick={() => setShowForm(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agendar follow-on
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                    onClick={() => setShowNoteForm(true)}
                  >
                    <StickyNote className="h-3.5 w-3.5" />
                    Adicionar anotação
                  </Button>
                </div>
              )}

              {showNoteForm && (
                <div className="space-y-2.5 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                    <StickyNote className="h-3.5 w-3.5" />
                    Anotação
                  </label>
                  <textarea
                    autoFocus
                    rows={3}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Ex: Cliente pediu orçamento por e-mail, disse que decide até sexta"
                    className="w-full resize-none rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <p className="text-xs text-amber-700/80">
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
                <div className="space-y-3 rounded-xl border border-teal-200 bg-teal-50/40 p-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">Tipo</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['call', 'meeting', 'message_manual', 'message'] as FollowOnType[]).map((value) => (
                        <button
                          key={value}
                          onClick={() => setFoType(value)}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-colors text-left',
                            foType === value ? TYPE_SELECTED_STYLES[value] : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
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
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">Data e hora</label>
                    <input
                      type="datetime-local"
                      value={foScheduledAt}
                      onChange={(e) => setFoScheduledAt(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">Nota <span className="text-gray-400">(opcional)</span></label>
                    <input
                      type="text"
                      value={foNote}
                      onChange={(e) => setFoNote(e.target.value)}
                      placeholder="Ex: Ligar depois das 18h"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-teal-500"
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
                        'flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 shadow-sm border-l-4 transition-colors hover:border-gray-300',
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
                        <p className="mt-1.5 text-xs font-medium text-gray-900">{followOnLabel(fo)}</p>
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
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          title="Editar / anotar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {fo.status === 'pending' && (
                          <>
                            <button
                              onClick={() => completeMutation.mutate(fo.id)}
                              className="rounded-md p-1.5 text-gray-400 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                              title="Marcar como concluído"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => cancelMutation.mutate(fo.id)}
                              className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
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
          )}
        </div>
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
