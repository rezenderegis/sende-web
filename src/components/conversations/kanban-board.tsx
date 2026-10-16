'use client'

import { useState } from 'react'
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
import LeadDetailModal from './lead-detail-modal'

interface Props {
  leads: KanbanLead[]
  columns: KanbanColumn[]
  onColumnsChange: () => void
  onLeadMove: () => void
  onOpenConversation: (id: string) => void
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
    <div className="flex w-72 shrink-0 flex-col">
      {/* Header da coluna */}
      <div
        className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2"
        style={{ backgroundColor: tint(column.color, '17'), borderLeft: `3px solid ${column.color}` }}
      >
        <span className="font-semibold text-sm text-gray-800 truncate flex-1">{column.name}</span>
        <button
          onClick={onAddLead}
          className="rounded-full p-0.5 text-gray-400 transition-colors hover:bg-white/60 hover:text-gray-700"
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
        className="flex flex-col gap-2 min-h-[120px] rounded-xl border-t-2 p-2 transition-colors"
        style={{
          borderTopColor: column.color,
          backgroundColor: isOver ? tint(column.color, '26') : tint(column.color, '0A'),
        }}
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
  onAddLead,
}: {
  leads: KanbanLead[]
  onOpenLead: (lead: KanbanLead) => void
  onAddLead: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: '__unassigned__' })

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2 rounded-lg border-l-[3px] border-gray-300 bg-gray-100 px-3 py-2">
        <span className="font-semibold text-sm text-gray-500 flex-1">Sem raia</span>
        <button
          onClick={onAddLead}
          className="rounded-full p-0.5 text-gray-400 transition-colors hover:bg-white hover:text-gray-700"
          title="Adicionar lead sem raia"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-400 px-1 text-[11px] font-bold text-white">
          {leads.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 min-h-[120px] rounded-xl border-t-2 border-gray-300 p-2 transition-colors',
          isOver ? 'bg-gray-200' : 'bg-gray-50',
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

export default function KanbanBoard({ leads, columns, onColumnsChange, onLeadMove, onOpenConversation }: Props) {
  const qc = useQueryClient()
  const [activeLead, setActiveLead] = useState<KanbanLead | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [quickAddColumnId, setQuickAddColumnId] = useState<string | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null)

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
    if (lead.conversation) {
      onOpenConversation(lead.conversation.id)
    } else {
      setSelectedLead(lead)
    }
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
        <div className="flex flex-1 gap-4 overflow-x-auto p-6">
          <UnassignedColumn leads={unassigned} onOpenLead={openLead} onAddLead={() => openQuickAdd(null)} />

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
          <div className="flex w-72 shrink-0 items-start pt-8">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 text-sm font-medium text-gray-400 hover:border-teal-300 hover:text-teal-600 transition-colors w-full justify-center"
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

      {selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  )
}
