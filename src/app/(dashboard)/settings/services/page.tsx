'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Power } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/auth.store'
import type { Service } from '@/types'

export default function ServicesPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const isManager = user?.role === 'owner' || user?.role === 'admin'

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('30')

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then((r) => r.data),
  })

  const invalidateAll = () => qc.invalidateQueries({ queryKey: ['services'] })

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; durationMinutes: number }) => api.post('/services', payload),
    onSuccess: () => {
      invalidateAll()
      setShowForm(false)
      setName('')
      setDuration('30')
      toast({ title: 'Serviço criado', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao criar serviço', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/services/${id}`, { isActive }),
    onSuccess: invalidateAll,
    onError: (err: any) => toast({ title: 'Erro ao atualizar serviço', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/services/${id}`),
    onSuccess: () => {
      invalidateAll()
      toast({ title: 'Serviço removido', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao remover serviço', description: err.response?.data?.message ?? 'Serviço já tem agendamentos — inative em vez de excluir', variant: 'destructive' }),
  })

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-teal-900">Serviços</h1>
          <p className="text-sm text-muted-foreground">Catálogo de serviços agendáveis — duração usada pra calcular horários livres</p>
        </div>
        {isManager && (
          <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo serviço</span>
          </Button>
        )}
      </div>

      {showForm && isManager && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Novo serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const durationMinutes = parseInt(duration, 10)
                if (name.trim() && durationMinutes > 0) createMutation.mutate({ name: name.trim(), durationMinutes })
              }}
              className="flex flex-wrap gap-3"
            >
              <Input
                placeholder="Ex: Limpeza dental, Consulta"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 min-w-[180px]"
                required
              />
              <Input
                type="number"
                min={5}
                step={5}
                placeholder="Duração (min)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-36"
                required
              />
              <Button type="submit" disabled={createMutation.isPending}>Criar</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {isLoading && <p className="text-muted-foreground">Carregando...</p>}
        {!isLoading && services.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhum serviço cadastrado ainda.</p>
        )}
        {services.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center justify-between gap-2 p-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`truncate text-sm font-medium ${s.isActive ? 'text-gray-800' : 'text-muted-foreground line-through'}`}>{s.name}</span>
                <Badge variant="secondary">{s.durationMinutes} min</Badge>
                <Badge variant={s.isActive ? 'success' : 'secondary'}>{s.isActive ? 'Ativo' : 'Inativo'}</Badge>
              </div>
              {isManager && (
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
                    onClick={() => toggleMutation.mutate({ id: s.id, isActive: !s.isActive })}
                  >
                    <Power className="h-3 w-3" />
                    {s.isActive ? 'Inativar' : 'Reativar'}
                  </button>
                  <button
                    className="text-gray-400 hover:text-red-600"
                    title="Só é possível excluir se não tiver agendamentos — senão, inative"
                    onClick={() => deleteMutation.mutate(s.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
