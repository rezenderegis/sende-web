'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Search, MessageSquare, FileSpreadsheet, Upload, X, Plus, Check } from 'lucide-react'
import api from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TagSelector } from '@/components/tags/tag-selector'
import { formatPhone, formatDate, cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import type { Contact, Tag } from '@/types'

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
        variant: result.failed > 0 ? 'warning' : 'success',
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

function NewContactModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', phone: '', email: '', companyName: '', notes: '' })
  const [tags, setTags] = useState<Tag[]>([])

  const createMutation = useMutation({
    mutationFn: async () => {
      const contact = await api.post('/contacts', {
        name: form.name.trim() || undefined,
        phone: form.phone.replace(/\D/g, ''),
        email: form.email.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        notes: form.notes.trim() || undefined,
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
  const [search, setSearch] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const { data = [], isLoading } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: () => api.get('/contacts').then((r) => r.data),
  })

  const contacts = data.filter((c) =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search),
  )

  return (
    <div className="p-8">
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {showNew && <NewContactModal onClose={() => setShowNew(false)} />}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
          <p className="text-sm text-muted-foreground">{data.length} contatos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowImport(true)}>
            <FileSpreadsheet className="h-4 w-4" />
            Importar planilha
          </Button>
          <Button className="gap-2" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" />
            Novo contato
          </Button>
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou número..."
          className="pl-9 max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
          {contacts.map((contact) => (
            <div key={contact.id} className="flex items-center gap-4 border-b px-6 py-4 last:border-0">
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
              <div className="flex items-center gap-2 shrink-0">
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
    </div>
  )
}
