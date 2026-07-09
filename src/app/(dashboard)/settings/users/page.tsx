'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, UserCircle, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { User, WhatsappNumber } from '@/types'

const roleLabel: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  agent: 'Agente',
}

interface PermissionsFormProps {
  numbers: WhatsappNumber[]
  allowedNumberIds: string[] | null
  canConfigureBot: boolean
  canSendBroadcast: boolean
  onChange: (field: string, value: any) => void
}

function PermissionsForm({ numbers, allowedNumberIds, canConfigureBot, canSendBroadcast, onChange }: PermissionsFormProps) {
  const allNumbers = allowedNumberIds === null

  function toggleNumber(id: string) {
    if (allNumbers) {
      onChange('allowedNumberIds', numbers.map((n) => n.id).filter((nid) => nid !== id))
    } else {
      const next = allowedNumberIds.includes(id)
        ? allowedNumberIds.filter((nid) => nid !== id)
        : [...allowedNumberIds, id]
      onChange('allowedNumberIds', next.length === numbers.length ? null : next)
    }
  }

  return (
    <div className="space-y-4 pt-2">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Acesso aos números</p>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded"
              checked={allNumbers}
              onChange={() => onChange('allowedNumberIds', allNumbers ? [] : null)}
            />
            <span className="text-sm font-medium">Todos os números</span>
          </label>
          {numbers.map((num) => (
            <label key={num.id} className="flex items-center gap-3 cursor-pointer pl-1">
              <input
                type="checkbox"
                className="h-4 w-4 rounded"
                checked={allNumbers || (allowedNumberIds?.includes(num.id) ?? false)}
                onChange={() => toggleNumber(num.id)}
              />
              <span className="text-sm">
                {num.displayName}
                <span className="text-muted-foreground ml-1 text-xs">({num.phoneNumber})</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">Permissões</p>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={canConfigureBot}
            onChange={(e) => onChange('canConfigureBot', e.target.checked)}
          />
          <div>
            <span className="text-sm font-medium">Configurar bot</span>
            <p className="text-xs text-muted-foreground">Pode editar prompts e configurações do bot</p>
          </div>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={canSendBroadcast}
            onChange={(e) => onChange('canSendBroadcast', e.target.checked)}
          />
          <div>
            <span className="text-sm font-medium">Enviar broadcasts</span>
            <p className="text-xs text-muted-foreground">Pode criar e disparar campanhas em massa</p>
          </div>
        </label>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'agent',
    allowedNumberIds: null as string[] | null,
    canConfigureBot: true,
    canSendBroadcast: true,
  })
  const [editPerms, setEditPerms] = useState({
    allowedNumberIds: null as string[] | null,
    canConfigureBot: true,
    canSendBroadcast: true,
  })

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  })

  const { data: numbers = [] } = useQuery<WhatsappNumber[]>({
    queryKey: ['whatsapp-numbers'],
    queryFn: () => api.get('/whatsapp/numbers').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/users', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setShowForm(false)
      setForm({ name: '', email: '', password: '', role: 'agent', allowedNumberIds: null, canConfigureBot: true, canSendBroadcast: true })
      toast({ title: 'Usuário criado com sucesso', variant: 'success' })
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao criar usuário',
        description: err.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const updatePermsMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editPerms }) =>
      api.patch(`/users/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setEditingUser(null)
      toast({ title: 'Permissões atualizadas', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao salvar permissões', variant: 'destructive' }),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate(form)
  }

  function openEditPerms(user: User) {
    setEditingUser(user)
    setEditPerms({
      allowedNumberIds: user.allowedNumberIds,
      canConfigureBot: user.canConfigureBot ?? true,
      canSendBroadcast: user.canSendBroadcast ?? true,
    })
  }

  function numberSummary(user: User) {
    if (user.allowedNumberIds === null || user.allowedNumberIds === undefined) return 'Todos os números'
    if (user.allowedNumberIds.length === 0) return 'Nenhum número'
    const names = user.allowedNumberIds
      .map((id) => numbers.find((n) => n.id === id)?.displayName ?? id.slice(0, 8))
      .join(', ')
    return names
  }

  return (
    <div className="p-8 max-w-3xl">
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border bg-white shadow-2xl p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Permissões de {editingUser.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">{editingUser.email}</p>
            <PermissionsForm
              numbers={numbers}
              allowedNumberIds={editPerms.allowedNumberIds}
              canConfigureBot={editPerms.canConfigureBot}
              canSendBroadcast={editPerms.canSendBroadcast}
              onChange={(field, value) => setEditPerms((p) => ({ ...p, [field]: value }))}
            />
            <div className="flex gap-3 mt-5">
              <Button variant="outline" className="flex-1" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={updatePermsMutation.isPending}
                onClick={() => updatePermsMutation.mutate({ id: editingUser.id, data: editPerms })}
              >
                {updatePermsMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-muted-foreground">Gerencie quem tem acesso à plataforma</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar usuário
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Novo usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    placeholder="João Silva"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="joao@empresa.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    placeholder="••••••"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="agent">Agente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-3">Permissões de acesso</p>
                <PermissionsForm
                  numbers={numbers}
                  allowedNumberIds={form.allowedNumberIds}
                  canConfigureBot={form.canConfigureBot}
                  canSendBroadcast={form.canSendBroadcast}
                  onChange={(field, value) => setForm((f) => ({ ...f, [field]: value }))}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Criando...' : 'Criar usuário'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading && <p className="text-muted-foreground">Carregando...</p>}
        {users?.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600 shrink-0">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>
                      {roleLabel[user.role]}
                    </Badge>
                    <Badge variant={user.isActive ? 'success' : 'secondary'}>
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.role !== 'owner' && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {numberSummary(user)}
                      {' · '}
                      {user.canConfigureBot !== false ? 'Bot ✓' : 'Bot ✗'}
                      {' · '}
                      {user.canSendBroadcast !== false ? 'Broadcast ✓' : 'Broadcast ✗'}
                    </p>
                  )}
                </div>
                {user.role !== 'owner' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 shrink-0"
                    onClick={() => openEditPerms(user)}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Permissões
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
