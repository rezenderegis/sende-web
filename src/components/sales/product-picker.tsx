'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import api from '@/lib/api'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import type { Product } from '@/types'

type Unit = 'dias' | 'semanas' | 'meses'

function toDays(value: string, unit: Unit): number | undefined {
  const n = parseInt(value)
  if (!n || n <= 0) return undefined
  if (unit === 'semanas') return n * 7
  if (unit === 'meses') return n * 30
  return n
}

interface ProductPickerProps {
  value: string
  onChange: (productId: string) => void
  disabled?: boolean
}

export function ProductPicker({ value, onChange, disabled }: ProductPickerProps) {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newUnit, setNewUnit] = useState<Unit>('meses')

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/products', {
        name: newName.trim(),
        repurchaseIntervalDays: toDays(newValue, newUnit),
      }).then((r) => r.data as Product),
    onSuccess: (product) => {
      qc.invalidateQueries({ queryKey: ['products'] })
      onChange(product.id)
      setNewName('')
      setNewValue('')
      setNewUnit('meses')
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
      <div className="space-y-2.5 rounded-lg border bg-gray-50 p-3">
        <p className="text-xs font-medium text-gray-700">Novo produto</p>
        <Input
          autoFocus
          placeholder="Nome do produto *"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && newName.trim()) createMutation.mutate() }}
        />
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Recorrência de recompra (opcional)</p>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              placeholder="Ex: 3"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="flex-1"
            />
            <select
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value as Unit)}
              className="rounded-lg border px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="dias">dias</option>
              <option value="semanas">semanas</option>
              <option value="meses">meses</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setShowCreate(false); setNewName(''); setNewValue(''); setNewUnit('meses') }}
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
