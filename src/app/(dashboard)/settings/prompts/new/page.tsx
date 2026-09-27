'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { PromptForm, type PromptFormData } from '@/components/prompts/prompt-form'

export default function NewPromptPage() {
  const router = useRouter()
  const qc = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data: PromptFormData) => api.post('/campaign-prompts', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign-prompts'] })
      toast({ title: 'Prompt criado', variant: 'success' })
      router.push('/settings/prompts')
    },
    onError: () => toast({ title: 'Erro ao criar prompt', variant: 'destructive' }),
  })

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <button
        onClick={() => router.push('/settings/prompts')}
        className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar pra prompts
      </button>
      <h1 className="text-xl font-semibold text-teal-900 mb-6">Novo prompt</h1>
      <PromptForm
        onSave={(data) => createMutation.mutate(data)}
        onCancel={() => router.push('/settings/prompts')}
        isPending={createMutation.isPending}
      />
    </div>
  )
}
