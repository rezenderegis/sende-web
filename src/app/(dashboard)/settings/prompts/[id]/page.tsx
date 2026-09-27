'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Clock, History, Play } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { PromptForm, type PromptFormData } from '@/components/prompts/prompt-form'
import { PromptTestChat } from '@/components/prompts/prompt-test-chat'
import { PromptHistory } from '@/components/prompts/prompt-history'
import type { CampaignPrompt } from '@/types'

export default function PromptDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'none' | 'test' | 'history'>('none')

  const { data: prompts } = useQuery<CampaignPrompt[]>({
    queryKey: ['campaign-prompts'],
    queryFn: () => api.get('/campaign-prompts').then((r) => r.data),
  })
  const prompt = prompts?.find((p) => p.id === id)

  const updateMutation = useMutation({
    mutationFn: (data: PromptFormData) => api.patch(`/campaign-prompts/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign-prompts'] })
      toast({ title: 'Prompt atualizado', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao atualizar prompt', variant: 'destructive' }),
  })

  if (!prompt) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        Carregando...
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <button
        onClick={() => router.push('/settings/prompts')}
        className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar pra prompts
      </button>

      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-teal-900 font-mono">{prompt.name}</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className={tab === 'test' ? 'border-teal-500 bg-teal-50 text-teal-700' : ''}
            onClick={() => setTab(tab === 'test' ? 'none' : 'test')}
          >
            <Play className="h-3.5 w-3.5 mr-1.5" />
            {tab === 'test' ? 'Fechar teste' : 'Testar'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={tab === 'history' ? 'border-violet-400 bg-violet-50 text-violet-700' : ''}
            onClick={() => setTab(tab === 'history' ? 'none' : 'history')}
          >
            <History className="h-3.5 w-3.5 mr-1.5" />
            {tab === 'history' ? 'Fechar' : 'Histórico'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => router.push(`/settings/prompts/${id}/executions`)}>
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            Execuções
          </Button>
        </div>
      </div>

      {tab === 'test' && (
        <div className="mb-6 rounded-xl border bg-white p-5">
          <PromptTestChat prompt={prompt} />
        </div>
      )}
      {tab === 'history' && (
        <div className="mb-6 rounded-xl border bg-white p-5">
          <PromptHistory prompt={prompt} onClose={() => setTab('none')} />
        </div>
      )}

      <PromptForm
        key={prompt.updatedAt}
        initial={{ name: prompt.name, content: prompt.content, enabledToolNames: prompt.enabledToolNames, enabledFlowNames: prompt.enabledFlowNames }}
        onSave={(data) => updateMutation.mutate(data)}
        onCancel={() => router.push('/settings/prompts')}
        isPending={updateMutation.isPending}
      />
    </div>
  )
}
