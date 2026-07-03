'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Phone, Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null)
  const [promptDraft, setPromptDraft] = useState<Record<string, string>>({})

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

  const updatePromptMutation = useMutation({
    mutationFn: ({ id, systemPrompt }: { id: string; systemPrompt: string | null }) =>
      api.patch(`/whatsapp/numbers/${id}`, { systemPrompt }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-numbers'] })
      toast({ title: 'Prompt salvo com sucesso', variant: 'success' })
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao salvar prompt',
        description: err.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  function openPrompt(num: WhatsappNumber) {
    setExpandedPromptId(num.id)
    setPromptDraft((d) => ({ ...d, [num.id]: d[num.id] ?? (num.systemPrompt ?? '') }))
  }

  function savePrompt(id: string) {
    const value = promptDraft[id] ?? ''
    updatePromptMutation.mutate({ id, systemPrompt: value || null })
  }

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
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
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
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-muted-foreground"
                  onClick={() =>
                    expandedPromptId === num.id
                      ? setExpandedPromptId(null)
                      : openPrompt(num)
                  }
                >
                  Prompt do bot
                  {expandedPromptId === num.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => deleteMutation.mutate(num.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {expandedPromptId === num.id && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <div className="space-y-1.5">
                    <Label>Prompt do bot</Label>
                    <p className="text-xs text-muted-foreground">
                      Use <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">${'{contactName}'}</code> para inserir o nome do cliente automaticamente.
                      Se deixado em branco, o prompt padrão do servidor será usado.
                    </p>
                  </div>
                  <Textarea
                    placeholder="Você é um assistente da Empresa X. O nome do cliente é ${contactName}..."
                    value={promptDraft[num.id] ?? ''}
                    onChange={(e) =>
                      setPromptDraft((d) => ({ ...d, [num.id]: e.target.value }))
                    }
                    className="min-h-36 font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => savePrompt(num.id)}
                      disabled={updatePromptMutation.isPending}
                    >
                      {updatePromptMutation.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedPromptId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
