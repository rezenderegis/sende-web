'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Trash2, GripVertical } from 'lucide-react'
import api from '@/lib/api'
import type { KanbanColumn } from '@/types'

const PRESET_COLORS = [
  '#6B7280', '#EF4444', '#F97316', '#EAB308',
  '#22C55E', '#14B8A6', '#3B82F6', '#8B5CF6',
  '#EC4899', '#0D9488',
]

interface Props {
  columns: KanbanColumn[]
  onClose: () => void
  onChange: () => void
}

export default function KanbanSettings({ columns, onClose, onChange }: Props) {
  const qc = useQueryClient()
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#0D9488')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['kanban-columns'] })
    onChange()
  }

  const createMutation = useMutation({
    mutationFn: () => api.post('/kanban-columns', { name: newName, color: newColor }),
    onSuccess: () => { invalidate(); setNewName('') },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name, color }: { id: string; name?: string; color?: string }) =>
      api.patch(`/kanban-columns/${id}`, { name, color }),
    onSuccess: () => { invalidate(); setEditingId(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/kanban-columns/${id}`),
    onSuccess: invalidate,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900">Gerenciar raias</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Colunas existentes */}
        <div className="max-h-72 overflow-y-auto px-6 py-4 space-y-2">
          {columns.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma raia criada ainda</p>
          )}
          {columns.map((col) => (
            <div key={col.id} className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5">
              <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
              <span className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: col.color }} />

              {editingId === col.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => {
                    if (editName.trim() && editName !== col.name) {
                      updateMutation.mutate({ id: col.id, name: editName.trim() })
                    } else {
                      setEditingId(null)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="flex-1 rounded-lg border border-teal-400 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              ) : (
                <span
                  className="flex-1 text-sm font-medium text-gray-700 cursor-pointer hover:text-teal-600"
                  onClick={() => { setEditingId(col.id); setEditName(col.name) }}
                >
                  {col.name}
                </span>
              )}

              {/* Seletor de cor inline */}
              <div className="flex gap-1">
                {PRESET_COLORS.slice(0, 5).map((c) => (
                  <button
                    key={c}
                    onClick={() => updateMutation.mutate({ id: col.id, color: c })}
                    className="h-4 w-4 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: col.color === c ? '#1f2937' : 'transparent',
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => deleteMutation.mutate(col.id)}
                className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Nova coluna */}
        <div className="border-t px-6 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Nova raia</p>
          <div className="flex gap-2 mb-3">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: newColor === c ? '#1f2937' : 'transparent',
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 flex-1 rounded-xl border border-gray-200 px-3 py-2">
              <span className="h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: newColor }} />
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && newName.trim() && createMutation.mutate()}
                placeholder="Nome da raia..."
                className="flex-1 text-sm outline-none placeholder-gray-400"
              />
            </div>
            <button
              onClick={() => newName.trim() && createMutation.mutate()}
              disabled={!newName.trim() || createMutation.isPending}
              className="flex items-center gap-1 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Criar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
