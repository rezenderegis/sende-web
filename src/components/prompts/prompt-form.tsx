'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToolFlowSelector } from '@/components/bot/tool-flow-selector'
import { PromptEditor } from '@/components/bot/prompt-editor'

export type PromptFormData = { name: string; content: string; enabledToolNames: string[] | null; enabledFlowNames: string[] | null }

export function PromptForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: Partial<PromptFormData>
  onSave: (data: PromptFormData) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [enabledToolNames, setEnabledToolNames] = useState<string[] | null>(initial?.enabledToolNames ?? null)
  const [enabledFlowNames, setEnabledFlowNames] = useState<string[] | null>(initial?.enabledFlowNames ?? null)
  const valid = name.trim() && content.trim()

  return (
    <div className="rounded-xl border bg-white p-5 space-y-4">
      <div className="space-y-2">
        <Label>Nome do prompt</Label>
        <Input
          autoFocus
          placeholder="Ex: Vendas - Produto X"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Conteúdo</Label>
        <PromptEditor
          placeholder="Você é um assistente de vendas especializado em [produto]. Seu objetivo é... Digite {{ pra referenciar uma tool ou fluxo."
          value={content}
          onChange={setContent}
          className="min-h-[50vh] resize-none font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Use <code className="bg-gray-100 px-1 rounded text-xs">{'{contactName}'}</code> para incluir o nome do contato.
        </p>
      </div>
      <div className="space-y-2 border-t pt-3">
        <Label className="text-xs">Tools e Fluxos disponíveis quando esta campanha estiver ativa</Label>
        <ToolFlowSelector
          enabledToolNames={enabledToolNames}
          enabledFlowNames={enabledFlowNames}
          onChange={(patch) => {
            if ('enabledToolNames' in patch) setEnabledToolNames(patch.enabledToolNames ?? null)
            if ('enabledFlowNames' in patch) setEnabledFlowNames(patch.enabledFlowNames ?? null)
          }}
        />
      </div>
      <div className="flex gap-2">
        <Button
          disabled={!valid || isPending}
          onClick={() => onSave({ name: name.trim(), content: content.trim(), enabledToolNames, enabledFlowNames })}
        >
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
