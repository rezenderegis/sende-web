'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, CornerUpLeft, History } from 'lucide-react'
import api from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import type { CampaignPrompt, PromptVersion } from '@/types'

export function PromptHistory({ prompt, onClose }: { prompt: CampaignPrompt; onClose: () => void }) {
  const qc = useQueryClient()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null)

  const { data: versions = [], isLoading } = useQuery<PromptVersion[]>({
    queryKey: ['prompt-versions', prompt.id],
    queryFn: () => api.get(`/campaign-prompts/${prompt.id}/versions`).then((r) => r.data),
  })

  const restoreMutation = useMutation({
    mutationFn: (versionId: string) =>
      api.post(`/campaign-prompts/${prompt.id}/restore/${versionId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign-prompts'] })
      qc.invalidateQueries({ queryKey: ['campaign-prompt', prompt.id] })
      qc.invalidateQueries({ queryKey: ['prompt-versions', prompt.id] })
      setConfirmRestoreId(null)
      toast({ title: 'Versão restaurada', variant: 'success' })
      onClose()
    },
    onError: () => toast({ title: 'Erro ao restaurar versão', variant: 'destructive' }),
  })

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <History className="h-4 w-4" />
          Histórico de versões
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-gray-700">
          Fechar
        </button>
      </div>

      {isLoading && <p className="text-xs text-muted-foreground">Carregando...</p>}

      {!isLoading && versions.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhuma versão anterior. O histórico é salvo automaticamente a cada edição.
        </p>
      )}

      <div className="space-y-2">
        {versions.map((v) => (
          <div key={v.id} className="rounded-lg border bg-gray-50 overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground shrink-0">{formatDate(v.savedAt)}</span>
                {v.name !== prompt.name && (
                  <span className="text-xs text-gray-500 truncate">· nome: <em>{v.name}</em></span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                  className="text-xs text-muted-foreground hover:text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-200 transition-colors"
                >
                  {expandedId === v.id ? 'Ocultar' : 'Ver'}
                </button>
                {confirmRestoreId === v.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => restoreMutation.mutate(v.id)}
                      disabled={restoreMutation.isPending}
                      className="flex items-center gap-1 rounded bg-teal-600 px-2 py-0.5 text-xs text-white hover:bg-teal-700 disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmRestoreId(null)}
                      className="rounded border px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRestoreId(v.id)}
                    className="flex items-center gap-1 rounded border px-2 py-0.5 text-xs text-gray-600 hover:bg-white hover:border-teal-600 hover:text-teal-700 transition-colors"
                  >
                    <CornerUpLeft className="h-3 w-3" />
                    Restaurar
                  </button>
                )}
              </div>
            </div>
            {expandedId === v.id && (
              <pre className="border-t px-3 py-2 text-xs text-gray-600 font-mono whitespace-pre-wrap bg-white max-h-48 overflow-y-auto">
                {v.content}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
