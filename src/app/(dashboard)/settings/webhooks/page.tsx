'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Radio, Copy, KeyRound, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { WhatsappNumber, WebhookTriggerEvent } from '@/types'

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/v1`

function copyText(text: string, label: string) {
  navigator.clipboard.writeText(text)
  toast({ title: `${label} copiado!`, variant: 'success' })
}

function NumberWebhookCard({ number }: { number: WhatsappNumber }) {
  const qc = useQueryClient()
  const [showEvents, setShowEvents] = useState(false)
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null)

  const { data: status } = useQuery<{ hasSecret: boolean }>({
    queryKey: ['webhook-secret-status', number.id],
    queryFn: () => api.get(`/whatsapp/numbers/${number.id}/webhook-secret`).then((r) => r.data),
  })

  const { data: events = [] } = useQuery<WebhookTriggerEvent[]>({
    queryKey: ['webhook-events', number.id],
    queryFn: () => api.get(`/whatsapp/numbers/${number.id}/webhook-events`).then((r) => r.data),
    enabled: showEvents,
  })

  const regenerateMutation = useMutation({
    mutationFn: () => api.post(`/whatsapp/numbers/${number.id}/webhook-secret/regenerate`).then((r) => r.data),
    onSuccess: (data) => {
      setRevealedSecret(data.secret)
      qc.invalidateQueries({ queryKey: ['webhook-secret-status', number.id] })
    },
    onError: (err: any) => toast({ title: 'Erro ao gerar chave', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const triggerUrl = `${API_BASE}/webhooks/trigger/${number.id}`
  const curlSnippet = `curl -X POST '${triggerUrl}' \\
  -H 'Authorization: Bearer ${revealedSecret ?? '<sua-chave>'}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "phone": "5511999999999",
    "promptName": "nome_do_prompt",
    "mensagem": "Olá {{nome}}!",
    "variables": { "nome": "João" }
  }'`

  return (
    <div className="rounded-xl border bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{number.displayName}</p>
          <p className="text-xs text-muted-foreground font-mono">{number.phoneNumber}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => regenerateMutation.mutate()}
          disabled={regenerateMutation.isPending}
        >
          <KeyRound className="h-3.5 w-3.5" />
          {status?.hasSecret ? 'Regenerar chave' : 'Gerar chave'}
        </Button>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-700">URL de disparo</p>
        <div className="flex items-center gap-1.5 rounded-md border bg-gray-50 px-3 py-2">
          <code className="flex-1 truncate text-xs text-gray-700">{triggerUrl}</code>
          <button onClick={() => copyText(triggerUrl, 'URL')} className="text-gray-400 hover:text-gray-700 shrink-0">
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {revealedSecret ? (
        <div className="space-y-1.5 rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-medium text-amber-800">Copie sua chave agora — ela não vai aparecer de novo</p>
          <div className="flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-2">
            <code className="flex-1 truncate text-xs text-gray-700">{revealedSecret}</code>
            <button onClick={() => copyText(revealedSecret, 'Chave')} className="text-gray-400 hover:text-gray-700 shrink-0">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {status?.hasSecret ? 'Chave já configurada — guardada de forma criptografada, não é mostrada de novo.' : 'Nenhuma chave gerada ainda pra esse número.'}
        </p>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-700">Exemplo de chamada</p>
          <button onClick={() => copyText(curlSnippet, 'Exemplo')} className="flex items-center gap-1 text-xs text-teal-700 hover:underline">
            <Copy className="h-3 w-3" /> Copiar
          </button>
        </div>
        <pre className="max-h-48 overflow-auto rounded-md border bg-gray-50 p-3 font-mono text-[11px] text-gray-700 whitespace-pre-wrap">
          {curlSnippet}
        </pre>
      </div>

      <button
        onClick={() => setShowEvents((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gray-700"
      >
        {showEvents ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        Últimos disparos
      </button>

      {showEvents && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-left text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Data</th>
                <th className="px-3 py-2 font-medium">Telefone</th>
                <th className="px-3 py-2 font-medium">Prompt/Fluxo</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">Nenhum disparo ainda</td>
                </tr>
              )}
              {events.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(e.createdAt).toLocaleString('pt-BR')}</td>
                  <td className="px-3 py-2 font-mono">{e.phone}</td>
                  <td className="px-3 py-2">{[e.promptName, e.flowName].filter(Boolean).join(' + ') || '—'}</td>
                  <td className="px-3 py-2">
                    <span className={e.status === 'success' ? 'text-teal-700' : 'text-red-600'}>
                      {e.status === 'success' ? 'Sucesso' : 'Erro'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function WebhooksSettingsPage() {
  const { data: numbers = [], isLoading } = useQuery<WhatsappNumber[]>({
    queryKey: ['whatsapp-numbers'],
    queryFn: () => api.get('/whatsapp/numbers').then((r) => r.data),
  })

  return (
    <div className="p-4 md:p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-teal-900 flex items-center gap-2">
          <Radio className="h-5 w-5" />
          Webhooks de Disparo
        </h1>
        <p className="text-sm text-muted-foreground">
          Deixe o sistema do seu cliente (CRM, e-commerce, etc.) chamar sua API pra disparar uma conversa — usando um prompt, um Fluxo Guiado, ou os dois.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      {!isLoading && numbers.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-white py-16 text-muted-foreground">
          <RefreshCw className="h-10 w-10 opacity-20" />
          <p className="text-sm">Cadastre um número de WhatsApp primeiro em Números WhatsApp</p>
        </div>
      )}

      <div className="space-y-4">
        {numbers.map((n) => (
          <NumberWebhookCard key={n.id} number={n} />
        ))}
      </div>
    </div>
  )
}
