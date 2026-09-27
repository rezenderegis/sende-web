'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Workflow, ArrowRight } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import type { Flow } from '@/types'

function NewFlowForm({ onSave, onCancel, isPending }: { onSave: (data: { name: string; description: string }) => void; onCancel: () => void; isPending: boolean }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const valid = name.trim() && description.trim()

  return (
    <div className="rounded-xl border bg-white p-5 space-y-4">
      <div className="space-y-2">
        <Label>Nome do fluxo</Label>
        <Input
          autoFocus
          placeholder="pesquisa_satisfacao"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">Só minúsculas, números e underscore — é o nome que a IA usa pra iniciar o fluxo</p>
      </div>
      <div className="space-y-2">
        <Label>Descrição (quando a IA deve iniciar este fluxo)</Label>
        <Textarea
          placeholder="Use quando o cliente pedir para participar da pesquisa de satisfação"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-16 resize-none"
        />
      </div>
      <div className="flex gap-2">
        <Button
          disabled={!valid || isPending}
          onClick={() => onSave({ name: name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'), description: description.trim() })}
        >
          {isPending ? 'Criando...' : 'Criar e abrir canvas'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

export default function FlowsListPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const { data: flows = [], isLoading } = useQuery<Flow[]>({
    queryKey: ['flows'],
    queryFn: () => api.get('/flows').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => api.post('/flows', data).then((r) => r.data),
    onSuccess: (flow: Flow) => {
      qc.invalidateQueries({ queryKey: ['flows'] })
      toast({ title: 'Fluxo criado', variant: 'success' })
      router.push(`/settings/flows/${flow.id}`)
    },
    onError: (err: any) => toast({ title: 'Erro ao criar fluxo', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/flows/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flows'] })
      setDeleteId(null)
      setDeleteConfirmText('')
      toast({ title: 'Fluxo excluído' })
    },
    onError: (err: any) => toast({ title: 'Não foi possível excluir', description: err.response?.data?.message, variant: 'destructive' }),
  })

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-teal-900">Fluxo Guiado</h1>
          <p className="text-sm text-muted-foreground">Sequências fixas de perguntas com botão/lista nativos do WhatsApp</p>
        </div>
        {!showNew && (
          <Button onClick={() => setShowNew(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo fluxo</span>
          </Button>
        )}
      </div>

      {showNew && (
        <div className="mb-4">
          <NewFlowForm onSave={(data) => createMutation.mutate(data)} onCancel={() => setShowNew(false)} isPending={createMutation.isPending} />
        </div>
      )}

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

        {!isLoading && flows.length === 0 && !showNew && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-white py-16 text-muted-foreground">
            <Workflow className="h-10 w-10 opacity-20" />
            <p className="text-sm">Nenhum fluxo criado ainda</p>
            <Button size="sm" variant="outline" onClick={() => setShowNew(true)}>
              Criar primeiro fluxo
            </Button>
          </div>
        )}

        {flows.map((flow) => (
          <div key={flow.id} className="rounded-xl border bg-white p-5">
            {deleteId === flow.id ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Digite <span className="font-mono font-semibold text-red-600">{flow.name}</span> para confirmar a exclusão (remove todos os passos junto):
                </p>
                <input
                  autoFocus
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={flow.name}
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-red-300"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1.5"
                    disabled={deleteConfirmText !== flow.name || deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(flow.id)}
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
                <button className="min-w-0 flex-1 text-left" onClick={() => router.push(`/settings/flows/${flow.id}`)}>
                  <div className="flex items-center gap-2">
                    <Workflow className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="font-medium text-gray-900 font-mono truncate">{flow.name}</p>
                    {!flow.startStepId && (
                      <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                        sem passo inicial
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">{flow.description}</p>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => router.push(`/settings/flows/${flow.id}`)}>
                    Abrir canvas
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => { setDeleteId(flow.id); setDeleteConfirmText('') }}
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
