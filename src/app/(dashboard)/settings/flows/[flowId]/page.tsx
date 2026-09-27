'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Save, Trash2, X, Workflow, Star, Image as ImageIcon, GitBranch, Zap, ListChecks, Type as TypeIcon } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type {
  ExternalAction,
  Flow,
  FlowStep,
  FlowStepOption,
  FlowStepType,
  FlowStepConfig,
  ChoiceConfig,
  TextConfig,
  ContentConfig,
  ConditionConfig,
  ActionConfig,
  FlowConditionBranch,
  FlowConditionOperator,
  FlowActionType,
  Tag,
  User,
} from '@/types'

type StepNodeData = { step: FlowStep; isStart: boolean }
type StepNodeType = Node<StepNodeData, 'step'>

const ACTION_TYPE_LABELS: Record<FlowActionType, string> = {
  add_tag: 'Adicionar tag',
  remove_tag: 'Remover tag',
  update_contact: 'Atualizar contato',
  assign_user: 'Transferir p/ usuário',
  close_conversation: 'Encerrar atendimento',
  start_flow: 'Transferir p/ fluxo',
}

const CONDITION_OPERATOR_LABELS: Record<FlowConditionOperator, string> = {
  equals: 'igual a',
  not_equals: 'diferente de',
  contains: 'contém',
  not_contains: 'não contém',
  is_empty: 'está vazio',
  is_filled: 'está preenchido',
}

const BLOCK_THEME: Record<FlowStepType, { label: string; Icon: typeof ListChecks; header: string; chip: string; handle: string }> = {
  choice: { label: 'Múltipla escolha', Icon: ListChecks, header: 'bg-teal-50 text-teal-700', chip: 'bg-teal-50 text-teal-700', handle: '!bg-teal-500' },
  text: { label: 'Resposta livre', Icon: TypeIcon, header: 'bg-cyan-50 text-cyan-700', chip: 'bg-cyan-50 text-cyan-700', handle: '!bg-cyan-500' },
  content: { label: 'Conteúdo', Icon: ImageIcon, header: 'bg-blue-50 text-blue-700', chip: 'bg-blue-50 text-blue-700', handle: '!bg-blue-500' },
  condition: { label: 'Condição', Icon: GitBranch, header: 'bg-purple-50 text-purple-700', chip: 'bg-purple-50 text-purple-700', handle: '!bg-purple-500' },
  action: { label: 'Ação', Icon: Zap, header: 'bg-amber-50 text-amber-700', chip: 'bg-amber-50 text-amber-700', handle: '!bg-amber-500' },
}

const CONTACT_FIELD_OPTIONS = [
  { value: 'name', label: 'Nome' },
  { value: 'email', label: 'E-mail' },
  { value: 'companyName', label: 'Empresa' },
  { value: 'birthDate', label: 'Data de nascimento' },
  { value: 'externalId', label: 'ID externo' },
  { value: 'notes', label: 'Notas' },
]

function newOption(index: number): FlowStepOption {
  return { id: crypto.randomUUID(), label: `Opção ${index}`, value: String(index), nextStepId: null, endMessage: null, saveAsVariable: null }
}

function newConditionBranch(index: number): FlowConditionBranch {
  return { id: crypto.randomUUID(), operator: 'equals', value: '', nextStepId: null }
}

function defaultConfigFor(stepType: FlowStepType): FlowStepConfig {
  switch (stepType) {
    case 'choice':
      return { questionText: '', options: [newOption(1)], onAnswerActionName: null }
    case 'text':
      return { questionText: '', endMessage: null, saveAsVariable: null, onAnswerActionName: null }
    case 'content':
      return { contentType: 'text', text: '' }
    case 'condition':
      return { expression: '', branches: [newConditionBranch(1)], elseStepId: null }
    case 'action':
      return { actionType: 'add_tag' }
  }
}

function newStep(flowId: string, position: { x: number; y: number }, stepType: FlowStepType = 'choice'): FlowStep {
  return {
    id: crypto.randomUUID(),
    companyId: '',
    flowId,
    stepType,
    config: defaultConfigFor(stepType),
    nextStepId: null,
    positionX: position.x,
    positionY: position.y,
    createdAt: '',
    updatedAt: '',
  }
}

function actionSummary(cfg: ActionConfig, tags: Tag[], users: User[]): string {
  switch (cfg.actionType) {
    case 'add_tag':
      return `Adicionar tag: ${tags.find((t) => t.id === cfg.tagId)?.name ?? '—'}`
    case 'remove_tag':
      return `Remover tag: ${tags.find((t) => t.id === cfg.tagId)?.name ?? '—'}`
    case 'update_contact':
      return `Atualizar contato: ${cfg.contactField ?? '—'}`
    case 'assign_user':
      return `Transferir p/ ${users.find((u) => u.id === cfg.userId)?.name ?? '—'}`
    case 'close_conversation':
      return 'Encerrar atendimento'
    case 'start_flow':
      return `Iniciar fluxo: ${cfg.flowName ?? '—'}`
  }
}

function StepNode({ data }: NodeProps<StepNodeType>) {
  const { step, isStart } = data
  const { data: tags = [] } = useQuery<Tag[]>({ queryKey: ['tags'], queryFn: () => api.get('/tags').then((r) => r.data) })
  const { data: users = [] } = useQuery<User[]>({ queryKey: ['users'], queryFn: () => api.get('/users').then((r) => r.data) })

  const isChoice = step.stepType === 'choice'
  const choiceCfg = isChoice ? (step.config as ChoiceConfig) : null
  const invalid = isChoice && ((choiceCfg as ChoiceConfig).options.length > 10 || (choiceCfg as ChoiceConfig).options.length < 1)
  const theme = BLOCK_THEME[step.stepType]

  const questionText =
    step.stepType === 'choice' ? (step.config as ChoiceConfig).questionText
    : step.stepType === 'text' ? (step.config as TextConfig).questionText
    : null

  return (
    <div
      className={cn(
        'w-64 rounded-xl border bg-white shadow-sm',
        isStart ? 'border-amber-400 ring-2 ring-amber-100' : invalid ? 'border-red-400' : 'border-gray-200',
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <div className={cn('border-b px-3 py-2 rounded-t-xl flex items-center gap-1.5', theme.header)}>
        <theme.Icon className="h-3.5 w-3.5 shrink-0" />
        <p className="truncate text-xs font-semibold flex-1">{theme.label}</p>
        {isStart && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-500" />}
      </div>
      <div className="p-3 space-y-2">
        {questionText !== null && <p className="text-xs text-gray-600 line-clamp-2">{questionText || 'Pergunta não definida'}</p>}

        {step.stepType === 'choice' && (
          <div className="space-y-1">
            {(step.config as ChoiceConfig).options.map((opt) => (
              <div key={opt.id} className={cn('relative flex items-center justify-between rounded px-2 py-1 text-xs', theme.chip)}>
                <span className="truncate">{opt.label}</span>
                <Handle type="source" position={Position.Right} id={opt.id} className={theme.handle} style={{ position: 'relative', transform: 'none', right: -8 }} />
              </div>
            ))}
          </div>
        )}

        {step.stepType === 'text' && (
          <div className={cn('relative flex items-center justify-between rounded px-2 py-1 text-xs', theme.chip)}>
            <span>Resposta livre</span>
            <Handle type="source" position={Position.Right} id="next" className={theme.handle} style={{ position: 'relative', transform: 'none', right: -8 }} />
          </div>
        )}

        {step.stepType === 'content' && (
          <div className={cn('relative flex items-center justify-between gap-2 rounded px-2 py-1 text-xs', theme.chip)}>
            <span className="flex items-center gap-1 truncate">
              {(step.config as ContentConfig).contentType === 'image' ? <ImageIcon className="h-3 w-3 shrink-0" /> : null}
              {(step.config as ContentConfig).contentType === 'image'
                ? (step.config as ContentConfig).caption || 'Imagem'
                : (step.config as ContentConfig).text || 'Texto não definido'}
            </span>
            <Handle type="source" position={Position.Right} id="next" className={theme.handle} style={{ position: 'relative', transform: 'none', right: -8 }} />
          </div>
        )}

        {step.stepType === 'condition' && (
          <div className="space-y-1">
            {(step.config as ConditionConfig).branches.map((b) => (
              <div key={b.id} className={cn('relative flex items-center justify-between rounded px-2 py-1 text-xs', theme.chip)}>
                <span className="truncate">{CONDITION_OPERATOR_LABELS[b.operator]} {b.value}</span>
                <Handle type="source" position={Position.Right} id={b.id} className={theme.handle} style={{ position: 'relative', transform: 'none', right: -8 }} />
              </div>
            ))}
            <div className="relative flex items-center justify-between rounded bg-gray-50 px-2 py-1 text-xs text-gray-500">
              <span>Senão</span>
              <Handle type="source" position={Position.Right} id="else" className="!bg-gray-400" style={{ position: 'relative', transform: 'none', right: -8 }} />
            </div>
          </div>
        )}

        {step.stepType === 'action' && (
          <div className={cn('relative flex items-center justify-between rounded px-2 py-1 text-xs', theme.chip)}>
            <span className="truncate">{actionSummary(step.config as ActionConfig, tags, users)}</span>
            <Handle type="source" position={Position.Right} id="next" className={theme.handle} style={{ position: 'relative', transform: 'none', right: -8 }} />
          </div>
        )}

        {invalid && <p className="text-[10px] text-red-600">Máximo de 10 opções</p>}
      </div>
    </div>
  )
}

const nodeTypes = { step: StepNode }

function FlowCanvas() {
  const { flowId } = useParams<{ flowId: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const [nodes, setNodes, onNodesChange] = useNodesState<StepNodeType>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [startStepId, setStartStepId] = useState<string | null>(null)
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showBlockMenu, setShowBlockMenu] = useState(false)

  const { data: flow } = useQuery<Flow>({
    queryKey: ['flow', flowId],
    queryFn: () => api.get(`/flows/${flowId}`).then((r) => r.data),
  })

  const { data: steps } = useQuery<FlowStep[]>({
    queryKey: ['flow-steps', flowId],
    queryFn: () => api.get(`/flows/${flowId}/steps`).then((r) => r.data),
  })

  const { data: actions = [] } = useQuery<ExternalAction[]>({
    queryKey: ['external-actions'],
    queryFn: () => api.get('/external-actions').then((r) => r.data),
  })

  const { data: tags = [] } = useQuery<Tag[]>({ queryKey: ['tags'], queryFn: () => api.get('/tags').then((r) => r.data) })
  const { data: users = [] } = useQuery<User[]>({ queryKey: ['users'], queryFn: () => api.get('/users').then((r) => r.data) })
  const { data: allFlows = [] } = useQuery<Flow[]>({ queryKey: ['flows'], queryFn: () => api.get('/flows').then((r) => r.data) })

  useEffect(() => {
    if (!steps || loaded) return
    const initialNodes: StepNodeType[] = steps.map((step) => ({
      id: step.id,
      type: 'step',
      position: { x: step.positionX, y: step.positionY },
      data: { step, isStart: step.id === flow?.startStepId },
    }))
    const initialEdges: Edge[] = steps.flatMap((step) => {
      if (step.stepType === 'choice') {
        const cfg = step.config as ChoiceConfig
        return cfg.options
          .filter((o) => o.nextStepId)
          .map((o) => ({ id: `${step.id}-${o.id}`, source: step.id, sourceHandle: o.id, target: o.nextStepId as string }))
      }
      if (step.stepType === 'condition') {
        const cfg = step.config as ConditionConfig
        const branchEdges = cfg.branches
          .filter((b) => b.nextStepId)
          .map((b) => ({ id: `${step.id}-${b.id}`, source: step.id, sourceHandle: b.id, target: b.nextStepId as string }))
        const elseEdge = cfg.elseStepId ? [{ id: `${step.id}-else`, source: step.id, sourceHandle: 'else', target: cfg.elseStepId }] : []
        return [...branchEdges, ...elseEdge]
      }
      // text | content | action: bloco linear, um único caminho adiante
      return step.nextStepId ? [{ id: `${step.id}-next`, source: step.id, sourceHandle: 'next', target: step.nextStepId }] : []
    })
    setNodes(initialNodes)
    setEdges(initialEdges)
    setStartStepId(flow?.startStepId ?? null)
    setLoaded(true)
  }, [steps, flow, loaded, setNodes, setEdges])

  const saveGraphMutation = useMutation({
    mutationFn: (payload: { steps: any[]; deletedIds: string[] }) => api.post(`/flows/${flowId}/steps/graph`, payload),
    onSuccess: async () => {
      if (startStepId !== flow?.startStepId) {
        await api.patch(`/flows/${flowId}`, { startStepId })
      }
      qc.invalidateQueries({ queryKey: ['flow-steps', flowId] })
      qc.invalidateQueries({ queryKey: ['flow', flowId] })
      qc.invalidateQueries({ queryKey: ['flows'] })
      setDeletedIds([])
      toast({ title: 'Fluxo salvo', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao salvar', description: err.response?.data?.message, variant: 'destructive' }),
  })

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds.filter((e) => !(e.source === connection.source && e.sourceHandle === connection.sourceHandle))))
    },
    [setEdges],
  )

  const updateStep = useCallback(
    (nodeId: string, patch: Partial<FlowStep>) => {
      setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, step: { ...n.data.step, ...patch } } } : n)))
    },
    [setNodes],
  )

  const updateConfig = useCallback(
    (nodeId: string, patch: Record<string, any>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, step: { ...n.data.step, config: { ...n.data.step.config, ...patch } } } } : n)),
      )
    },
    [setNodes],
  )

  const addOption = useCallback(
    (nodeId: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n
          const cfg = n.data.step.config as ChoiceConfig
          const options = [...cfg.options, newOption(cfg.options.length + 1)]
          return { ...n, data: { ...n.data, step: { ...n.data.step, config: { ...cfg, options } } } }
        }),
      )
    },
    [setNodes],
  )

  const removeOption = useCallback(
    (nodeId: string, optionId: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n
          const cfg = n.data.step.config as ChoiceConfig
          return { ...n, data: { ...n.data, step: { ...n.data.step, config: { ...cfg, options: cfg.options.filter((o) => o.id !== optionId) } } } }
        }),
      )
      setEdges((eds) => eds.filter((e) => !(e.source === nodeId && e.sourceHandle === optionId)))
    },
    [setNodes, setEdges],
  )

  const addConditionBranch = useCallback(
    (nodeId: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n
          const cfg = n.data.step.config as ConditionConfig
          const branches = [...cfg.branches, newConditionBranch(cfg.branches.length + 1)]
          return { ...n, data: { ...n.data, step: { ...n.data.step, config: { ...cfg, branches } } } }
        }),
      )
    },
    [setNodes],
  )

  const removeConditionBranch = useCallback(
    (nodeId: string, branchId: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n
          const cfg = n.data.step.config as ConditionConfig
          return { ...n, data: { ...n.data, step: { ...n.data.step, config: { ...cfg, branches: cfg.branches.filter((b) => b.id !== branchId) } } } }
        }),
      )
      setEdges((eds) => eds.filter((e) => !(e.source === nodeId && e.sourceHandle === branchId)))
    },
    [setNodes, setEdges],
  )

  const updateConditionBranch = useCallback(
    (nodeId: string, branchId: string, patch: Partial<FlowConditionBranch>) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n
          const cfg = n.data.step.config as ConditionConfig
          return {
            ...n,
            data: {
              ...n.data,
              step: { ...n.data.step, config: { ...cfg, branches: cfg.branches.map((b) => (b.id === branchId ? { ...b, ...patch } : b)) } },
            },
          }
        }),
      )
    },
    [setNodes],
  )

  const addStep = useCallback(
    (stepType: FlowStepType) => {
      const position = { x: 100 + nodes.length * 40, y: 100 + nodes.length * 40 }
      const step = newStep(flowId, position, stepType)
      setNodes((nds) => [...nds, { id: step.id, type: 'step', position, data: { step, isStart: nds.length === 0 } }])
      if (nodes.length === 0) setStartStepId(step.id)
      setSelectedId(step.id)
      setShowBlockMenu(false)
    },
    [nodes.length, setNodes, flowId],
  )

  const deleteNode = useCallback(
    (nodeId: string) => {
      setDeletedIds((ids) => [...ids, nodeId])
      setNodes((nds) => nds.filter((n) => n.id !== nodeId))
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
      setSelectedId((id) => (id === nodeId ? null : id))
      setStartStepId((id) => (id === nodeId ? null : id))
    },
    [setNodes, setEdges],
  )

  function setAsStart(nodeId: string) {
    setStartStepId(nodeId)
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, isStart: n.id === nodeId } })))
  }

  function handleSave() {
    const invalid = nodes.find((n) => {
      if (n.data.step.stepType !== 'choice') return false
      const cfg = n.data.step.config as ChoiceConfig
      return cfg.options.length > 10 || cfg.options.length < 1
    })
    if (invalid) {
      toast({ title: 'Corrija os passos com opções inválidas antes de salvar', variant: 'destructive' })
      return
    }

    const payload = {
      steps: nodes.map((n) => {
        const step = n.data.step
        const base = { id: n.id, stepType: step.stepType, positionX: n.position.x, positionY: n.position.y }

        if (step.stepType === 'choice') {
          const cfg = step.config as ChoiceConfig
          return {
            ...base,
            config: {
              questionText: cfg.questionText,
              onAnswerActionName: cfg.onAnswerActionName || undefined,
              options: cfg.options.map((o) => ({
                id: o.id,
                label: o.label,
                value: o.value,
                nextStepId: edges.find((e) => e.source === n.id && e.sourceHandle === o.id)?.target,
                endMessage: o.endMessage || undefined,
                saveAsVariable: o.saveAsVariable?.name ? o.saveAsVariable : undefined,
              })),
            },
          }
        }
        if (step.stepType === 'text') {
          const cfg = step.config as TextConfig
          return {
            ...base,
            config: {
              questionText: cfg.questionText,
              onAnswerActionName: cfg.onAnswerActionName || undefined,
              endMessage: cfg.endMessage || undefined,
              saveAsVariable: cfg.saveAsVariable?.name ? cfg.saveAsVariable : undefined,
            },
            nextStepId: edges.find((e) => e.source === n.id && e.sourceHandle === 'next')?.target,
          }
        }
        if (step.stepType === 'condition') {
          const cfg = step.config as ConditionConfig
          return {
            ...base,
            config: {
              expression: cfg.expression,
              branches: cfg.branches.map((b) => ({
                id: b.id,
                operator: b.operator,
                value: ['is_empty', 'is_filled'].includes(b.operator) ? undefined : b.value,
                nextStepId: edges.find((e) => e.source === n.id && e.sourceHandle === b.id)?.target,
              })),
              elseStepId: edges.find((e) => e.source === n.id && e.sourceHandle === 'else')?.target,
            },
          }
        }
        // content | action: lineares
        return {
          ...base,
          config: step.config,
          nextStepId: edges.find((e) => e.source === n.id && e.sourceHandle === 'next')?.target,
        }
      }),
      deletedIds,
    }
    saveGraphMutation.mutate(payload)
  }

  const selectedNode = nodes.find((n) => n.id === selectedId)

  function handleStepTypeChange(nodeId: string, stepType: FlowStepType) {
    updateStep(nodeId, { stepType, config: defaultConfigFor(stepType), nextStepId: null })
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId))
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b bg-white px-6 py-4">
        <button
          onClick={() => router.push('/settings/flows')}
          className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar pra fluxos
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-teal-900 flex items-center gap-1.5 font-mono">
              <Workflow className="h-4 w-4" />
              {flow?.name}
            </h1>
            <p className="text-xs text-muted-foreground max-w-lg truncate">{flow?.description}</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowBlockMenu((v) => !v)}>
                <Plus className="h-3.5 w-3.5" /> Adicionar bloco
              </Button>
              {showBlockMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowBlockMenu(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-lg border bg-white py-1 shadow-lg">
                    {(Object.keys(BLOCK_THEME) as FlowStepType[]).map((type) => {
                      const theme = BLOCK_THEME[type]
                      return (
                        <button
                          key={type}
                          onClick={() => addStep(type)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md', theme.header)}>
                            <theme.Icon className="h-3.5 w-3.5" />
                          </span>
                          {theme.label}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
            <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saveGraphMutation.isPending}>
              <Save className="h-3.5 w-3.5" /> {saveGraphMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>

        {selectedNode && (
          <div className="w-80 shrink-0 overflow-y-auto border-l bg-white p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Editar bloco</p>
              <div className="flex gap-1">
                <button onClick={() => deleteNode(selectedNode.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
                <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Button
              size="sm"
              variant={selectedNode.data.isStart ? 'default' : 'outline'}
              className="w-full gap-1.5"
              onClick={() => setAsStart(selectedNode.id)}
              disabled={selectedNode.data.isStart}
            >
              <Star className="h-3.5 w-3.5" />
              {selectedNode.data.isStart ? 'Este é o passo inicial' : 'Definir como passo inicial'}
            </Button>

            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de bloco</Label>
              <select
                value={selectedNode.data.step.stepType}
                onChange={(e) => handleStepTypeChange(selectedNode.id, e.target.value as FlowStepType)}
                className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm"
              >
                <option value="choice">Múltipla escolha (botões/lista)</option>
                <option value="text">Resposta livre (texto)</option>
                <option value="content">Conteúdo (envia e segue)</option>
                <option value="condition">Condição (ramifica sem enviar nada)</option>
                <option value="action">Ação (executa e segue)</option>
              </select>
            </div>

            {(selectedNode.data.step.stepType === 'choice' || selectedNode.data.step.stepType === 'text') && (
              <div className="space-y-1.5">
                <Label className="text-xs">Pergunta</Label>
                <Textarea
                  value={(selectedNode.data.step.config as ChoiceConfig | TextConfig).questionText}
                  onChange={(e) => updateConfig(selectedNode.id, { questionText: e.target.value })}
                  placeholder="De 1 a 5, qual sua satisfação com o atendimento?"
                  className="min-h-16 resize-none text-sm"
                />
              </div>
            )}

            {selectedNode.data.step.stepType === 'text' && (
              <div className="space-y-2">
                <Label className="text-xs">Resposta</Label>
                <p className="text-[11px] text-muted-foreground">
                  Aceita qualquer texto como resposta. Arraste do ponto verde até outro passo pra encadear, ou preencha uma mensagem de encerramento abaixo.
                </p>
                {edges.some((e) => e.source === selectedNode.id && e.sourceHandle === 'next') ? (
                  <p className="text-[10px] text-teal-700">→ conectado a outro passo</p>
                ) : (
                  <Input
                    value={(selectedNode.data.step.config as TextConfig).endMessage ?? ''}
                    onChange={(e) => updateConfig(selectedNode.id, { endMessage: e.target.value || null })}
                    placeholder="Mensagem de encerramento (vazio = devolve pra IA)"
                    className="h-7 w-full text-[11px]"
                  />
                )}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <input
                    type="checkbox"
                    id={`save-var-step-${selectedNode.id}`}
                    checked={!!(selectedNode.data.step.config as TextConfig).saveAsVariable}
                    onChange={(e) => updateConfig(selectedNode.id, { saveAsVariable: e.target.checked ? { name: '', scope: 'conversation' } : null })}
                    className="h-3 w-3"
                  />
                  <label htmlFor={`save-var-step-${selectedNode.id}`} className="text-[11px] text-muted-foreground">
                    Salvar resposta como variável
                  </label>
                </div>
                {(selectedNode.data.step.config as TextConfig).saveAsVariable && (
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={(selectedNode.data.step.config as TextConfig).saveAsVariable!.name}
                      onChange={(e) =>
                        updateConfig(selectedNode.id, {
                          saveAsVariable: {
                            ...(selectedNode.data.step.config as TextConfig).saveAsVariable!,
                            name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                          },
                        })
                      }
                      placeholder="nome_variavel"
                      className="h-7 flex-1 text-[11px] font-mono"
                    />
                    <select
                      value={(selectedNode.data.step.config as TextConfig).saveAsVariable!.scope}
                      onChange={(e) =>
                        updateConfig(selectedNode.id, {
                          saveAsVariable: { ...(selectedNode.data.step.config as TextConfig).saveAsVariable!, scope: e.target.value as 'contact' | 'conversation' },
                        })
                      }
                      className="h-7 rounded-md border border-gray-200 text-[11px]"
                    >
                      <option value="conversation">Conversa (só esse atendimento)</option>
                      <option value="contact">Contato (permanente)</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs">Ação ao responder (opcional)</Label>
                  <select
                    value={(selectedNode.data.step.config as TextConfig).onAnswerActionName ?? ''}
                    onChange={(e) => updateConfig(selectedNode.id, { onAnswerActionName: e.target.value || null })}
                    className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm"
                  >
                    <option value="">Nenhuma</option>
                    {actions.map((a) => (
                      <option key={a.id} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {selectedNode.data.step.stepType === 'choice' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Opções</Label>
                  <button onClick={() => addOption(selectedNode.id)} className="flex items-center gap-1 text-xs text-teal-700 hover:underline">
                    <Plus className="h-3 w-3" /> Adicionar
                  </button>
                </div>
                {(selectedNode.data.step.config as ChoiceConfig).options.map((opt) => {
                  const connected = edges.some((e) => e.source === selectedNode.id && e.sourceHandle === opt.id)
                  const options = (selectedNode.data.step.config as ChoiceConfig).options
                  return (
                    <div key={opt.id} className="space-y-1 rounded-md border border-gray-100 p-1.5">
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={opt.label}
                          onChange={(e) => updateConfig(selectedNode.id, { options: options.map((o) => (o.id === opt.id ? { ...o, label: e.target.value } : o)) })}
                          placeholder="rótulo"
                          className="h-8 flex-1 text-xs"
                        />
                        <Input
                          value={opt.value}
                          onChange={(e) => updateConfig(selectedNode.id, { options: options.map((o) => (o.id === opt.id ? { ...o, value: e.target.value } : o)) })}
                          placeholder="valor"
                          className="h-8 w-16 text-xs font-mono"
                        />
                        <button onClick={() => removeOption(selectedNode.id, opt.id)} className="text-gray-400 hover:text-red-500">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {connected ? (
                        <p className="text-[10px] text-teal-700">→ conectado a outro passo</p>
                      ) : (
                        <Input
                          value={opt.endMessage ?? ''}
                          onChange={(e) => updateConfig(selectedNode.id, { options: options.map((o) => (o.id === opt.id ? { ...o, endMessage: e.target.value || null } : o)) })}
                          placeholder="Mensagem de encerramento (vazio = devolve pra IA)"
                          className="h-7 w-full text-[11px]"
                        />
                      )}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <input
                          type="checkbox"
                          id={`save-var-${opt.id}`}
                          checked={!!opt.saveAsVariable}
                          onChange={(e) =>
                            updateConfig(selectedNode.id, {
                              options: options.map((o) => (o.id === opt.id ? { ...o, saveAsVariable: e.target.checked ? { name: '', scope: 'conversation' } : null } : o)),
                            })
                          }
                          className="h-3 w-3"
                        />
                        <label htmlFor={`save-var-${opt.id}`} className="text-[11px] text-muted-foreground">
                          Salvar resposta como variável
                        </label>
                      </div>
                      {opt.saveAsVariable && (
                        <div className="flex items-center gap-1.5">
                          <Input
                            value={opt.saveAsVariable.name}
                            onChange={(e) =>
                              updateConfig(selectedNode.id, {
                                options: options.map((o) =>
                                  o.id === opt.id && o.saveAsVariable
                                    ? { ...o, saveAsVariable: { ...o.saveAsVariable, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') } }
                                    : o,
                                ),
                              })
                            }
                            placeholder="nome_variavel"
                            className="h-7 flex-1 text-[11px] font-mono"
                          />
                          <select
                            value={opt.saveAsVariable.scope}
                            onChange={(e) =>
                              updateConfig(selectedNode.id, {
                                options: options.map((o) =>
                                  o.id === opt.id && o.saveAsVariable ? { ...o, saveAsVariable: { ...o.saveAsVariable, scope: e.target.value as 'contact' | 'conversation' } } : o,
                                ),
                              })
                            }
                            className="h-7 rounded-md border border-gray-200 text-[11px]"
                          >
                            <option value="conversation">Conversa (só esse atendimento)</option>
                            <option value="contact">Contato (permanente)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )
                })}
                <p className="text-[11px] text-muted-foreground">
                  Arraste do ponto verde até outro passo pra encadear. Sem conexão: se tiver mensagem de encerramento, envia e para; se não tiver, devolve o controle pra IA na hora.
                </p>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs">Ação ao responder (opcional)</Label>
                  <select
                    value={(selectedNode.data.step.config as ChoiceConfig).onAnswerActionName ?? ''}
                    onChange={(e) => updateConfig(selectedNode.id, { onAnswerActionName: e.target.value || null })}
                    className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm"
                  >
                    <option value="">Nenhuma</option>
                    {actions.map((a) => (
                      <option key={a.id} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {selectedNode.data.step.stepType === 'content' && (
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" /> Conteúdo
                </Label>
                <select
                  value={(selectedNode.data.step.config as ContentConfig).contentType}
                  onChange={(e) => updateConfig(selectedNode.id, { contentType: e.target.value as 'text' | 'image' })}
                  className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm"
                >
                  <option value="text">Texto</option>
                  <option value="image">Imagem</option>
                </select>
                {(selectedNode.data.step.config as ContentConfig).contentType === 'text' ? (
                  <Textarea
                    value={(selectedNode.data.step.config as ContentConfig).text ?? ''}
                    onChange={(e) => updateConfig(selectedNode.id, { text: e.target.value })}
                    placeholder="Mensagem a enviar"
                    className="min-h-16 resize-none text-sm"
                  />
                ) : (
                  <>
                    <Input
                      value={(selectedNode.data.step.config as ContentConfig).imageUrl ?? ''}
                      onChange={(e) => updateConfig(selectedNode.id, { imageUrl: e.target.value })}
                      placeholder="https://.../imagem.jpg"
                      className="text-sm"
                    />
                    <Input
                      value={(selectedNode.data.step.config as ContentConfig).caption ?? ''}
                      onChange={(e) => updateConfig(selectedNode.id, { caption: e.target.value })}
                      placeholder="Legenda (opcional)"
                      className="text-sm"
                    />
                  </>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Envia e segue automaticamente pro próximo bloco, sem esperar resposta. Arraste do ponto verde pra encadear.
                </p>
              </div>
            )}

            {selectedNode.data.step.stepType === 'condition' && (
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <GitBranch className="h-3.5 w-3.5" /> Comparar
                </Label>
                <Input
                  value={(selectedNode.data.step.config as ConditionConfig).expression}
                  onChange={(e) => updateConfig(selectedNode.id, { expression: e.target.value })}
                  placeholder="{{nome}} ou {{cpf}}"
                  className="text-sm font-mono"
                />
                <p className="text-[11px] text-muted-foreground">Use {'{{variavel}}'} — sem chaves, normalizamos ao sair do campo.</p>

                <div className="flex items-center justify-between pt-1">
                  <Label className="text-xs">Ramificações</Label>
                  <button onClick={() => addConditionBranch(selectedNode.id)} className="flex items-center gap-1 text-xs text-teal-700 hover:underline">
                    <Plus className="h-3 w-3" /> Adicionar
                  </button>
                </div>
                {(selectedNode.data.step.config as ConditionConfig).branches.map((branch, idx) => {
                  const connected = edges.some((e) => e.source === selectedNode.id && e.sourceHandle === branch.id)
                  return (
                    <div key={branch.id} className="space-y-1 rounded-md border border-gray-100 p-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-semibold text-purple-700">{idx + 1}</span>
                        <select
                          value={branch.operator}
                          onChange={(e) => updateConditionBranch(selectedNode.id, branch.id, { operator: e.target.value as FlowConditionOperator })}
                          className="h-8 flex-1 rounded-md border border-gray-200 px-2 text-xs"
                        >
                          {(Object.keys(CONDITION_OPERATOR_LABELS) as FlowConditionOperator[]).map((op) => (
                            <option key={op} value={op}>{CONDITION_OPERATOR_LABELS[op]}</option>
                          ))}
                        </select>
                        <button onClick={() => removeConditionBranch(selectedNode.id, branch.id)} className="text-gray-400 hover:text-red-500">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {!['is_empty', 'is_filled'].includes(branch.operator) && (
                        <Input
                          value={branch.value ?? ''}
                          onChange={(e) => updateConditionBranch(selectedNode.id, branch.id, { value: e.target.value })}
                          placeholder="valor a comparar"
                          className="h-8 text-xs"
                        />
                      )}
                      {connected && <p className="text-[10px] text-teal-700">→ conectado a outro passo</p>}
                    </div>
                  )
                })}
                <div className="rounded-md border border-gray-100 p-1.5">
                  <p className="text-xs font-medium text-gray-600">Senão</p>
                  {edges.some((e) => e.source === selectedNode.id && e.sourceHandle === 'else') && (
                    <p className="text-[10px] text-teal-700">→ conectado a outro passo</p>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Não envia nada — só avalia e segue direto pro passo ligado à ramificação que bater (ou pro "senão").
                </p>
              </div>
            )}

            {selectedNode.data.step.stepType === 'action' && (
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" /> Ação
                </Label>
                <select
                  value={(selectedNode.data.step.config as ActionConfig).actionType}
                  onChange={(e) => updateConfig(selectedNode.id, { actionType: e.target.value as FlowActionType })}
                  className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm"
                >
                  {(Object.keys(ACTION_TYPE_LABELS) as FlowActionType[]).map((at) => (
                    <option key={at} value={at}>{ACTION_TYPE_LABELS[at]}</option>
                  ))}
                </select>

                {['add_tag', 'remove_tag'].includes((selectedNode.data.step.config as ActionConfig).actionType) && (
                  <select
                    value={(selectedNode.data.step.config as ActionConfig).tagId ?? ''}
                    onChange={(e) => updateConfig(selectedNode.id, { tagId: e.target.value || undefined })}
                    className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm"
                  >
                    <option value="">Selecione a tag</option>
                    {tags.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}

                {(selectedNode.data.step.config as ActionConfig).actionType === 'update_contact' && (
                  <>
                    <select
                      value={
                        (selectedNode.data.step.config as ActionConfig).contactField?.startsWith('metadata:')
                          ? 'custom'
                          : (selectedNode.data.step.config as ActionConfig).contactField ?? ''
                      }
                      onChange={(e) => updateConfig(selectedNode.id, { contactField: e.target.value === 'custom' ? 'metadata:' : e.target.value || undefined })}
                      className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm"
                    >
                      <option value="">Selecione o campo</option>
                      {CONTACT_FIELD_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                      <option value="custom">Campo customizado</option>
                    </select>
                    {(selectedNode.data.step.config as ActionConfig).contactField?.startsWith('metadata:') && (
                      <Input
                        value={(selectedNode.data.step.config as ActionConfig).contactField!.slice(9)}
                        onChange={(e) => updateConfig(selectedNode.id, { contactField: 'metadata:' + e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                        placeholder="nome_do_campo"
                        className="text-sm font-mono"
                      />
                    )}
                    <Input
                      value={(selectedNode.data.step.config as ActionConfig).contactValue ?? ''}
                      onChange={(e) => updateConfig(selectedNode.id, { contactValue: e.target.value })}
                      placeholder="Novo valor (aceita {{variavel}})"
                      className="text-sm"
                    />
                  </>
                )}

                {(selectedNode.data.step.config as ActionConfig).actionType === 'assign_user' && (
                  <select
                    value={(selectedNode.data.step.config as ActionConfig).userId ?? ''}
                    onChange={(e) => updateConfig(selectedNode.id, { userId: e.target.value || undefined })}
                    className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm"
                  >
                    <option value="">Selecione o usuário</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                )}

                {(selectedNode.data.step.config as ActionConfig).actionType === 'close_conversation' && (
                  <Input
                    value={(selectedNode.data.step.config as ActionConfig).closeReason ?? ''}
                    onChange={(e) => updateConfig(selectedNode.id, { closeReason: e.target.value })}
                    placeholder="Motivo do encerramento (opcional)"
                    className="text-sm"
                  />
                )}

                {(selectedNode.data.step.config as ActionConfig).actionType === 'start_flow' && (
                  <select
                    value={(selectedNode.data.step.config as ActionConfig).flowName ?? ''}
                    onChange={(e) => updateConfig(selectedNode.id, { flowName: e.target.value || undefined })}
                    className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm"
                  >
                    <option value="">Selecione o fluxo</option>
                    {allFlows.filter((f) => f.id !== flowId).map((f) => (
                      <option key={f.id} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                )}

                <p className="text-[11px] text-muted-foreground">
                  Executa a ação e segue automaticamente pro próximo bloco, sem esperar resposta. Arraste do ponto verde pra encadear.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function FlowCanvasPage() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  )
}
