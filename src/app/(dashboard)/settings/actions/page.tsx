'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Webhook, Play, X } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { ExternalAction, ExternalActionMethod, TestExternalActionResult } from '@/types'

type Row = { key: string; value: string }
type ParamRow = { name: string; type: 'string' | 'number' | 'boolean'; description: string; required: boolean }

function objectToRows(obj: Record<string, any> | null | undefined): Row[] {
  if (!obj) return []
  return Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }))
}

function rowsToObject(rows: Row[]): Record<string, string> | undefined {
  const entries = rows.filter((r) => r.key.trim())
  if (!entries.length) return undefined
  return Object.fromEntries(entries.map((r) => [r.key.trim(), r.value]))
}

function schemaToRows(schema: Record<string, any> | undefined): ParamRow[] {
  if (!schema?.properties) return []
  const required: string[] = schema.required ?? []
  return Object.entries(schema.properties as Record<string, any>).map(([name, def]) => ({
    name,
    type: (def.type as ParamRow['type']) ?? 'string',
    description: def.description ?? '',
    required: required.includes(name),
  }))
}

function rowsToSchema(rows: ParamRow[]): Record<string, any> {
  const valid = rows.filter((r) => r.name.trim())
  return {
    type: 'object',
    properties: Object.fromEntries(
      valid.map((r) => [r.name.trim(), { type: r.type, description: r.description }]),
    ),
    required: valid.filter((r) => r.required).map((r) => r.name.trim()),
  }
}

function extractPlaceholders(rows: Row[]): string[] {
  const set = new Set<string>()
  for (const row of rows) {
    const matches = Array.from(row.value.matchAll(/\{\{(\w+)\}\}/g))
    for (const m of matches) set.add(m[1])
  }
  return Array.from(set)
}

function KeyValueEditor({
  label,
  hint,
  rows,
  onChange,
}: {
  label: string
  hint?: string
  rows: Row[]
  onChange: (rows: Row[]) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <button
          type="button"
          onClick={() => onChange([...rows, { key: '', value: '' }])}
          className="flex items-center gap-1 text-xs text-teal-700 hover:underline"
        >
          <Plus className="h-3 w-3" /> Adicionar linha
        </button>
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {rows.length === 0 && <p className="text-xs text-muted-foreground">Nenhum campo adicionado</p>}
      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder="chave"
              value={row.key}
              onChange={(e) => onChange(rows.map((r, idx) => (idx === i ? { ...r, key: e.target.value } : r)))}
              className="h-8 w-1/3 text-xs"
            />
            <Input
              placeholder="valor (use {{chave}} para placeholders)"
              value={row.value}
              onChange={(e) => onChange(rows.map((r, idx) => (idx === i ? { ...r, value: e.target.value } : r)))}
              className="h-8 flex-1 text-xs font-mono"
            />
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
              className="text-gray-400 hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ParametersEditor({ rows, onChange }: { rows: ParamRow[]; onChange: (rows: ParamRow[]) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Parâmetros que a IA deve fornecer</Label>
        <button
          type="button"
          onClick={() => onChange([...rows, { name: '', type: 'string', description: '', required: true }])}
          className="flex items-center gap-1 text-xs text-teal-700 hover:underline"
        >
          <Plus className="h-3 w-3" /> Adicionar parâmetro
        </button>
      </div>
      {rows.length === 0 && <p className="text-xs text-muted-foreground">Nenhum parâmetro — a ação não recebe dados da IA</p>}
      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder="nome"
              value={row.name}
              onChange={(e) => onChange(rows.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r)))}
              className="h-8 w-28 text-xs font-mono"
            />
            <select
              value={row.type}
              onChange={(e) => onChange(rows.map((r, idx) => (idx === i ? { ...r, type: e.target.value as ParamRow['type'] } : r)))}
              className="h-8 rounded-md border border-gray-200 px-2 text-xs"
            >
              <option value="string">texto</option>
              <option value="number">número</option>
              <option value="boolean">sim/não</option>
            </select>
            <Input
              placeholder="descrição (ex: nota de 1 a 5 dada pelo cliente)"
              value={row.description}
              onChange={(e) => onChange(rows.map((r, idx) => (idx === i ? { ...r, description: e.target.value } : r)))}
              className="h-8 flex-1 text-xs"
            />
            <label className="flex shrink-0 items-center gap-1.5 text-xs text-gray-600">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded"
                checked={row.required}
                onChange={(e) => onChange(rows.map((r, idx) => (idx === i ? { ...r, required: e.target.checked } : r)))}
              />
              obrigatório
            </label>
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
              className="text-gray-400 hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function TestPanel({
  method,
  url,
  headerRows,
  bodyRows,
  accessToken,
  timeoutMs,
}: {
  method: ExternalActionMethod
  url: string
  headerRows: Row[]
  bodyRows: Row[]
  accessToken: string
  timeoutMs: number
}) {
  const placeholders = useMemo(() => extractPlaceholders([...headerRows, ...bodyRows]), [headerRows, bodyRows])
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({})
  const [result, setResult] = useState<TestExternalActionResult | null>(null)

  const testMutation = useMutation({
    mutationFn: () =>
      api
        .post('/external-actions/test', {
          method,
          url,
          headersTemplate: rowsToObject(headerRows),
          bodyTemplate: rowsToObject(bodyRows),
          sampleValues,
          accessToken: accessToken || undefined,
          timeoutMs,
        })
        .then((r) => r.data),
    onSuccess: (data: TestExternalActionResult) => setResult(data),
    onError: (err: any) =>
      toast({ title: 'Erro ao testar', description: err.response?.data?.message, variant: 'destructive' }),
  })

  return (
    <div className="rounded-lg border bg-gray-50 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-700">Testar requisição</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5 h-7 text-xs"
          disabled={!url || testMutation.isPending}
          onClick={() => testMutation.mutate()}
        >
          <Play className="h-3 w-3" />
          {testMutation.isPending ? 'Testando...' : 'Testar'}
        </Button>
      </div>

      {placeholders.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground">Valores de exemplo pros placeholders encontrados:</p>
          {placeholders.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-xs font-mono text-gray-500">{`{{${key}}}`}</span>
              <Input
                value={sampleValues[key] ?? ''}
                onChange={(e) => setSampleValues((v) => ({ ...v, [key]: e.target.value }))}
                placeholder="valor de teste"
                className="h-7 flex-1 text-xs"
              />
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className={cn('rounded-md border p-2 text-xs space-y-1', result.success ? 'border-teal-200 bg-teal-50' : 'border-red-200 bg-red-50')}>
          <p className={cn('font-medium', result.success ? 'text-teal-700' : 'text-red-700')}>
            {result.success ? `Sucesso · ${result.latencyMs}ms` : `Erro · ${result.latencyMs}ms`}
          </p>
          <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] text-gray-700">
            {result.success ? JSON.stringify(result.responseData, null, 2) : result.error}
          </pre>
        </div>
      )}
    </div>
  )
}

function ActionForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: ExternalAction
  onSave: (data: any) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [method, setMethod] = useState<ExternalActionMethod>(initial?.method ?? 'POST')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [headerRows, setHeaderRows] = useState<Row[]>(objectToRows(initial?.headersTemplate))
  const [bodyRows, setBodyRows] = useState<Row[]>(objectToRows(initial?.bodyTemplate))
  const [paramRows, setParamRows] = useState<ParamRow[]>(schemaToRows(initial?.parametersSchema))
  const [accessToken, setAccessToken] = useState('')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [timeoutMs, setTimeoutMs] = useState(initial?.timeoutMs ?? 8000)

  const valid = name.trim() && description.trim() && url.trim()

  function handleSave() {
    onSave({
      name: name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      description: description.trim(),
      method,
      url: url.trim(),
      headersTemplate: rowsToObject(headerRows),
      bodyTemplate: rowsToObject(bodyRows),
      parametersSchema: rowsToSchema(paramRows),
      ...(accessToken ? { accessToken } : {}),
      isActive,
      timeoutMs,
    })
  }

  return (
    <div className="rounded-xl border bg-white p-5 space-y-4">
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input
          autoFocus
          placeholder="consultar_cep"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">Só minúsculas, números e underscore — é o nome que a IA usa pra chamar a ferramenta</p>
      </div>

      <div className="space-y-2">
        <Label>Descrição (quando a IA deve usar isso)</Label>
        <Textarea
          placeholder="Use esta ferramenta quando o cliente informar um CEP para validar o endereço"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-16 resize-none"
        />
      </div>

      <div className="flex gap-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as ExternalActionMethod)}
          className="h-9 shrink-0 rounded-md border border-gray-200 px-3 text-sm font-medium"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
        </select>
        <Input
          placeholder="https://viacep.com.br/ws/{{cep}}/json"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 font-mono text-sm"
        />
      </div>

      <p className="rounded-md bg-gray-50 px-3 py-2 text-[11px] text-gray-600">
        Variáveis disponíveis em Headers/Corpo: <code className="font-mono">{'{{contactName}}'}</code> <code className="font-mono">{'{{contactPhone}}'}</code> <code className="font-mono">{'{{contactEmail}}'}</code> <code className="font-mono">{'{{contactCompanyName}}'}</code> <code className="font-mono">{'{{contactExternalId}}'}</code> <code className="font-mono">{'{{contactBirthDate}}'}</code> <code className="font-mono">{'{{conversationId}}'}</code> — além de qualquer campo customizado já salvo no contato (ex: se o contato tiver "cpf", use <code className="font-mono">{'{{cpf}}'}</code>). Variáveis salvas durante a conversa (via IA ou Fluxo Guiado) também ficam disponíveis aqui pelo mesmo nome.
      </p>
      <KeyValueEditor label="Headers" rows={headerRows} onChange={setHeaderRows} />
      <KeyValueEditor
        label="Corpo da requisição"
        hint="Ignorado quando o método é GET"
        rows={bodyRows}
        onChange={setBodyRows}
      />
      <ParametersEditor rows={paramRows} onChange={setParamRows} />

      <TestPanel
        method={method}
        url={url}
        headerRows={headerRows}
        bodyRows={bodyRows}
        accessToken={accessToken}
        timeoutMs={timeoutMs}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Token de acesso (opcional)</Label>
          <Input
            type="password"
            placeholder={initial?.hasAccessToken ? '•••• já configurado' : 'Bearer token'}
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Timeout (ms)</Label>
          <Input
            type="number"
            min={1000}
            max={30000}
            value={timeoutMs}
            onChange={(e) => setTimeoutMs(Number(e.target.value))}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="h-4 w-4 rounded"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <span className="text-sm font-medium text-gray-700">Ativa (disponível pra IA usar agora)</span>
      </label>

      <div className="flex gap-2 border-t pt-4">
        <Button disabled={!valid || isPending} onClick={handleSave}>
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

export default function ExternalActionsPage() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const { data: actions = [], isLoading } = useQuery<ExternalAction[]>({
    queryKey: ['external-actions'],
    queryFn: () => api.get('/external-actions').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/external-actions', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['external-actions'] })
      setShowNew(false)
      toast({ title: 'Ação criada', variant: 'success' })
    },
    onError: (err: any) =>
      toast({ title: 'Erro ao criar ação', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/external-actions/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['external-actions'] })
      setEditingId(null)
      toast({ title: 'Ação atualizada', variant: 'success' })
    },
    onError: (err: any) =>
      toast({ title: 'Erro ao atualizar ação', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/external-actions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['external-actions'] })
      setDeleteId(null)
      setDeleteConfirmText('')
      toast({ title: 'Ação excluída' })
    },
    onError: (err: any) =>
      toast({ title: 'Não foi possível excluir', description: err.response?.data?.message, variant: 'destructive' }),
  })

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-teal-900">Bot Tools</h1>
          <p className="text-sm text-muted-foreground">
            Ações externas que o bot pode chamar durante a conversa (consultar ou gravar dados via API)
          </p>
        </div>
        {!showNew && (
          <Button onClick={() => setShowNew(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova ação</span>
          </Button>
        )}
      </div>

      {showNew && (
        <div className="mb-4">
          <ActionForm
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => setShowNew(false)}
            isPending={createMutation.isPending}
          />
        </div>
      )}

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

        {!isLoading && actions.length === 0 && !showNew && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-white py-16 text-muted-foreground">
            <Webhook className="h-10 w-10 opacity-20" />
            <p className="text-sm">Nenhuma ação criada ainda</p>
            <Button size="sm" variant="outline" onClick={() => setShowNew(true)}>
              Criar primeira ação
            </Button>
          </div>
        )}

        {actions.map((action) =>
          editingId === action.id ? (
            <ActionForm
              key={action.id}
              initial={action}
              onSave={(data) => updateMutation.mutate({ id: action.id, data })}
              onCancel={() => setEditingId(null)}
              isPending={updateMutation.isPending}
            />
          ) : (
            <div key={action.id} className="rounded-xl border bg-white p-5">
              {deleteId === action.id ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    Digite <span className="font-mono font-semibold text-red-600">{action.name}</span> para confirmar a exclusão:
                  </p>
                  <input
                    autoFocus
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={action.name}
                    className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-red-300"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      disabled={deleteConfirmText !== action.name || deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(action.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deleteMutation.isPending ? 'Excluindo...' : 'Excluir permanentemente'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setDeleteId(null); setDeleteConfirmText('') }}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <Webhook className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <p className="font-medium text-gray-900 font-mono truncate">{action.name}</p>
                      <span className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        action.isActive ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-500',
                      )}>
                        {action.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-gray-900" onClick={() => setEditingId(action.id)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => { setDeleteId(action.id); setDeleteConfirmText('') }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-semibold">{action.method}</span>
                    {action.url}
                  </p>
                </>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  )
}
