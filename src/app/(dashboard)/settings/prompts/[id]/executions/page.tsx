'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock } from 'lucide-react'
import api from '@/lib/api'
import { PromptExecutions } from '@/components/prompts/prompt-executions'
import type { CampaignPrompt } from '@/types'

export default function PromptExecutionsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: prompts } = useQuery<CampaignPrompt[]>({
    queryKey: ['campaign-prompts'],
    queryFn: () => api.get('/campaign-prompts').then((r) => r.data),
  })
  const prompt = prompts?.find((p) => p.id === id)

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
        onClick={() => router.push(`/settings/prompts/${id}`)}
        className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar pro prompt
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-teal-900 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Execuções — <span className="font-mono">{prompt.name}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Conversas reais onde esse prompt foi usado, via broadcast ou automação
        </p>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <PromptExecutions prompt={prompt} />
      </div>
    </div>
  )
}
