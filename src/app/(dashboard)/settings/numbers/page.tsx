'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Phone, Trash2, Copy, Settings2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import type { WhatsappNumber } from '@/types'

export default function NumbersPage() {
  const router = useRouter()
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

  function copyId(id: string) {
    navigator.clipboard.writeText(id)
    toast({ title: 'ID copiado!' })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate(form)
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Números WhatsApp</h1>
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
            <CardDescription>Informe os dados da Meta WhatsApp Business API</CardDescription>
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
                    placeholder="Sendi Suporte"
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
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

        {!isLoading && !numbers?.length && (
          <Card>
            <CardContent className="flex h-40 flex-col items-center justify-center gap-3 text-muted-foreground">
              <Phone className="h-10 w-10 opacity-20" />
              <p className="text-sm">Nenhum número cadastrado</p>
              <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                Adicionar primeiro número
              </Button>
            </CardContent>
          </Card>
        )}

        {numbers?.map((num) => (
          <Card key={num.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50">
                  <Phone className="h-5 w-5 text-whatsapp" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{num.displayName}</p>
                    <Badge variant={num.isActive ? 'success' : 'secondary'} className="text-xs">
                      {num.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{num.phoneNumber}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => router.push(`/settings/numbers/${num.id}`)}
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Configurar bot
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-gray-900"
                    onClick={() => copyId(num.id)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => deleteMutation.mutate(num.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {num.systemPrompt && (
                <div className="border-t bg-gray-50 px-5 py-2.5">
                  <p className="text-xs text-muted-foreground truncate">
                    <span className="font-medium text-gray-600">Prompt: </span>
                    {num.systemPrompt}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
