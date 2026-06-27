'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Phone, Trash2, Copy } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import type { WhatsappNumber } from '@/types'

export default function NumbersPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    phoneNumberId: '',
    wabaId: '',
    phoneNumber: '',
    displayName: '',
    accessToken: '',
  })

  const { data: numbers, isLoading } = useQuery<WhatsappNumber[]>({
    queryKey: ['whatsapp-numbers'],
    queryFn: () => api.get('/whatsapp/numbers').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/whatsapp/numbers', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-numbers'] })
      setShowForm(false)
      setForm({ phoneNumberId: '', wabaId: '', phoneNumber: '', displayName: '', accessToken: '' })
      toast({ title: 'Número cadastrado com sucesso', variant: 'success' })
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao cadastrar',
        description: err.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/whatsapp/numbers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-numbers'] })
      toast({ title: 'Número removido' })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate(form)
  }

  function copyId(id: string) {
    navigator.clipboard.writeText(id)
    toast({ title: 'ID copiado!' })
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Números WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus números da Meta Business API</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar número
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cadastrar número</CardTitle>
            <CardDescription>
              Informe os dados da Meta WhatsApp Business API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone Number ID (Meta)</Label>
                  <Input
                    placeholder="1163333003532964"
                    value={form.phoneNumberId}
                    onChange={(e) => setForm((f) => ({ ...f, phoneNumberId: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>WABA ID</Label>
                  <Input
                    placeholder="ID da conta WABA"
                    value={form.wabaId}
                    onChange={(e) => setForm((f) => ({ ...f, wabaId: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número de telefone</Label>
                  <Input
                    placeholder="+5561993796669"
                    value={form.phoneNumber}
                    onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome de exibição</Label>
                  <Input
                    placeholder="GlobalSix"
                    value={form.displayName}
                    onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Access Token da Meta</Label>
                <Input
                  type="password"
                  placeholder="EAAxxxxxxxx..."
                  value={form.accessToken}
                  onChange={(e) => setForm((f) => ({ ...f, accessToken: e.target.value }))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Token de acesso permanente gerado no Meta Business Manager
                </p>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Salvando...' : 'Salvar'}
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
        {!isLoading && !numbers?.length && (
          <Card>
            <CardContent className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Phone className="h-8 w-8 opacity-30" />
              <p>Nenhum número cadastrado</p>
            </CardContent>
          </Card>
        )}
        {numbers?.map((num) => (
          <Card key={num.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Phone className="h-5 w-5 text-whatsapp" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{num.displayName}</p>
                  <Badge variant={num.isActive ? 'success' : 'secondary'}>
                    {num.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{num.phoneNumber}</p>
                <button
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-gray-900 mt-0.5"
                  onClick={() => copyId(num.id)}
                >
                  <Copy className="h-3 w-3" />
                  ID: {num.id.slice(0, 8)}...
                </button>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => deleteMutation.mutate(num.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
