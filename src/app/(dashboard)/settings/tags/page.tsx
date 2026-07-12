'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus, ChevronRight, X, Users, CheckSquare, Square, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { cn, formatPhone } from '@/lib/utils'
import type { Tag, Contact } from '@/types'

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
]

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-xl">
        <p className="text-sm text-gray-700 mb-5">{message}</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm}>Confirmar</Button>
        </div>
      </div>
    </div>
  )
}

function TagContactsPanel({ tag, onClose }: { tag: Tag; onClose: () => void }) {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState<{ type: 'single' | 'bulk'; contactId?: string } | null>(null)

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ['tag-contacts', tag.id],
    queryFn: () => api.get(`/contacts/by-tag/${tag.id}`).then((r) => r.data),
  })

  const removeTagMutation = useMutation({
    mutationFn: (contactId: string) =>
      api.delete(`/contacts/${contactId}/tags/${tag.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tag-contacts', tag.id] })
      qc.invalidateQueries({ queryKey: ['contacts'] })
    },
    onError: () => toast({ title: 'Erro ao remover da tag', variant: 'destructive' }),
  })

  const allIds = contacts.map((c) => c.id)
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id))

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds))
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleConfirm() {
    if (!confirm) return
    if (confirm.type === 'single' && confirm.contactId) {
      await removeTagMutation.mutateAsync(confirm.contactId)
      setSelected((prev) => { const n = new Set(prev); n.delete(confirm.contactId!); return n })
      toast({ title: 'Contato removido da tag' })
    } else if (confirm.type === 'bulk') {
      await Promise.all(Array.from(selected).map((id) => removeTagMutation.mutateAsync(id)))
      setSelected(new Set())
      toast({ title: `${selected.size} contato(s) removidos da tag`, variant: 'success' })
    }
    setConfirm(null)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {confirm && (
        <ConfirmDialog
          message={
            confirm.type === 'bulk'
              ? `Remover ${selected.size} contato(s) da tag "${tag.name}"?`
              : `Remover este contato da tag "${tag.name}"?`
          }
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 border-b px-4 py-3">
        <button
          onClick={onClose}
          className="md:hidden p-1 -ml-1 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: tag.color }}
        />
        <span className="font-medium text-gray-900 flex-1 truncate">{tag.name}</span>
        <span className="text-xs text-muted-foreground shrink-0">
          {contacts.length} contato{contacts.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={onClose}
          className="hidden md:block text-gray-400 hover:text-gray-700 transition-colors ml-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="shrink-0 flex items-center justify-between gap-3 border-b bg-amber-50 px-4 py-2">
          <span className="text-sm text-amber-800">{selected.size} selecionado(s)</span>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setConfirm({ type: 'bulk' })}
          >
            Remover da tag
          </Button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <p className="px-4 py-3 text-sm text-muted-foreground">Carregando...</p>
        )}
        {!isLoading && contacts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <Users className="h-8 w-8 opacity-20" />
            <p className="text-sm">Nenhum contato com esta tag</p>
          </div>
        )}

        {contacts.length > 0 && (
          <>
            <button
              onClick={toggleAll}
              className="flex w-full items-center gap-3 border-b px-4 py-2.5 text-xs text-muted-foreground hover:bg-gray-50"
            >
              {allSelected
                ? <CheckSquare className="h-4 w-4 text-teal-600 shrink-0" />
                : <Square className="h-4 w-4 shrink-0" />
              }
              Selecionar todos
            </button>

            {contacts.map((contact) => (
              <div
                key={contact.id}
                className={cn(
                  'flex items-center gap-3 border-b px-4 py-3 last:border-0',
                  selected.has(contact.id) && 'bg-teal-50',
                )}
              >
                <button onClick={() => toggleOne(contact.id)} className="shrink-0">
                  {selected.has(contact.id)
                    ? <CheckSquare className="h-4 w-4 text-teal-600" />
                    : <Square className="h-4 w-4 text-gray-300" />
                  }
                </button>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                  {contact.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{contact.name || 'Sem nome'}</p>
                  <p className="text-xs text-muted-foreground">{formatPhone(contact.phone)}</p>
                </div>
                <button
                  onClick={() => setConfirm({ type: 'single', contactId: contact.id })}
                  className="shrink-0 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remover da tag"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export default function TagsSettingsPage() {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Tag | null>(null)

  const { data: tags = [], isLoading } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: () => api.get('/tags').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/tags', { name: name.trim(), color }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] })
      setName('')
      setColor(COLORS[0])
      toast({ title: 'Tag criada com sucesso', variant: 'success' })
    },
    onError: (err: any) => {
      const msg = err.response?.status === 409
        ? 'Já existe uma tag com esse nome'
        : 'Erro ao criar tag'
      toast({ title: msg, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tags/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] })
      if (selectedTag?.id === confirmDelete?.id) setSelectedTag(null)
      setConfirmDelete(null)
      toast({ title: 'Tag removida', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao remover tag', variant: 'destructive' }),
  })

  return (
    <div className="relative flex h-full overflow-hidden">
      {confirmDelete && (
        <ConfirmDialog
          message={`Excluir a tag "${confirmDelete.name}"? Ela será removida de todos os contatos e conversas.`}
          onConfirm={() => deleteMutation.mutate(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Lista de tags — no mobile fica escondida quando painel está aberto */}
      <div className={cn(
        'flex flex-col overflow-y-auto transition-all duration-200',
        // Mobile: full width quando nada selecionado, esconde quando selecionado
        selectedTag
          ? 'hidden md:flex md:w-72 md:shrink-0 md:border-r'
          : 'w-full md:max-w-2xl',
      )}>
        <div className="p-4 md:p-6">
          <h1 className="text-lg font-semibold text-teal-900 mb-1">Tags</h1>
          <p className="text-sm text-muted-foreground mb-5">
            Crie tags coloridas para categorizar seus contatos e conversas.
          </p>

          {/* Form nova tag */}
          <div className="rounded-lg border bg-white p-4 mb-5">
            <p className="text-sm font-medium text-gray-700 mb-3">Nova tag</p>
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Nome da tag (ex: Urgente)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) createMutation.mutate() }}
              />
              <div>
                <p className="text-xs text-gray-500 mb-2">Cor</p>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={cn(
                        'h-7 w-7 rounded-full transition-transform hover:scale-110',
                        color === c && 'ring-2 ring-offset-2 ring-gray-400',
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {name.trim() && (
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: color }}
                  >
                    {name.trim()}
                  </span>
                )}
                <Button
                  size="sm"
                  className="gap-2"
                  disabled={!name.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                >
                  <Plus className="h-4 w-4" />
                  Criar tag
                </Button>
              </div>
            </div>
          </div>

          {/* Lista */}
          <div className="rounded-lg border bg-white divide-y">
            {isLoading && (
              <p className="px-4 py-3 text-sm text-muted-foreground">Carregando...</p>
            )}
            {!isLoading && tags.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted-foreground">Nenhuma tag criada ainda.</p>
            )}
            {tags.map((tag) => (
              <div
                key={tag.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 transition-colors',
                  selectedTag?.id === tag.id && 'bg-gray-50',
                )}
              >
                <button
                  onClick={() => setSelectedTag(selectedTag?.id === tag.id ? null : tag)}
                  className="flex flex-1 items-center gap-3 min-w-0 text-left"
                >
                  <span
                    className="h-4 w-4 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 text-sm font-medium text-gray-900 truncate">
                    {tag.name}
                  </span>
                  <ChevronRight className={cn(
                    'h-4 w-4 text-gray-300 transition-transform shrink-0',
                    selectedTag?.id === tag.id && 'rotate-90',
                  )} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(tag) }}
                  disabled={deleteMutation.isPending}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Painel de contatos — no mobile ocupa tela toda como push navigation */}
      {selectedTag && (
        <div className="absolute inset-0 md:relative md:inset-auto md:flex-1 md:min-w-0">
          <TagContactsPanel
            key={selectedTag.id}
            tag={selectedTag}
            onClose={() => setSelectedTag(null)}
          />
        </div>
      )}
    </div>
  )
}
