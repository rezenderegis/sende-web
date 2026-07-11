'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, BotMessageSquare, Check, X, Play, Send, RotateCcw, ChevronDown, ChevronUp, History, CornerUpLeft } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import type { CampaignPrompt, PromptVersion, WhatsappNumber, WhatsappTemplate } from '@/types'

type ChatMsg = { role: 'user' | 'assistant'; content: string }

function PromptForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: { name: string; content: string }
  onSave: (data: { name: string; content: string }) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
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
        <Textarea
          placeholder="Você é um assistente de vendas especializado em [produto]. Seu objetivo é..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-36 resize-none font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Use <code className="bg-gray-100 px-1 rounded text-xs">{'{contactName}'}</code> para incluir o nome do contato.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          disabled={!valid || isPending}
          onClick={() => onSave({ name: name.trim(), content: content.trim() })}
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

function PromptTestChat({ prompt }: { prompt: CampaignPrompt }) {
  const [history, setHistory] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [startMode, setStartMode] = useState<'text' | 'template'>('text')
  const [numberId, setNumberId] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [started, setStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: numbers = [] } = useQuery<WhatsappNumber[]>({
    queryKey: ['whatsapp-numbers'],
    queryFn: () => api.get('/whatsapp/numbers').then((r) => r.data),
  })

  const { data: templates = [] } = useQuery<WhatsappTemplate[]>({
    queryKey: ['whatsapp-templates', numberId],
    queryFn: () => api.get(`/whatsapp/numbers/${numberId}/templates`).then((r) => r.data),
    enabled: !!numberId,
  })

  const approvedTemplates = templates.filter((t) => t.status === 'APPROVED')
  const selectedTemplate = approvedTemplates.find((t) => t.name === templateName)

  function startWithTemplate() {
    if (!selectedTemplate?.bodyText) return
    setHistory([{ role: 'assistant', content: selectedTemplate.bodyText }])
    setStarted(true)
  }

  function reset() {
    setHistory([])
    setStarted(false)
    setTemplateName('')
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    const newHistory: ChatMsg[] = [...history, { role: 'user', content: text }]
    setHistory(newHistory)
    setInput('')
    setLoading(true)
    try {
      const res = await api.post('/ai/test-chat', {
        promptContent: prompt.content,
        contactName: 'Visitante',
        history: newHistory,
      })
      setHistory((h) => [...h, { role: 'assistant', content: res.data.reply }])
    } catch {
      setHistory((h) => [...h, { role: 'assistant', content: '⚠️ Erro ao obter resposta. Verifique a chave de API.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 border-t pt-4 space-y-3">
      {/* Toggle prompt preview */}
      <button
        onClick={() => setShowPrompt((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gray-700 transition-colors"
      >
        {showPrompt ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {showPrompt ? 'Ocultar prompt' : 'Ver prompt usado'}
      </button>

      {showPrompt && (
        <pre className="rounded-lg bg-gray-50 border px-3 py-2 text-xs text-gray-600 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
          {prompt.content}
        </pre>
      )}

      {/* Mode selector — shown only before starting */}
      {!started && (
        <div className="rounded-lg border bg-gray-50 p-3 space-y-3">
          <p className="text-xs font-medium text-gray-700">Como iniciar a conversa de teste?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setStartMode('text')}
              className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${startMode === 'text' ? 'border-green-500 bg-green-50 text-green-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Texto livre
            </button>
            <button
              onClick={() => setStartMode('template')}
              className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${startMode === 'template' ? 'border-green-500 bg-green-50 text-green-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Template aprovado
            </button>
          </div>

          {startMode === 'template' && (
            <div className="space-y-2">
              <select
                value={numberId}
                onChange={(e) => { setNumberId(e.target.value); setTemplateName('') }}
                className="w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecionar número...</option>
                {numbers.map((n) => (
                  <option key={n.id} value={n.id}>{n.displayName} ({n.phoneNumber})</option>
                ))}
              </select>
              {numberId && (
                <select
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecionar template...</option>
                  {approvedTemplates.map((t) => (
                    <option key={t.id} value={t.name}>{t.name} {t.variablesCount > 0 ? `(${t.variablesCount} var)` : ''}</option>
                  ))}
                </select>
              )}
              {selectedTemplate?.bodyText && (
                <div className="rounded-lg border bg-white px-3 py-2 text-xs text-gray-600 whitespace-pre-wrap">
                  {selectedTemplate.bodyText}
                </div>
              )}
              <Button
                size="sm"
                className="w-full gap-1.5"
                disabled={!selectedTemplate}
                onClick={startWithTemplate}
              >
                <Play className="h-3 w-3" />
                Iniciar com este template
              </Button>
            </div>
          )}

          {startMode === 'text' && (
            <p className="text-xs text-muted-foreground">
              Digite sua primeira mensagem no campo abaixo como se fosse o contato respondendo.
            </p>
          )}
        </div>
      )}

      {/* Chat area */}
      <div className="rounded-xl border bg-gray-50 flex flex-col h-72">
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {history.length === 0 && (
            <p className="text-center text-xs text-muted-foreground mt-8">
              Envie uma mensagem para testar o comportamento do bot com este prompt
            </p>
          )}
          {history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`rounded-2xl px-3 py-2 text-sm max-w-[80%] whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-sm'
                    : 'bg-white border text-gray-800 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border rounded-2xl rounded-bl-sm px-3 py-2">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 border-t bg-white rounded-b-xl p-2">
          <input
            className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Digite uma mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
          {history.length > 0 && (
            <button
              onClick={reset}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-muted-foreground hover:text-gray-700 transition-colors"
              title="Limpar conversa"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function PromptHistory({ prompt, onClose }: { prompt: CampaignPrompt; onClose: () => void }) {
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
    <div className="mt-4 border-t pt-4 space-y-3">
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
                      className="flex items-center gap-1 rounded bg-green-600 px-2 py-0.5 text-xs text-white hover:bg-green-700 disabled:opacity-50"
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
                    className="flex items-center gap-1 rounded border px-2 py-0.5 text-xs text-gray-600 hover:bg-white hover:border-green-400 hover:text-green-700 transition-colors"
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

export default function PromptsPage() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [historyId, setHistoryId] = useState<string | null>(null)

  const { data: prompts = [], isLoading } = useQuery<CampaignPrompt[]>({
    queryKey: ['campaign-prompts'],
    queryFn: () => api.get('/campaign-prompts').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; content: string }) =>
      api.post('/campaign-prompts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign-prompts'] })
      setShowNew(false)
      toast({ title: 'Prompt criado', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao criar prompt', variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; content: string } }) =>
      api.patch(`/campaign-prompts/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign-prompts'] })
      setEditingId(null)
      toast({ title: 'Prompt atualizado', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao atualizar prompt', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/campaign-prompts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign-prompts'] })
      setDeleteId(null)
      toast({ title: 'Prompt excluído' })
    },
    onError: () => toast({ title: 'Erro ao excluir prompt', variant: 'destructive' }),
  })

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Prompts de IA</h1>
          <p className="text-sm text-muted-foreground">
            Prompts reutilizáveis para campanhas de broadcast
          </p>
        </div>
        {!showNew && (
          <Button onClick={() => setShowNew(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo prompt</span>
          </Button>
        )}
      </div>

      {showNew && (
        <div className="mb-4">
          <PromptForm
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => setShowNew(false)}
            isPending={createMutation.isPending}
          />
        </div>
      )}

      <div className="space-y-3">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        )}

        {!isLoading && prompts.length === 0 && !showNew && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-white py-16 text-muted-foreground">
            <BotMessageSquare className="h-10 w-10 opacity-20" />
            <p className="text-sm">Nenhum prompt criado ainda</p>
            <Button size="sm" variant="outline" onClick={() => setShowNew(true)}>
              Criar primeiro prompt
            </Button>
          </div>
        )}

        {prompts.map((prompt) =>
          editingId === prompt.id ? (
            <PromptForm
              key={prompt.id}
              initial={{ name: prompt.name, content: prompt.content }}
              onSave={(data) => updateMutation.mutate({ id: prompt.id, data })}
              onCancel={() => setEditingId(null)}
              isPending={updateMutation.isPending}
            />
          ) : (
            <div key={prompt.id} className="rounded-xl border bg-white p-5">
              {deleteId === prompt.id ? (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-gray-700">
                    Excluir <span className="font-medium">"{prompt.name}"</span>?
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(prompt.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Confirmar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <BotMessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <p className="font-medium text-gray-900">{prompt.name}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className={`gap-1.5 h-7 text-xs ${testingId === prompt.id ? 'border-green-400 text-green-700 bg-green-50' : ''}`}
                        onClick={() => { setTestingId(testingId === prompt.id ? null : prompt.id); setHistoryId(null) }}
                      >
                        <Play className="h-3 w-3" />
                        {testingId === prompt.id ? 'Fechar teste' : 'Testar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`gap-1.5 h-7 text-xs ${historyId === prompt.id ? 'border-violet-400 text-violet-700 bg-violet-50' : ''}`}
                        onClick={() => { setHistoryId(historyId === prompt.id ? null : prompt.id); setTestingId(null) }}
                      >
                        <History className="h-3 w-3" />
                        {historyId === prompt.id ? 'Fechar' : 'Histórico'}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-gray-900"
                        onClick={() => setEditingId(prompt.id)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(prompt.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-mono whitespace-pre-wrap line-clamp-4">
                    {prompt.content}
                  </p>
                  {testingId === prompt.id && <PromptTestChat prompt={prompt} />}
                  {historyId === prompt.id && (
                    <PromptHistory prompt={prompt} onClose={() => setHistoryId(null)} />
                  )}
                </>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  )
}
