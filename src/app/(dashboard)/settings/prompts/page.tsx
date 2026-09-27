'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, BotMessageSquare, ArrowRight } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { CampaignPrompt } from '@/types'

export default function PromptsPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const { data: prompts = [], isLoading } = useQuery<CampaignPrompt[]>({
    queryKey: ['campaign-prompts'],
    queryFn: () => api.get('/campaign-prompts').then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/campaign-prompts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign-prompts'] })
      setDeleteId(null)
      setDeleteConfirmText('')
      toast({ title: 'Prompt excluído' })
    },
    onError: (err: any) => toast({
      title: 'Não foi possível excluir',
      description: err.response?.data?.message ?? 'Erro ao excluir prompt',
      variant: 'destructive',
    }),
  })

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-teal-900">Prompts de IA</h1>
          <p className="text-sm text-muted-foreground">
            Prompts reutilizáveis para campanhas de broadcast
          </p>
        </div>
        <Button onClick={() => router.push('/settings/prompts/new')} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo prompt</span>
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        )}

        {!isLoading && prompts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-white py-16 text-muted-foreground">
            <BotMessageSquare className="h-10 w-10 opacity-20" />
            <p className="text-sm">Nenhum prompt criado ainda</p>
            <Button size="sm" variant="outline" onClick={() => router.push('/settings/prompts/new')}>
              Criar primeiro prompt
            </Button>
          </div>
        )}

        {prompts.map((prompt) => (
          <div key={prompt.id} className="rounded-xl border bg-white p-5">
            {deleteId === prompt.id ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Digite <span className="font-mono font-semibold text-red-600">{prompt.name}</span> para confirmar a exclusão:
                </p>
                <input
                  autoFocus
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={prompt.name}
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-red-300"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1.5"
                    disabled={deleteConfirmText !== prompt.name || deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(prompt.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleteMutation.isPending ? 'Excluindo...' : 'Excluir permanentemente'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setDeleteId(null); setDeleteConfirmText('') }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <button className="min-w-0 flex-1 text-left" onClick={() => router.push(`/settings/prompts/${prompt.id}`)}>
                  <div className="flex items-center gap-2">
                    <BotMessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="font-medium text-gray-900">{prompt.name}</p>
                  </div>
                  <p className="mt-1.5 text-sm text-gray-600 font-mono whitespace-pre-wrap line-clamp-2">
                    {prompt.content}
                  </p>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => router.push(`/settings/prompts/${prompt.id}`)}>
                    Abrir
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => { setDeleteId(prompt.id); setDeleteConfirmText('') }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
