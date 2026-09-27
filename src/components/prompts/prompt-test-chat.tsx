'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Play, RotateCcw, Send } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import type { CampaignPrompt, WhatsappNumber, WhatsappTemplate } from '@/types'

type ToolCall = { name: string; args: any; result: any }
type ChatMsg = { role: 'user' | 'assistant'; content: string; toolCalls?: ToolCall[] }

export function PromptTestChat({ prompt }: { prompt: CampaignPrompt }) {
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
        history: newHistory.map(({ role, content }) => ({ role, content })),
        enabledToolNames: prompt.enabledToolNames,
        enabledFlowNames: prompt.enabledFlowNames,
      })
      setHistory((h) => [...h, { role: 'assistant', content: res.data.reply, toolCalls: res.data.toolCalls }])
    } catch {
      setHistory((h) => [...h, { role: 'assistant', content: '⚠️ Erro ao obter resposta. Verifique a chave de API.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
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

      {!started && (
        <div className="rounded-lg border bg-gray-50 p-3 space-y-3">
          <p className="text-xs font-medium text-gray-700">Como iniciar a conversa de teste?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setStartMode('text')}
              className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${startMode === 'text' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Texto livre
            </button>
            <button
              onClick={() => setStartMode('template')}
              className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${startMode === 'template' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Template aprovado
            </button>
          </div>

          {startMode === 'template' && (
            <div className="space-y-2">
              <select
                value={numberId}
                onChange={(e) => { setNumberId(e.target.value); setTemplateName('') }}
                className="w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-teal-600"
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
                  className="w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-teal-600"
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

      <div className="rounded-xl border bg-gray-50 flex flex-col h-96">
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {history.length === 0 && (
            <p className="text-center text-xs text-muted-foreground mt-8">
              Envie uma mensagem para testar o comportamento do bot com este prompt
            </p>
          )}
          {history.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`rounded-2xl px-3 py-2 text-sm max-w-[80%] whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white rounded-br-sm'
                    : 'bg-white border text-gray-800 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
              {!!msg.toolCalls?.length && (
                <div className="mt-1 max-w-[85%] space-y-1">
                  {msg.toolCalls.map((tc, j) => (
                    <details key={j} className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
                      <summary className="cursor-pointer font-medium">🔧 chamou <span className="font-mono">{tc.name}</span></summary>
                      <div className="mt-1 space-y-1 font-mono">
                        <p>args: {JSON.stringify(tc.args)}</p>
                        <p className="whitespace-pre-wrap">resultado: {typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result)}</p>
                      </div>
                    </details>
                  ))}
                </div>
              )}
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

        <div className="flex gap-2 border-t bg-white rounded-b-xl p-2">
          <input
            className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal-600"
            placeholder="Digite uma mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 transition-colors"
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
