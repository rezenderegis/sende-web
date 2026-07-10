'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil, Check, X, Package } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import type { Product } from '@/types'

export default function ProductsSettingsPage() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newInterval, setNewInterval] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editInterval, setEditInterval] = useState('')

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/products', {
        name: newName.trim(),
        repurchaseIntervalDays: newInterval ? parseInt(newInterval) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      setNewName('')
      setNewInterval('')
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
        repurchaseIntervalDays: editInterval ? parseInt(editInterval) : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      setEditingId(null)
      toast({ title: 'Produto atualizado', variant: 'success' })
    },
    onError: (err: any) =>
      toast({
        title: 'Erro ao atualizar',
        description: err.response?.data?.message,
        variant: 'destructive',
      }),
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
    setEditInterval(product.repurchaseIntervalDays?.toString() || '')
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Produtos
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie os produtos vinculados às vendas</p>
        </div>
        <Button className="gap-2" onClick={() => setShowNew((v) => !v)}>
          <Plus className="h-4 w-4" />
          Novo produto
        </Button>
      </div>

      {showNew && (
        <Card className="mb-5">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Novo produto</p>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Nome <span className="text-red-500">*</span></label>
              <Input
                autoFocus
                placeholder="Ex: Botox, Preenchimento, Consulta..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newName.trim()) createMutation.mutate() }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Intervalo de recompra (dias)</label>
              <Input
                type="number"
                placeholder="Ex: 90 — deixe vazio se não se aplica"
                value={newInterval}
                onChange={(e) => setNewInterval(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Usado para identificar clientes que podem estar prontos para recomprar.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { setShowNew(false); setNewName(''); setNewInterval('') }}>
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
            <div key={product.id} className="flex items-center gap-4 border-b px-5 py-4 last:border-0">
              {editingId === product.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => { if (e.key === 'Enter' && editName.trim()) updateMutation.mutate(product.id) }}
                  />
                  <Input
                    type="number"
                    placeholder="Dias recompra"
                    value={editInterval}
                    onChange={(e) => setEditInterval(e.target.value)}
                    className="w-36"
                  />
                  <button
                    onClick={() => updateMutation.mutate(product.id)}
                    disabled={!editName.trim() || updateMutation.isPending}
                    className="shrink-0 text-green-600 hover:text-green-800 disabled:opacity-50 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{product.name}</p>
                    {product.repurchaseIntervalDays && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Recompra a cada {product.repurchaseIntervalDays} dias
                      </p>
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
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
