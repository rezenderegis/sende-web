'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import type { SavedMessage } from '@/types'

export default function SavedMessagesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', content: '' })
  const [editForm, setEditForm] = useState({ name: '', content: '' })

  const { data: messages = [], isLoading } = useQuery<SavedMessage[]>({
    queryKey: ['saved-messages'],
    queryFn: () => api.get('/saved-messages').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/saved-messages', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-messages'] })
      setForm({ name: '', content: '' })
      setShowForm(false)
      toast({ title: 'Mensagem salva', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao salvar mensagem', variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; content: string }) =>
      api.patch(`/saved-messages/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-messages'] })
      setEditingId(null)
      toast({ title: 'Mensagem atualizada', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao atualizar', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/saved-messages/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-messages'] })
      toast({ title: 'Mensagem removida' })
    },
    onError: () => toast({ title: 'Erro ao remover', variant: 'destructive' }),
  })

  function startEdit(msg: SavedMessage) {
    setEditingId(msg.id)
    setEditForm({ name: msg.name, content: msg.content })
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Mensagens Salvas</h1>
          <p className="text-sm text-muted-foreground">Respostas rápidas para usar nas conversas.</p>
        </div>
        <Button size="sm" className="gap-2 shrink-0" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova mensagem</span>
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border bg-white p-5 space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              placeholder="Ex: Saudação inicial"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Conteúdo</Label>
            <Textarea
              placeholder="Olá! Como posso te ajudar hoje?"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="min-h-28 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!form.name.trim() || !form.content.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && messages.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma mensagem salva ainda.</p>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="rounded-xl border bg-white p-4">
            {editingId === msg.id ? (
              <div className="space-y-3">
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
                <Textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                  className="min-h-24 resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate({ id: msg.id, ...editForm })}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Salvar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{msg.name}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{msg.content}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(msg)} className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(msg.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
