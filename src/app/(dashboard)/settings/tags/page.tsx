'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { Tag } from '@/types'

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
]

export default function TagsSettingsPage() {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])

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
      toast({ title: 'Tag removida', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao remover tag', variant: 'destructive' }),
  })

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-lg font-semibold text-gray-900 mb-1">Tags</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Crie tags coloridas para categorizar suas conversas.
      </p>

      <div className="rounded-lg border bg-white p-4 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Nova tag</p>
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Nome da tag (ex: Urgente)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) createMutation.mutate()
            }}
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

      <div className="rounded-lg border bg-white divide-y">
        {isLoading && (
          <p className="px-4 py-3 text-sm text-muted-foreground">Carregando...</p>
        )}
        {!isLoading && tags.length === 0 && (
          <p className="px-4 py-3 text-sm text-muted-foreground">Nenhuma tag criada ainda.</p>
        )}
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className="h-4 w-4 rounded-full shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <span className="text-sm font-medium text-gray-900">{tag.name}</span>
            </div>
            <button
              onClick={() => deleteMutation.mutate(tag.id)}
              disabled={deleteMutation.isPending}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
