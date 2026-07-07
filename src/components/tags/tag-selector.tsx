'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tag as TagIcon, Plus, Check, X } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import type { Tag } from '@/types'

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
]

interface TagSelectorProps {
  assignedTags: Tag[]
  addEndpoint: string
  removeEndpoint: (tagId: string) => string
  invalidateKeys: string[][]
}

export function TagSelector({ assignedTags, addEndpoint, removeEndpoint, invalidateKeys }: TagSelectorProps) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newColor, setNewColor] = useState(COLORS[0])
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
        setCreating(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: () => api.get('/tags').then((r) => r.data),
  })

  const invalidate = () => invalidateKeys.forEach((key) => qc.invalidateQueries({ queryKey: key }))

  const addMutation = useMutation({
    mutationFn: (tagId: string) => api.post(addEndpoint, { tagId }),
    onSuccess: invalidate,
    onError: () => toast({ title: 'Erro ao adicionar tag', variant: 'destructive' }),
  })

  const removeMutation = useMutation({
    mutationFn: (tagId: string) => api.delete(removeEndpoint(tagId)),
    onSuccess: invalidate,
    onError: () => toast({ title: 'Erro ao remover tag', variant: 'destructive' }),
  })

  const createMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      api.post('/tags', { name, color }).then((r) => r.data),
    onSuccess: (tag: Tag) => {
      qc.invalidateQueries({ queryKey: ['tags'] })
      addMutation.mutate(tag.id)
      setSearch('')
      setCreating(false)
    },
    onError: (err: any) => {
      const msg = err.response?.status === 409 ? 'Já existe uma tag com esse nome' : 'Erro ao criar tag'
      toast({ title: msg, variant: 'destructive' })
    },
  })

  const filtered = allTags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  )
  const isAssigned = (tagId: string) => assignedTags.some((t) => t.id === tagId)
  const exactMatch = filtered.some(
    (t) => t.name.toLowerCase() === search.trim().toLowerCase(),
  )
  const showCreate = search.trim().length > 0 && !exactMatch

  function toggleTag(tag: Tag) {
    if (isAssigned(tag.id)) {
      removeMutation.mutate(tag.id)
    } else {
      addMutation.mutate(tag.id)
    }
  }

  function handleCreate() {
    if (!search.trim()) return
    if (creating) {
      createMutation.mutate({ name: search.trim(), color: newColor })
    } else {
      setCreating(true)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-colors"
      >
        <TagIcon className="h-3 w-3" />
        <span>+ Tag</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border bg-white shadow-lg">
          <div className="p-2">
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCreating(false) }}
              placeholder="Buscar ou criar tag..."
              className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filtered.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="flex-1 text-left truncate">{tag.name}</span>
                {isAssigned(tag.id) && <Check className="h-3 w-3 text-green-600 shrink-0" />}
              </button>
            ))}

            {filtered.length === 0 && !showCreate && (
              <p className="px-3 py-2 text-xs text-gray-400">Nenhuma tag encontrada</p>
            )}
          </div>

          {showCreate && (
            <div className="border-t p-2">
              {creating && (
                <div className="mb-2">
                  <p className="mb-1.5 text-xs text-gray-500">Escolha uma cor:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewColor(c)}
                        className={cn(
                          'h-5 w-5 rounded-full transition-transform hover:scale-110',
                          newColor === c && 'ring-2 ring-offset-1 ring-gray-400',
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-green-700 hover:bg-green-50"
              >
                <Plus className="h-3 w-3" />
                {creating
                  ? `Criar "${search.trim()}" com esta cor`
                  : `Criar tag "${search.trim()}"`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
