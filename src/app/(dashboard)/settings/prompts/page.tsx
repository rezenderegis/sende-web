'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, BotMessageSquare, Check, X } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import type { CampaignPrompt } from '@/types'

function PromptForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: { name: string; content: string }
  onSave: (data: { name: string; content: string }) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const valid = name.trim() && content.trim()

  return (
    <div className="rounded-xl border bg-white p-5 space-y-4">
      <div className="space-y-2">
        <Label>Nome do prompt</Label>
        <Input
          autoFocus
          placeholder="Ex: Vendas - Produto X"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Conteúdo</Label>
        <Textarea
          placeholder="Você é um assistente de vendas especializado em [produto]. Seu objetivo é..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-36 resize-none font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Use <code className="bg-gray-100 px-1 rounded text-xs">{'{contactName}'}</code> para incluir o nome do contato.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          disabled={!valid || isPending}
          onClick={() => onSave({ name: name.trim(), content: content.trim() })}
        >
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

export default function PromptsPage() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: prompts = [], isLoading } = useQuery<CampaignPrompt[]>({
    queryKey: ['campaign-prompts'],
    queryFn: () => api.get('/campaign-prompts').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; content: string }) =>
      api.post('/campaign-prompts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign-prompts'] })
      setShowNew(false)
      toast({ title: 'Prompt criado', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao criar prompt', variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; content: string } }) =>
      api.patch(`/campaign-prompts/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign-prompts'] })
      setEditingId(null)
      toast({ title: 'Prompt atualizado', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao atualizar prompt', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/campaign-prompts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign-prompts'] })
      setDeleteId(null)
      toast({ title: 'Prompt excluído' })
    },
    onError: () => toast({ title: 'Erro ao excluir prompt', variant: 'destructive' }),
  })

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Prompts de IA</h1>
          <p className="text-sm text-muted-foreground">
            Prompts reutilizáveis para campanhas de broadcast
          </p>
        </div>
        {!showNew && (
          <Button onClick={() => setShowNew(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo prompt</span>
          </Button>
        )}
      </div>

      {showNew && (
        <div className="mb-4">
          <PromptForm
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => setShowNew(false)}
            isPending={createMutation.isPending}
          />
        </div>
      )}

      <div className="space-y-3">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        )}

        {!isLoading && prompts.length === 0 && !showNew && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-white py-16 text-muted-foreground">
            <BotMessageSquare className="h-10 w-10 opacity-20" />
            <p className="text-sm">Nenhum prompt criado ainda</p>
            <Button size="sm" variant="outline" onClick={() => setShowNew(true)}>
              Criar primeiro prompt
            </Button>
          </div>
        )}

        {prompts.map((prompt) =>
          editingId === prompt.id ? (
            <PromptForm
              key={prompt.id}
              initial={{ name: prompt.name, content: prompt.content }}
              onSave={(data) => updateMutation.mutate({ id: prompt.id, data })}
              onCancel={() => setEditingId(null)}
              isPending={updateMutation.isPending}
            />
          ) : (
            <div key={prompt.id} className="rounded-xl border bg-white p-5">
              {deleteId === prompt.id ? (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-gray-700">
                    Excluir <span className="font-medium">"{prompt.name}"</span>?
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(prompt.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Confirmar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <BotMessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <p className="font-medium text-gray-900">{prompt.name}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-gray-900"
                        onClick={() => setEditingId(prompt.id)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(prompt.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-mono whitespace-pre-wrap line-clamp-4">
                    {prompt.content}
                  </p>
                </>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  )
}
