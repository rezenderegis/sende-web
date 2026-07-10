'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil, Check, X, Package, RefreshCw } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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

function fromDays(days: number): { value: string; unit: Unit } {
  if (days % 30 === 0) return { value: String(days / 30), unit: 'meses' }
  if (days % 7 === 0) return { value: String(days / 7), unit: 'semanas' }
  return { value: String(days), unit: 'dias' }
}

function formatRecurrence(days: number): string {
  const { value, unit } = fromDays(days)
  return `A cada ${value} ${unit}`
}

function RecurrenceInput({
  value,
  unit,
  onValueChange,
  onUnitChange,
  placeholder,
}: {
  value: string
  unit: Unit
  onValueChange: (v: string) => void
  onUnitChange: (u: Unit) => void
  placeholder?: string
}) {
  return (
    <div className="flex gap-2">
      <Input
        type="number"
        min="1"
        placeholder={placeholder ?? 'Ex: 3'}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="flex-1"
      />
      <select
        value={unit}
        onChange={(e) => onUnitChange(e.target.value as Unit)}
        className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
      >
        <option value="dias">dias</option>
        <option value="semanas">semanas</option>
        <option value="meses">meses</option>
      </select>
    </div>
  )
}

export default function ProductsSettingsPage() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newUnit, setNewUnit] = useState<Unit>('meses')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editValue, setEditValue] = useState('')
  const [editUnit, setEditUnit] = useState<Unit>('meses')

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/products', {
        name: newName.trim(),
        repurchaseIntervalDays: toDays(newValue, newUnit),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      setNewName('')
      setNewValue('')
      setNewUnit('meses')
      setShowNew(false)
      toast({ title: 'Produto criado', variant: 'success' })
    },
    onError: (err: any) =>
      toast({
        title: 'Erro ao criar produto',
        description: err.response?.data?.message || 'Nome já existe.',
        variant: 'destructive',
      }),
  })

  const updateMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/products/${id}`, {
        name: editName.trim(),
        repurchaseIntervalDays: toDays(editValue, editUnit) ?? null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      setEditingId(null)
      toast({ title: 'Produto atualizado', variant: 'success' })
    },
    onError: (err: any) =>
      toast({ title: 'Erro ao atualizar', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast({ title: 'Produto excluído', variant: 'success' })
    },
    onError: () =>
      toast({
        title: 'Erro ao excluir',
        description: 'Existem vendas vinculadas a este produto.',
        variant: 'destructive',
      }),
  })

  function startEdit(product: Product) {
    setEditingId(product.id)
    setEditName(product.name)
    if (product.repurchaseIntervalDays) {
      const { value, unit } = fromDays(product.repurchaseIntervalDays)
      setEditValue(value)
      setEditUnit(unit)
    } else {
      setEditValue('')
      setEditUnit('meses')
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Produtos
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure os produtos e a recorrência de recompra para disparos automáticos
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowNew((v) => !v)}>
          <Plus className="h-4 w-4" />
          Novo produto
        </Button>
      </div>

      {showNew && (
        <Card className="mb-5">
          <CardContent className="p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-900">Novo produto</p>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Nome <span className="text-red-500">*</span>
              </label>
              <Input
                autoFocus
                placeholder="Ex: Botox, Preenchimento, Consulta..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newName.trim()) createMutation.mutate() }}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700 flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-green-600" />
                Recorrência de recompra
              </label>
              <RecurrenceInput
                value={newValue}
                unit={newUnit}
                onValueChange={setNewValue}
                onUnitChange={setNewUnit}
                placeholder="Ex: 3"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Tempo esperado até o cliente precisar comprar novamente. Usado para disparar mensagem automática de retorno.
                Deixe em branco se não se aplica.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => { setShowNew(false); setNewName(''); setNewValue(''); setNewUnit('meses') }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-1"
                disabled={!newName.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                <Plus className="h-3.5 w-3.5" />
                {createMutation.isPending ? 'Criando...' : 'Criar produto'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Carregando...</div>
          )}
          {!isLoading && products.length === 0 && (
            <div className="flex flex-col h-32 items-center justify-center text-muted-foreground gap-2">
              <Package className="h-6 w-6 opacity-30" />
              <p>Nenhum produto cadastrado</p>
            </div>
          )}

          {products.map((product) => (
            <div key={product.id} className="border-b px-5 py-4 last:border-0">
              {editingId === product.id ? (
                <div className="space-y-3">
                  <Input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nome do produto"
                  />
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 text-green-600" />
                      Recorrência de recompra
                    </label>
                    <RecurrenceInput
                      value={editValue}
                      unit={editUnit}
                      onValueChange={setEditValue}
                      onUnitChange={setEditUnit}
                      placeholder="Deixe vazio para remover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 rounded-lg border py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => updateMutation.mutate(product.id)}
                      disabled={!editName.trim() || updateMutation.isPending}
                      className="flex-1 rounded-lg bg-green-600 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{product.name}</p>
                    {product.repurchaseIntervalDays ? (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-green-700">
                        <RefreshCw className="h-3 w-3" />
                        {formatRecurrence(product.repurchaseIntervalDays)} · disparo automático ativo
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-muted-foreground">Sem recorrência configurada</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(product)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Excluir "${product.name}"?`)) deleteMutation.mutate(product.id) }}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
