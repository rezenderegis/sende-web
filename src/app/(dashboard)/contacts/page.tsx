'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Search, MessageSquare, FileSpreadsheet, Upload, X, Plus, Check, Filter, Square, CheckSquare, Tag as TagIcon, ChevronDown, ShoppingBag, Cake, CheckCircle2, Clock, Pencil, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TagSelector } from '@/components/tags/tag-selector'
import { formatPhone, formatDate, cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { ProductPicker } from '@/components/sales/product-picker'
import type { Broadcast, Contact, ContactProductSetting, Product, Sale, Tag } from '@/types'

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
]

function ImportModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [tagSearch, setTagSearch] = useState('')
  const [tagOpen, setTagOpen] = useState(false)
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
  const [creating, setCreating] = useState(false)
  const [newColor, setNewColor] = useState(COLORS[3])

  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: () => api.get('/tags').then((r) => r.data),
  })

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTagOpen(false)
        setCreating(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const importMutation = useMutation({
    mutationFn: ({ file, globalTagName }: { file: File; globalTagName?: string }) => {
      const form = new FormData()
      form.append('file', file)
      const url = globalTagName
        ? `/contacts/import?globalTagName=${encodeURIComponent(globalTagName)}`
        : '/contacts/import'
      return api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
    },
    onSuccess: (result: { created: number; updated: number; failed: number }) => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      toast({
        title: 'Importação concluída',
        description: `${result.created} criados · ${result.updated} atualizados · ${result.failed} erros`,
        variant: result.failed > 0 ? 'destructive' : 'success',
      })
      onClose()
    },
    onError: (err: any) => toast({
      title: 'Erro na importação',
      description: err.response?.data?.message || 'Verifique o arquivo e tente novamente.',
      variant: 'destructive',
    }),
  })

  const filtered = allTags.filter((t) =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase()),
  )
  const exactMatch = filtered.some((t) => t.name.toLowerCase() === tagSearch.trim().toLowerCase())
  const showCreate = tagSearch.trim().length > 0 && !exactMatch

  function selectTag(tag: Tag) {
    setSelectedTag(tag)
    setTagSearch('')
    setTagOpen(false)
    setCreating(false)
  }

  function handleCreateTag() {
    if (!tagSearch.trim()) return
    if (creating) {
      // cria no backend e seleciona
      api.post('/tags', { name: tagSearch.trim(), color: newColor })
        .then((r) => {
          qc.invalidateQueries({ queryKey: ['tags'] })
          selectTag(r.data)
        })
        .catch(() => toast({ title: 'Erro ao criar tag', variant: 'destructive' }))
    } else {
      setCreating(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Importar planilha</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Arquivo */}
        <div className="mb-4 space-y-2">
          <label className="text-sm font-medium text-gray-700">Arquivo</label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); e.target.value = '' }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg border-2 border-dashed px-4 py-3 text-sm transition-colors',
              file ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-muted-foreground hover:border-gray-300 hover:bg-gray-50',
            )}
          >
            <FileSpreadsheet className="h-4 w-4 shrink-0" />
            {file ? file.name : 'Clique para selecionar (.csv, .xlsx, .xls)'}
          </button>
        </div>

        {/* Tag global */}
        <div className="mb-6 space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Tag global <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <p className="text-xs text-muted-foreground">Será aplicada a todos os contatos deste import.</p>

          {selectedTag ? (
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-white"
                style={{ backgroundColor: selectedTag.color }}
              >
                {selectedTag.name}
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div ref={dropdownRef} className="relative">
              <input
                ref={tagInputRef}
                value={tagSearch}
                onChange={(e) => { setTagSearch(e.target.value); setCreating(false) }}
                onFocus={() => setTagOpen(true)}
                placeholder="Buscar ou criar tag..."
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              />
              {tagOpen && (
                <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
                  <div className="max-h-40 overflow-y-auto">
                    {filtered.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => selectTag(tag)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span className="flex-1 text-left">{tag.name}</span>
                      </button>
                    ))}
                    {filtered.length === 0 && !showCreate && (
                      <p className="px-3 py-2 text-xs text-gray-400">Nenhuma tag encontrada</p>
                    )}
                  </div>
                  {showCreate && (
                    <div className="border-t p-2">
                      {creating && (
                        <div className="mb-2">
                          <p className="mb-1.5 text-xs text-gray-500">Escolha uma cor:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {COLORS.map((c) => (
                              <button
                                key={c}
                                onClick={() => setNewColor(c)}
                                className={cn('h-5 w-5 rounded-full transition-transform hover:scale-110', newColor === c && 'ring-2 ring-offset-1 ring-gray-400')}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={handleCreateTag}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-green-700 hover:bg-green-50"
                      >
                        <Plus className="h-3 w-3" />
                        {creating ? `Criar "${tagSearch.trim()}" com esta cor` : `Criar tag "${tagSearch.trim()}"`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            className="flex-1 gap-2"
            disabled={!file || importMutation.isPending}
            onClick={() => importMutation.mutate({ file: file!, globalTagName: selectedTag?.name })}
          >
            {importMutation.isPending ? (
              <><Upload className="h-4 w-4 animate-bounce" />Importando...</>
            ) : (
              <><FileSpreadsheet className="h-4 w-4" />Importar</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function TagMultiSelect({ selected, onChange }: { selected: Tag[]; onChange: (tags: Tag[]) => void }) {
  const tagInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newColor, setNewColor] = useState(COLORS[3])
  const qc = useQueryClient()

  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: () => api.get('/tags').then((r) => r.data),
  })

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false); setCreating(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = allTags.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) && !selected.find((s) => s.id === t.id)
  )
  const exactMatch = allTags.some((t) => t.name.toLowerCase() === search.trim().toLowerCase())
  const showCreate = search.trim().length > 0 && !exactMatch

  function addTag(tag: Tag) {
    onChange([...selected, tag])
    setSearch('')
    setCreating(false)
  }

  function removeTag(id: string) {
    onChange(selected.filter((t) => t.id !== id))
  }

  async function handleCreate() {
    if (!search.trim()) return
    if (creating) {
      try {
        const res = await api.post('/tags', { name: search.trim(), color: newColor })
        qc.invalidateQueries({ queryKey: ['tags'] })
        addTag(res.data)
      } catch {
        toast({ title: 'Erro ao criar tag', variant: 'destructive' })
      }
    } else {
      setCreating(true)
    }
  }

  return (
    <div>
      {/* Tags selecionadas */}
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
              <button onClick={() => removeTag(tag.id)} className="hover:opacity-70 transition-opacity">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input de busca */}
      <div ref={dropdownRef} className="relative">
        <input
          ref={tagInputRef}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCreating(false) }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar ou criar tag..."
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
        />
        {open && (
          <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-lg border bg-white shadow-lg">
            <div className="max-h-40 overflow-y-auto">
              {filtered.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => addTag(tag)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span className="flex-1 text-left">{tag.name}</span>
                </button>
              ))}
              {filtered.length === 0 && !showCreate && (
                <p className="px-3 py-2 text-xs text-gray-400">
                  {search ? 'Tag não encontrada' : 'Nenhuma tag disponível'}
                </p>
              )}
            </div>
            {showCreate && (
              <div className="border-t p-2">
                {creating && (
                  <div className="mb-2">
                    <p className="mb-1.5 text-xs text-gray-500">Escolha uma cor:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setNewColor(c)}
                          className={cn('h-5 w-5 rounded-full transition-transform hover:scale-110', newColor === c && 'ring-2 ring-offset-1 ring-gray-400')}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={handleCreate}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-green-700 hover:bg-green-50"
                >
                  <Plus className="h-3 w-3" />
                  {creating ? `Criar "${search.trim()}" com esta cor` : `Criar tag "${search.trim()}"`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ContactDetailModal({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const qc = useQueryClient()
  const router = useRouter()
  const [tab, setTab] = useState<'info' | 'sales'>('info')
  const [showSaleForm, setShowSaleForm] = useState(false)
  const [saleForm, setSaleForm] = useState({ productId: '', saleDate: new Date().toISOString().slice(0, 10), quantity: '1', unitPrice: '', totalValue: '', paymentStatus: 'pending', dueDate: '', notes: '' })
  const [editForm, setEditForm] = useState({
    name: contact.name || '',
    phone: contact.phone || '',
    email: contact.email || '',
    companyName: contact.companyName || '',
    notes: contact.notes || '',
    birthDate: contact.birthDate || '',
    externalId: contact.externalId || '',
  })
  const [dirty, setDirty] = useState(false)
  const [automationOptOut, setAutomationOptOut] = useState(contact.automationOptOut ?? false)

  function setField(field: string, value: string) {
    setEditForm((f) => ({ ...f, [field]: value }))
    setDirty(true)
  }

  const { data: sales = [], isLoading: salesLoading } = useQuery<Sale[]>({
    queryKey: ['sales', 'contact', contact.id],
    queryFn: () => api.get(`/sales/by-contact/${contact.id}`).then((r) => r.data),
    enabled: tab === 'sales',
  })

  const { data: customRecurrences = [] } = useQuery<ContactProductSetting[]>({
    queryKey: ['contact-product-settings', contact.id],
    queryFn: () => api.get(`/contact-product-settings/contact/${contact.id}`).then((r) => r.data),
    enabled: tab === 'sales',
  })

  const [editingRecurrence, setEditingRecurrence] = useState<string | null>(null)
  const [recurrenceInput, setRecurrenceInput] = useState({ value: '', unit: 'meses' as 'dias' | 'semanas' | 'meses' })

  function toDays(value: string, unit: 'dias' | 'semanas' | 'meses'): number {
    const n = parseInt(value) || 0
    if (unit === 'semanas') return n * 7
    if (unit === 'meses') return n * 30
    return n
  }

  function fromDays(days: number): { value: string; unit: 'dias' | 'semanas' | 'meses' } {
    if (days % 30 === 0) return { value: String(days / 30), unit: 'meses' }
    if (days % 7 === 0) return { value: String(days / 7), unit: 'semanas' }
    return { value: String(days), unit: 'dias' }
  }

  const upsertRecurrenceMutation = useMutation({
    mutationFn: ({ productId, days }: { productId: string; days: number }) =>
      api.put(`/contact-product-settings/contact/${contact.id}/product/${productId}`, {
        repurchaseIntervalDays: days,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-product-settings', contact.id] })
      setEditingRecurrence(null)
      toast({ title: 'Recorrência salva', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao salvar', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const deleteRecurrenceMutation = useMutation({
    mutationFn: (productId: string) =>
      api.delete(`/contact-product-settings/contact/${contact.id}/product/${productId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-product-settings', contact.id] })
      toast({ title: 'Recorrência removida — voltou ao padrão do produto', variant: 'success' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => api.patch(`/contacts/${contact.id}`, {
      name: editForm.name.trim() || undefined,
      phone: editForm.phone.replace(/\D/g, '') || undefined,
      email: editForm.email.trim() || null,
      companyName: editForm.companyName.trim() || null,
      notes: editForm.notes.trim() || null,
      birthDate: editForm.birthDate || null,
      externalId: editForm.externalId.trim() || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      setDirty(false)
      toast({ title: 'Contato atualizado', variant: 'success' })
    },
    onError: (err: any) => toast({
      title: 'Erro ao atualizar',
      description: err.response?.data?.message,
      variant: 'destructive',
    }),
  })

  const optOutMutation = useMutation({
    mutationFn: (optOut: boolean) => api.patch(`/contacts/${contact.id}/automation-optout`, { optOut }),
    onSuccess: (_, optOut) => {
      setAutomationOptOut(optOut)
      qc.invalidateQueries({ queryKey: ['contacts'] })
      toast({ title: optOut ? 'Automações desativadas para este contato' : 'Automações reativadas', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao atualizar', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const createSaleMutation = useMutation({
    mutationFn: () => api.post('/sales', {
      contactId: contact.id,
      productId: saleForm.productId,
      saleDate: saleForm.saleDate,
      quantity: parseInt(saleForm.quantity) || 1,
      unitPrice: parseFloat(saleForm.unitPrice.replace(',', '.')),
      totalValue: parseFloat(saleForm.totalValue.replace(',', '.')) || parseFloat(saleForm.unitPrice.replace(',', '.')) * (parseInt(saleForm.quantity) || 1),
      paymentStatus: saleForm.paymentStatus,
      dueDate: saleForm.dueDate || undefined,
      notes: saleForm.notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales', 'contact', contact.id] })
      setSaleForm({ productId: '', saleDate: new Date().toISOString().slice(0, 10), quantity: '1', unitPrice: '', totalValue: '', paymentStatus: 'pending', dueDate: '', notes: '' })
      setShowSaleForm(false)
      toast({ title: 'Venda registrada', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao registrar venda', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/sales/${id}/mark-paid`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales', 'contact', contact.id] })
      toast({ title: 'Marcado como pago', variant: 'success' })
    },
  })

  const deleteSaleMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/sales/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales', 'contact', contact.id] })
      toast({ title: 'Venda excluída', variant: 'success' })
    },
  })

  const totalPaid = sales.filter((s) => s.paymentStatus === 'paid').reduce((sum, s) => sum + Number(s.totalValue), 0)
  const totalPending = sales.filter((s) => s.paymentStatus === 'pending').reduce((sum, s) => sum + Number(s.totalValue), 0)

  function formatCurrency(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl border bg-white shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
              {contact.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{editForm.name || contact.name}</h2>
              <p className="text-sm text-muted-foreground">{formatPhone(editForm.phone || contact.phone)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => router.push('/conversations')}>
              <MessageSquare className="h-3.5 w-3.5" />
              Conversa
            </Button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setTab('info')}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 ${tab === 'info' ? 'border-green-600 text-green-700' : 'border-transparent text-muted-foreground hover:text-gray-700'}`}
          >
            Informações
          </button>
          <button
            onClick={() => setTab('sales')}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium transition-colors border-b-2 ${tab === 'sales' ? 'border-green-600 text-green-700' : 'border-transparent text-muted-foreground hover:text-gray-700'}`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Vendas
            {sales.length > 0 && <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{sales.length}</span>}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'info' && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Nome</label>
                <Input value={editForm.name} onChange={(e) => setField('name', e.target.value)} placeholder="Nome do contato" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  Telefone
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-700">
                    Alterar pode quebrar vínculo WhatsApp
                  </span>
                </label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="5561999999999"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  O telefone é usado para identificar mensagens do WhatsApp. Só altere se o número do cliente mudou.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">E-mail</label>
                <Input type="email" value={editForm.email} onChange={(e) => setField('email', e.target.value)} placeholder="email@exemplo.com" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Empresa</label>
                <Input value={editForm.companyName} onChange={(e) => setField('companyName', e.target.value)} placeholder="Nome da empresa" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Cake className="h-3.5 w-3.5" />
                  Data de nascimento
                </label>
                <Input type="date" value={editForm.birthDate} onChange={(e) => setField('birthDate', e.target.value)} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Notas</label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="Observações sobre o contato"
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">ID externo</label>
                <Input value={editForm.externalId} onChange={(e) => setField('externalId', e.target.value)} placeholder="Código no seu sistema (CRM, ERP...)" />
              </div>

              {(contact.tags ?? []).length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-700">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {contact.tags!.map((tag) => (
                      <span key={tag.id} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: tag.color }}>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Automações opt-out */}
              <div>
                <p className="mb-1 text-xs font-medium text-gray-700">Automações</p>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={automationOptOut}
                    onClick={() => optOutMutation.mutate(!automationOptOut)}
                    disabled={optOutMutation.isPending}
                    className={cn(
                      'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none',
                      automationOptOut ? 'bg-red-500' : 'bg-gray-200',
                      'disabled:opacity-50',
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        automationOptOut ? 'translate-x-4' : 'translate-x-0',
                      )}
                    />
                  </button>
                  <span className="text-sm text-gray-700">Não receber automações</span>
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  className="flex-1"
                  disabled={!dirty || updateMutation.isPending}
                  onClick={() => updateMutation.mutate()}
                >
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
                </Button>
                {dirty && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditForm({
                        name: contact.name || '',
                        phone: contact.phone || '',
                        email: contact.email || '',
                        companyName: contact.companyName || '',
                        notes: contact.notes || '',
                        birthDate: contact.birthDate || '',
                        externalId: contact.externalId || '',
                      })
                      setDirty(false)
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">Criado em {formatDate(contact.createdAt)}</p>
            </div>
          )}

          {tab === 'sales' && (
            <div className="space-y-4">
              {/* Totais */}
              {sales.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl border bg-green-50 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Pago</p>
                    <p className="text-base font-semibold text-green-700">{formatCurrency(totalPaid)}</p>
                  </div>
                  <div className="rounded-xl border bg-amber-50 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Pendente</p>
                    <p className="text-base font-semibold text-amber-700">{formatCurrency(totalPending)}</p>
                  </div>
                </div>
              )}

              {/* Formulário nova venda */}
              {showSaleForm ? (
                <div className="rounded-xl border p-4 space-y-3 bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">Nova venda</p>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Produto <span className="text-red-500">*</span></label>
                    <ProductPicker
                      value={saleForm.productId}
                      onChange={(id, product) => setSaleForm((f) => ({
                        ...f,
                        productId: id,
                        unitPrice: product?.defaultPrice != null ? String(product.defaultPrice) : f.unitPrice,
                        totalValue: product?.defaultPrice != null ? String(Number(product.defaultPrice) * (parseInt(f.quantity) || 1)) : f.totalValue,
                      }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Data da venda</label>
                      <Input type="date" value={saleForm.saleDate} onChange={(e) => setSaleForm((f) => ({ ...f, saleDate: e.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Quantidade</label>
                      <Input type="number" min="1" value={saleForm.quantity} onChange={(e) => setSaleForm((f) => ({ ...f, quantity: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Valor unitário</label>
                      <Input placeholder="0,00" value={saleForm.unitPrice} onChange={(e) => setSaleForm((f) => ({ ...f, unitPrice: e.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Valor total</label>
                      <Input placeholder="0,00" value={saleForm.totalValue} onChange={(e) => setSaleForm((f) => ({ ...f, totalValue: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Status</label>
                      <select
                        value={saleForm.paymentStatus}
                        onChange={(e) => setSaleForm((f) => ({ ...f, paymentStatus: e.target.value }))}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="pending">Pendente</option>
                        <option value="paid">Pago</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Vencimento</label>
                      <Input type="date" value={saleForm.dueDate} onChange={(e) => setSaleForm((f) => ({ ...f, dueDate: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Observação</label>
                    <Input placeholder="Opcional" value={saleForm.notes} onChange={(e) => setSaleForm((f) => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowSaleForm(false)}>Cancelar</Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-1"
                      disabled={!saleForm.productId || !saleForm.unitPrice || createSaleMutation.isPending}
                      onClick={() => createSaleMutation.mutate()}
                    >
                      {createSaleMutation.isPending ? 'Salvando...' : 'Registrar venda'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="gap-1.5 w-full" onClick={() => setShowSaleForm(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Registrar venda
                </Button>
              )}

              {/* Lista de vendas */}
              {salesLoading && <p className="text-center text-sm text-muted-foreground py-4">Carregando...</p>}
              {!salesLoading && sales.length === 0 && !showSaleForm && (
                <p className="text-center text-sm text-muted-foreground py-6">Nenhuma venda registrada</p>
              )}
              {sales.map((sale) => (
                <div key={sale.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900">{sale.product?.name || '—'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {sale.saleDate?.slice(0, 10).split('-').reverse().join('/')} · {sale.quantity}x {formatCurrency(Number(sale.unitPrice))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {sale.paymentStatus === 'paid' ? <><CheckCircle2 className="h-3 w-3" />Pago</> : <><Clock className="h-3 w-3" />Pendente</>}
                      </span>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(Number(sale.totalValue))}</p>
                    </div>
                  </div>
                  {sale.dueDate && (
                    <p className="text-xs text-muted-foreground mt-1.5">Vence: {sale.dueDate.slice(0, 10).split('-').reverse().join('/')}</p>
                  )}
                  {sale.notes && <p className="text-xs text-muted-foreground mt-1">{sale.notes}</p>}
                  <div className="flex gap-2 mt-3">
                    {sale.paymentStatus === 'pending' && (
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => markPaidMutation.mutate(sale.id)} disabled={markPaidMutation.isPending}>
                        <CheckCircle2 className="h-3 w-3" />
                        Marcar como pago
                      </Button>
                    )}
                    <button
                      onClick={() => { if (confirm('Excluir esta venda?')) deleteSaleMutation.mutate(sale.id) }}
                      className="ml-auto text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Recorrências personalizadas */}
              {(() => {
                const productsWithInterval = sales
                  .filter((s, i, arr) => arr.findIndex((x) => x.productId === s.productId) === i && s.product?.repurchaseIntervalDays)
                  .map((s) => s.product!)
                if (productsWithInterval.length === 0) return null
                return (
                  <div className="mt-2 rounded-xl border p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Recorrência de recompra</p>
                    {productsWithInterval.map((product) => {
                      const override = customRecurrences.find((r) => r.productId === product.id)
                      const defaultInterval = fromDays(product.repurchaseIntervalDays!)
                      const isEditing = editingRecurrence === product.id
                      return (
                        <div key={product.id} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {override ? (
                                  <>
                                    <span className="text-green-700 font-medium">Personalizado: a cada {fromDays(override.repurchaseIntervalDays).value} {fromDays(override.repurchaseIntervalDays).unit}</span>
                                    <span className="text-gray-400"> · padrão: {defaultInterval.value} {defaultInterval.unit}</span>
                                  </>
                                ) : (
                                  <>Usando padrão do produto: a cada {defaultInterval.value} {defaultInterval.unit} · <span className="text-blue-600">clique no lápis para personalizar</span></>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {override && !isEditing && (
                                <button
                                  onClick={() => { if (confirm('Remover personalização?')) deleteRecurrenceMutation.mutate(product.id) }}
                                  className="text-red-400 hover:text-red-600 transition-colors"
                                  title="Remover personalização"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (isEditing) {
                                    setEditingRecurrence(null)
                                  } else {
                                    const current = override ? fromDays(override.repurchaseIntervalDays) : defaultInterval
                                    setRecurrenceInput({ value: current.value, unit: current.unit })
                                    setEditingRecurrence(product.id)
                                  }
                                }}
                                className="text-xs text-green-700 hover:text-green-800 font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          {isEditing && (
                            <div className="flex items-center gap-2 pl-0">
                              <input
                                type="number"
                                min="1"
                                value={recurrenceInput.value}
                                onChange={(e) => setRecurrenceInput((r) => ({ ...r, value: e.target.value }))}
                                className="w-16 rounded-lg border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
                              />
                              <select
                                value={recurrenceInput.unit}
                                onChange={(e) => setRecurrenceInput((r) => ({ ...r, unit: e.target.value as 'dias' | 'semanas' | 'meses' }))}
                                className="rounded-lg border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
                              >
                                <option value="dias">dias</option>
                                <option value="semanas">semanas</option>
                                <option value="meses">meses</option>
                              </select>
                              <button
                                disabled={!recurrenceInput.value || upsertRecurrenceMutation.isPending}
                                onClick={() => upsertRecurrenceMutation.mutate({ productId: product.id, days: toDays(recurrenceInput.value, recurrenceInput.unit) })}
                                className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                <Check className="h-3 w-3" />
                                Salvar
                              </button>
                              <button onClick={() => setEditingRecurrence(null)} className="text-xs text-gray-500 hover:text-gray-700 px-2">Cancelar</button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NewContactModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', phone: '', email: '', companyName: '', notes: '', birthDate: '' })
  const [tags, setTags] = useState<Tag[]>([])

  const createMutation = useMutation({
    mutationFn: async () => {
      const contact = await api.post('/contacts', {
        name: form.name.trim() || undefined,
        phone: form.phone.replace(/\D/g, ''),
        email: form.email.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        notes: form.notes.trim() || undefined,
        birthDate: form.birthDate || undefined,
      }).then((r) => r.data)

      if (tags.length > 0) {
        await Promise.all(tags.map((tag) =>
          api.post(`/contacts/${contact.id}/tags`, { tagId: tag.id })
        ))
      }

      return contact
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      toast({ title: 'Contato criado', variant: 'success' })
      onClose()
    },
    onError: (err: any) => toast({
      title: 'Erro ao criar contato',
      description: err.response?.data?.message || 'Verifique os dados e tente novamente.',
      variant: 'destructive',
    }),
  })

  const valid = form.phone.replace(/\D/g, '').length >= 10

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Novo contato</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Telefone <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="(11) 99999-9999"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
            <Input
              placeholder="João Silva"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
            <Input
              type="email"
              placeholder="joao@email.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Empresa</label>
            <Input
              placeholder="Acme Ltda"
              value={form.companyName}
              onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
            <Input
              placeholder="Observações sobre o contato"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Data de nascimento</label>
            <Input
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tags</label>
            <TagMultiSelect selected={tags} onChange={setTags} />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            className="flex-1 gap-2"
            disabled={!valid || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <Plus className="h-4 w-4" />
            {createMutation.isPending ? 'Salvando...' : 'Criar contato'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ContactsPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [broadcastFilter, setBroadcastFilter] = useState<string>('')
  const [responseFilter, setResponseFilter] = useState<string>('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
  const [tagSearch, setTagSearch] = useState('')
  const tagPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (tagPickerRef.current && !tagPickerRef.current.contains(e.target as Node)) {
        setTagPickerOpen(false)
        setTagSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: () => api.get('/tags').then((r) => r.data),
  })

  const { data: broadcasts = [] } = useQuery<Broadcast[]>({
    queryKey: ['broadcasts'],
    queryFn: () => api.get('/broadcasts').then((r) => r.data),
  })

  const { data = [], isLoading } = useQuery<Contact[]>({
    queryKey: ['contacts', broadcastFilter, responseFilter],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (broadcastFilter) {
        params.broadcastId = broadcastFilter
        if (responseFilter) params.broadcastResponseFilter = responseFilter
      }
      return api.get('/contacts', { params }).then((r) => r.data)
    },
  })

  const contacts = data.filter((c) =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search),
  )

  const activeBroadcast = broadcasts.find((b) => b.id === broadcastFilter)

  const allVisibleIds = contacts.map((c) => c.id)
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.has(id))
  const someSelected = selected.size > 0

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allVisibleIds))
    }
  }

  const bulkTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const ids = Array.from(selected)
      await Promise.all(ids.map((contactId) => api.post(`/contacts/${contactId}/tags`, { tagId })))
      return ids.length
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      setSelected(new Set())
      setTagPickerOpen(false)
      setTagSearch('')
      toast({ title: `Tag adicionada a ${count} contato(s)`, variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao adicionar tag', variant: 'destructive' }),
  })

  const filteredTags = allTags.filter((t) =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase()),
  )

  const responseFilterLabel: Record<string, string> = {
    responded: 'Responderam',
    no_response: 'Sem resposta',
    failed: 'Falha',
  }

  return (
    <div className="p-4 md:p-8">
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {showNew && <NewContactModal onClose={() => setShowNew(false)} />}
      {selectedContact && <ContactDetailModal contact={selectedContact} onClose={() => setSelectedContact(null)} />}

      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Contatos</h1>
          <p className="text-sm text-muted-foreground">
            {data.length} contato{data.length !== 1 ? 's' : ''}
            {activeBroadcast && (
              <span className="ml-1 text-indigo-600">
                · {activeBroadcast.name}
                {responseFilter && ` · ${responseFilterLabel[responseFilter]}`}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="icon" className="sm:w-auto sm:px-3 sm:gap-2" onClick={() => setShowImport(true)}>
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Importar planilha</span>
          </Button>
          <Button className="gap-2" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo contato</span>
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou número..."
            className="pl-9 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            value={broadcastFilter}
            onChange={(e) => { setBroadcastFilter(e.target.value); setResponseFilter('') }}
            className="rounded-md border border-input bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos os contatos</option>
            {broadcasts.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {broadcastFilter && (
            <select
              value={responseFilter}
              onChange={(e) => setResponseFilter(e.target.value)}
              className="rounded-md border border-input bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todas as situações</option>
              <option value="responded">Responderam</option>
              <option value="no_response">Sem resposta</option>
              <option value="failed">Falha na entrega</option>
            </select>
          )}

          {broadcastFilter && (
            <button
              onClick={() => { setBroadcastFilter(''); setResponseFilter('') }}
              className="text-gray-400 hover:text-gray-700 transition-colors"
              title="Limpar filtros"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Carregando...</div>
          )}
          {!isLoading && !contacts.length && (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Nenhum contato encontrado
            </div>
          )}

          {/* Header de seleção */}
          {contacts.length > 0 && (
            <div className="flex items-center gap-3 border-b bg-gray-50 px-4 md:px-6 py-2">
              <button onClick={toggleAll} className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors">
                {allSelected
                  ? <CheckSquare className="h-4 w-4 text-green-600" />
                  : <Square className="h-4 w-4" />
                }
              </button>
              <span className="text-xs text-muted-foreground">
                {someSelected ? `${selected.size} selecionado(s)` : 'Selecionar todos'}
              </span>
            </div>
          )}

          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`flex items-center gap-3 md:gap-4 border-b px-4 md:px-6 py-3 md:py-4 last:border-0 transition-colors cursor-pointer ${selected.has(contact.id) ? 'bg-green-50' : 'hover:bg-gray-50/50'}`}
              onClick={() => setSelectedContact(contact)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); toggleOne(contact.id) }}
                className="shrink-0 text-gray-300 hover:text-gray-600 transition-colors"
              >
                {selected.has(contact.id)
                  ? <CheckSquare className="h-4 w-4 text-green-600" />
                  : <Square className="h-4 w-4" />
                }
              </button>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                {contact.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{contact.name || 'Sem nome'}</p>
                <p className="text-sm text-muted-foreground">{formatPhone(contact.phone)}</p>
                {(contact.tags ?? []).length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {contact.tags!.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <TagSelector
                  assignedTags={contact.tags ?? []}
                  addEndpoint={`/contacts/${contact.id}/tags`}
                  removeEndpoint={(tagId) => `/contacts/${contact.id}/tags/${tagId}`}
                  invalidateKeys={[['contacts']]}
                />
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {formatDate(contact.createdAt)}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => router.push('/conversations')}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Ver conversa
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Barra de ações em massa */}
      {someSelected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border bg-white px-5 py-3 shadow-xl">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            {selected.size} selecionado{selected.size !== 1 ? 's' : ''}
          </span>

          <div ref={tagPickerRef} className="relative">
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setTagPickerOpen((v) => !v)}
              disabled={bulkTagMutation.isPending}
            >
              <TagIcon className="h-3.5 w-3.5" />
              {bulkTagMutation.isPending ? 'Adicionando...' : 'Adicionar à tag'}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>

            {tagPickerOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-56 rounded-xl border bg-white shadow-lg z-50">
                <div className="p-2 border-b">
                  <input
                    autoFocus
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="Buscar tag..."
                    className="w-full rounded-md border-0 bg-gray-100 px-2 py-1.5 text-sm outline-none focus:bg-gray-200 transition-colors"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto py-1">
                  {filteredTags.length === 0 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">Nenhuma tag encontrada</p>
                  )}
                  {filteredTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => bulkTagMutation.mutate(tag.id)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                    >
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSelected(new Set())}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            title="Cancelar seleção"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
