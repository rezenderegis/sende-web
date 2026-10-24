'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ChevronDown, ChevronUp, X } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/auth.store'
import type { Department, User } from '@/types'

export default function DepartmentsPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const isManager = user?.role === 'owner' || user?.role === 'admin'

  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then((r) => r.data),
  })

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  })

  // Membros só vêm junto no GET /departments/:id (não na listagem) — busca
  // sob demanda só do departamento expandido, pra não disparar N requests.
  const { data: expandedDepartment } = useQuery<Department>({
    queryKey: ['departments', expandedId],
    queryFn: () => api.get(`/departments/${expandedId}`).then((r) => r.data),
    enabled: !!expandedId,
  })

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['departments'] })
  }

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post('/departments', { name }),
    onSuccess: () => {
      invalidateAll()
      setShowForm(false)
      setNewName('')
      toast({ title: 'Departamento criado', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao criar departamento', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/departments/${id}`),
    onSuccess: () => {
      invalidateAll()
      toast({ title: 'Departamento removido', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao remover departamento', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const addMemberMutation = useMutation({
    mutationFn: ({ departmentId, userId }: { departmentId: string; userId: string }) =>
      api.post(`/departments/${departmentId}/members`, { userId }),
    onSuccess: invalidateAll,
    onError: (err: any) => toast({ title: 'Erro ao adicionar membro', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const removeMemberMutation = useMutation({
    mutationFn: ({ departmentId, userId }: { departmentId: string; userId: string }) =>
      api.delete(`/departments/${departmentId}/members/${userId}`),
    onSuccess: invalidateAll,
    onError: (err: any) => toast({ title: 'Erro ao remover membro', description: err.response?.data?.message, variant: 'destructive' }),
  })

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-teal-900">Departamentos</h1>
          <p className="text-sm text-muted-foreground">Pra organizar a fila de atendimento — transferir conversas por departamento</p>
        </div>
        {isManager && (
          <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo departamento</span>
          </Button>
        )}
      </div>

      {showForm && isManager && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Novo departamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (newName.trim()) createMutation.mutate(newName.trim())
              }}
              className="flex gap-3"
            >
              <Input
                placeholder="Ex: Suporte, Financeiro, Comercial"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <Button type="submit" disabled={createMutation.isPending}>Criar</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading && <p className="text-muted-foreground">Carregando...</p>}
        {!isLoading && departments.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhum departamento criado ainda.</p>
        )}
        {departments.map((dept) => {
          const expanded = expandedId === dept.id
          const members = expanded ? expandedDepartment?.members ?? [] : []
          const memberIds = new Set(members.map((m) => m.id))
          const usersNotInDept = allUsers.filter((u) => !memberIds.has(u.id))

          return (
            <Card key={dept.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <button
                    className="flex flex-1 items-center gap-3 text-left"
                    onClick={() => setExpandedId(expanded ? null : dept.id)}
                  >
                    {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    <div>
                      <p className="font-medium text-gray-900">{dept.name}</p>
                      <p className="text-xs text-muted-foreground">{dept.memberCount ?? 0} membro(s)</p>
                    </div>
                  </button>
                  {isManager && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 text-red-600 hover:bg-red-50"
                      onClick={() => deleteMutation.mutate(dept.id)}
                    >
                      Remover
                    </Button>
                  )}
                </div>

                {expanded && (
                  <div className="mt-4 space-y-2 border-t pt-4">
                    <p className="mb-2 text-sm font-medium text-gray-700">Membros</p>
                    <div className="space-y-2">
                      {members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                          <span className="truncate text-sm text-gray-800">{m.name}</span>
                          {isManager && (
                            <button
                              className="text-gray-400 hover:text-red-600"
                              onClick={() => removeMemberMutation.mutate({ departmentId: dept.id, userId: m.id })}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {members.length === 0 && <p className="text-xs text-muted-foreground">Nenhum membro ainda.</p>}
                    </div>
                    {isManager && usersNotInDept.length > 0 && (
                      <Select onValueChange={(userId) => addMemberMutation.mutate({ departmentId: dept.id, userId })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Adicionar membro..." />
                        </SelectTrigger>
                        <SelectContent>
                          {usersNotInDept.map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
