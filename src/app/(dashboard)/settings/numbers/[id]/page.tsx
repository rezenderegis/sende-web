'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Phone } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import type { WhatsappNumber } from '@/types'

export default function NumberConfigPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const [promptDraft, setPromptDraft] = useState('')
  const [historyLimit, setHistoryLimit] = useState(20)

  const { data: numbers } = useQuery<WhatsappNumber[]>({
    queryKey: ['whatsapp-numbers'],
    queryFn: () => api.get('/whatsapp/numbers').then((r) => r.data),
  })

  const num = numbers?.find((n) => n.id === id)

  useEffect(() => {
    if (num) {
      setPromptDraft(num.systemPrompt ?? '')
      setHistoryLimit(num.botHistoryLimit ?? 20)
    }
  }, [num])

  const updateMutation = useMutation({
    mutationFn: (data: { systemPrompt?: string | null; botHistoryLimit?: number }) =>
      api.patch(`/whatsapp/numbers/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-numbers'] })
      toast({ title: 'Configurações salvas', variant: 'success' })
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao salvar',
        description: err.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  if (!num) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        Carregando...
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b bg-white px-6 py-4">
        <button
          onClick={() => router.push('/settings/numbers')}
          className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para números
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
            <Phone className="h-4 w-4 text-whatsapp" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-gray-900">{num.displayName}</h1>
              <Badge variant={num.isActive ? 'success' : 'secondary'}>
                {num.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{num.phoneNumber}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden gap-6 p-6">

        {/* Prompt — ocupa todo o espaço vertical disponível */}
        <div className="flex flex-1 flex-col gap-3 min-w-0">
          <div>
            <Label className="text-sm font-semibold">Instruções do bot</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Use{' '}
              <code className="rounded bg-gray-100 px-1 py-0.5 font-mono">${'{contactName}'}</code>{' '}
              onde quiser que o nome do cliente apareça. Se vazio, usa o prompt padrão do servidor.
            </p>
          </div>
          <Textarea
            placeholder="Usando prompt padrão do servidor"
            value={promptDraft}
            onChange={(e) => setPromptDraft(e.target.value)}
            className="flex-1 resize-none font-mono text-sm leading-relaxed"
          />
          <div className="shrink-0">
            <Button
              onClick={() => updateMutation.mutate({ systemPrompt: promptDraft || null })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar prompt'}
            </Button>
          </div>
        </div>

        {/* Sidebar — configurações secundárias */}
        <div className="shrink-0 w-72 space-y-4">
          <div className="rounded-xl border bg-white p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">Contexto de memória</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Mensagens anteriores enviadas ao LLM em cada resposta. Mais = melhor memória, porém custo maior.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Mensagens de contexto</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={historyLimit}
                  onChange={(e) => setHistoryLimit(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">mensagens</span>
              </div>
              <p className="text-xs text-muted-foreground">Recomendado: 10 a 50</p>
            </div>
            <Button
              className="w-full"
              onClick={() => updateMutation.mutate({ botHistoryLimit: historyLimit })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar limite'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
