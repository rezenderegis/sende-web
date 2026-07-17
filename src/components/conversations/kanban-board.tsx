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
import type { Conversation, KanbanColumn } from '@/types'
import KanbanCard from './kanban-card'
import KanbanSettings from './kanban-settings'

interface Props {
  conversations: Conversation[]
  columns: KanbanColumn[]
  onColumnsChange: () => void
  onConversationMove: () => void
  onOpenConversation: (id: string) => void
}

function DroppableColumn({
  column,
  conversations,
  onOpenConversation,
}: {
  column: KanbanColumn
  conversations: Conversation[]
  onOpenConversation: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex w-72 shrink-0 flex-col">
      {/* Header da coluna */}
      <div className="mb-3 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: column.color }} />
        <span className="font-semibold text-sm text-gray-800 truncate flex-1">{column.name}</span>
        <span className="text-xs text-gray-400 font-medium">{conversations.length}</span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 min-h-[120px] rounded-xl p-2 transition-colors',
          isOver ? 'bg-teal-50 ring-2 ring-teal-300' : 'bg-gray-50',
        )}
      >
        <SortableContext items={conversations.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {conversations.map((conv) => (
            <KanbanCard
              key={conv.id}
              conversation={conv}
              onOpen={() => onOpenConversation(conv.id)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

function UnassignedColumn({
  conversations,
  onOpenConversation,
}: {
  conversations: Conversation[]
  onOpenConversation: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: '__unassigned__' })

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full shrink-0 bg-gray-300" />
        <span className="font-semibold text-sm text-gray-400 flex-1">Sem raia</span>
        <span className="text-xs text-gray-400 font-medium">{conversations.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 min-h-[120px] rounded-xl p-2 transition-colors',
          isOver ? 'bg-teal-50 ring-2 ring-teal-300' : 'bg-gray-50',
        )}
      >
        <SortableContext items={conversations.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {conversations.map((conv) => (
            <KanbanCard
              key={conv.id}
              conversation={conv}
              onOpen={() => onOpenConversation(conv.id)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

export default function KanbanBoard({ conversations, columns, onColumnsChange, onConversationMove, onOpenConversation }: Props) {
  const qc = useQueryClient()
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const moveMutation = useMutation({
    mutationFn: ({ id, kanbanColumnId }: { id: string; kanbanColumnId: string | null }) =>
      api.patch(`/conversations/${id}`, { kanbanColumnId }),
    onSuccess: onConversationMove,
  })

  function getColumnConversations(columnId: string | null) {
    return conversations.filter((c) => (c.kanbanColumnId ?? null) === columnId)
  }

  function handleDragStart(event: DragStartEvent) {
    const conv = event.active.data.current?.conversation as Conversation
    if (conv) setActiveConv(conv)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveConv(null)
    const { active, over } = event
    if (!over) return

    const convId = active.id as string
    const conv = conversations.find((c) => c.id === convId)
    if (!conv) return

    // over pode ser o id de uma coluna ou o id de um card (cai na mesma coluna)
    let targetColumnId: string | null = null

    if (over.id === '__unassigned__') {
      targetColumnId = null
    } else if (columns.find((col) => col.id === over.id)) {
      targetColumnId = over.id as string
    } else {
      // over é um card — encontra a coluna do card alvo
      const targetConv = conversations.find((c) => c.id === over.id)
      targetColumnId = targetConv?.kanbanColumnId ?? null
    }

    if (targetColumnId !== (conv.kanbanColumnId ?? null)) {
      moveMutation.mutate({ id: convId, kanbanColumnId: targetColumnId })
    }
  }

  function handleDragOver(event: DragOverEvent) {
    // Atualização otimista visual pode ser adicionada aqui futuramente
    void event
  }

  const unassigned = getColumnConversations(null)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Toolbar do Kanban */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-2">
        <span className="text-xs text-gray-400">{conversations.length} conversas</span>
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
          {/* Coluna "Sem raia" sempre primeiro */}
          <UnassignedColumn conversations={unassigned} onOpenConversation={onOpenConversation} />

          {columns.map((col) => (
            <DroppableColumn
              key={col.id}
              column={col}
              conversations={getColumnConversations(col.id)}
              onOpenConversation={onOpenConversation}
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
          {activeConv && (
            <div className="rotate-2 opacity-90 w-72">
              <KanbanCard conversation={activeConv} onOpen={() => {}} />
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
    </div>
  )
}
