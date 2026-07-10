'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import api from '@/lib/api'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import type { Product } from '@/types'

interface ProductPickerProps {
  value: string
  onChange: (productId: string) => void
  disabled?: boolean
}

export function ProductPicker({ value, onChange, disabled }: ProductPickerProps) {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newInterval, setNewInterval] = useState('')

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/products', {
        name: newName.trim(),
        repurchaseIntervalDays: newInterval ? parseInt(newInterval) : undefined,
      }).then((r) => r.data as Product),
    onSuccess: (product) => {
      qc.invalidateQueries({ queryKey: ['products'] })
      onChange(product.id)
      setNewName('')
      setNewInterval('')
      setShowCreate(false)
      toast({ title: `Produto "${product.name}" criado`, variant: 'success' })
    },
    onError: (err: any) =>
      toast({
        title: 'Erro ao criar produto',
        description: err.response?.data?.message || 'Verifique o nome e tente novamente.',
        variant: 'destructive',
      }),
  })

  if (showCreate) {
    return (
      <div className="space-y-2 rounded-lg border bg-gray-50 p-3">
        <p className="text-xs font-medium text-gray-700">Novo produto</p>
        <Input
          autoFocus
          placeholder="Nome do produto *"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && newName.trim()) createMutation.mutate() }}
        />
        <Input
          type="number"
          placeholder="Intervalo de recompra (dias) — opcional"
          value={newInterval}
          onChange={(e) => setNewInterval(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setShowCreate(false); setNewName(''); setNewInterval('') }}
            className="flex-1 rounded-lg border py-1.5 text-xs text-gray-600 hover:bg-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!newName.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="flex-1 rounded-lg bg-green-600 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? 'Criando...' : 'Criar produto'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
      >
        <option value="">Selecionar produto...</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="shrink-0 flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs text-green-700 hover:bg-green-50 transition-colors"
        title="Criar novo produto"
      >
        <Plus className="h-3.5 w-3.5" />
        Novo
      </button>
    </div>
  )
}
