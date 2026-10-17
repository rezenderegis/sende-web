'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Settings2 } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import type { KanbanLead, KanbanColumn } from '@/types'
import KanbanCard from './kanban-card'
import KanbanSettings from './kanban-settings'
import QuickAddLeadModal from './quick-add-lead-modal'

interface Props {
  leads: KanbanLead[]
  columns: KanbanColumn[]
  onColumnsChange: () => void
  onLeadMove: () => void
}

function tint(color: string, alphaHex: string) {
  return `${color}${alphaHex}`
}

function DroppableColumn({
  column,
  leads,
  onOpenLead,
  onAddLead,
}: {
  column: KanbanColumn
  leads: KanbanLead[]
  onOpenLead: (lead: KanbanLead) => void
  onAddLead: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex w-80 shrink-0 flex-col rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      {/* Header da coluna */}
      <div
        className="flex items-center gap-2 rounded-t-2xl px-4 py-3"
        style={{ backgroundColor: tint(column.color, '21') }}
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: column.color }} />
        <span className="font-semibold text-sm text-gray-800 truncate flex-1">{column.name}</span>
        <button
          onClick={onAddLead}
          className="rounded-full p-1 text-gray-500 transition-colors hover:bg-white/70 hover:text-gray-800"
          title="Adicionar lead nesta raia"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <span
          className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white"
          style={{ backgroundColor: column.color }}
        >
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-1 flex-col gap-2.5 rounded-b-2xl p-3 transition-colors min-h-[140px]',
          isOver ? 'bg-black/[0.03]' : 'bg-transparent',
        )}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              onOpen={() => onOpenLead(lead)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

function UnassignedColumn({
  leads,
  onOpenLead,
}: {
  leads: KanbanLead[]
  onOpenLead: (lead: KanbanLead) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: '__unassigned__' })

  return (
    <div className="flex w-80 shrink-0 flex-col rounded-2xl bg-white/70 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-2 rounded-t-2xl bg-gray-100 px-4 py-3">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-gray-300" />
        <span className="font-semibold text-sm text-gray-500 flex-1">Sem raia</span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-400 px-1 text-[11px] font-bold text-white">
          {leads.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-1 flex-col gap-2.5 rounded-b-2xl p-3 transition-colors min-h-[140px]',
          isOver ? 'bg-black/[0.03]' : 'bg-transparent',
        )}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              onOpen={() => onOpenLead(lead)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

export default function KanbanBoard({ leads, columns, onColumnsChange, onLeadMove }: Props) {
  const router = useRouter()
  const qc = useQueryClient()
  const [activeLead, setActiveLead] = useState<KanbanLead | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [quickAddColumnId, setQuickAddColumnId] = useState<string | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const moveMutation = useMutation({
    mutationFn: ({ id, kanbanColumnId }: { id: string; kanbanColumnId: string | null }) =>
      api.patch(`/contacts/${id}`, { kanbanColumnId }),
    onSuccess: onLeadMove,
  })

  function getColumnLeads(columnId: string | null) {
    return leads.filter((l) => (l.kanbanColumnId ?? null) === columnId)
  }

  function handleDragStart(event: DragStartEvent) {
    const lead = event.active.data.current?.lead as KanbanLead
    if (lead) setActiveLead(lead)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveLead(null)
    const { active, over } = event
    if (!over) return

    const leadId = active.id as string
    const lead = leads.find((l) => l.id === leadId)
    if (!lead) return

    let targetColumnId: string | null = null

    if (over.id === '__unassigned__') {
      targetColumnId = null
    } else if (columns.find((col) => col.id === over.id)) {
      targetColumnId = over.id as string
    } else {
      const targetLead = leads.find((l) => l.id === over.id)
      targetColumnId = targetLead?.kanbanColumnId ?? null
    }

    if (targetColumnId !== (lead.kanbanColumnId ?? null)) {
      moveMutation.mutate({ id: leadId, kanbanColumnId: targetColumnId })
    }
  }

  function handleDragOver(event: DragOverEvent) {
    void event
  }

  function openLead(lead: KanbanLead) {
    // Sempre abre a tela de detalhe (CRM) do contato — a conversa fica
    // acessível a partir de lá, num botão, não substitui a tela toda.
    router.push(`/conversations/kanban/${lead.id}`)
  }

  function openQuickAdd(columnId: string | null) {
    setQuickAddColumnId(columnId)
    setShowQuickAdd(true)
  }

  const unassigned = getColumnLeads(null)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Toolbar do Kanban */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-2">
        <span className="text-xs text-gray-400">{leads.length} leads</span>
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Gerenciar raias
        </button>
      </div>

      {/* Board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
        <div className="flex flex-1 items-start gap-5 overflow-x-auto bg-gradient-to-b from-slate-50 to-slate-100 p-6">
          <UnassignedColumn leads={unassigned} onOpenLead={openLead} />

          {columns.map((col) => (
            <DroppableColumn
              key={col.id}
              column={col}
              leads={getColumnLeads(col.id)}
              onOpenLead={openLead}
              onAddLead={() => openQuickAdd(col.id)}
            />
          ))}

          {/* Botão adicionar coluna */}
          <div className="flex w-80 shrink-0">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-white/40 px-4 py-3 text-sm font-medium text-gray-500 hover:border-teal-400 hover:bg-white hover:text-teal-700 transition-colors w-full justify-center"
            >
              <Plus className="h-4 w-4" />
              Nova raia
            </button>
          </div>
        </div>

        <DragOverlay>
          {activeLead && (
            <div className="rotate-2 opacity-90 w-72">
              <KanbanCard lead={activeLead} onOpen={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {showSettings && (
        <KanbanSettings
          columns={columns}
          onClose={() => setShowSettings(false)}
          onChange={onColumnsChange}
        />
      )}

      {showQuickAdd && (
        <QuickAddLeadModal
          kanbanColumnId={quickAddColumnId}
          onClose={() => { setShowQuickAdd(false); qc.invalidateQueries({ queryKey: ['kanban-leads'] }) }}
        />
      )}
    </div>
  )
}
