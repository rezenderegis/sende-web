'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Search, X, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import type { ExternalAction, Flow } from '@/types'

function Combobox<T extends { id: string; name: string; description?: string }>({
  items,
  selected,
  onChange,
  placeholder,
  emptyLabel,
  emptyHref,
}: {
  items: T[]
  selected: string[] | null // null = todos
  onChange: (next: string[] | null) => void
  placeholder: string
  emptyLabel: string
  emptyHref: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const isAll = selected === null
  const selectedItems = isAll ? items : items.filter((i) => selected!.includes(i.name))
  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))

  function removeChip(name: string) {
    const base = isAll ? items.map((i) => i.name) : selected!
    onChange(base.filter((n) => n !== name))
  }

  function toggleItem(name: string) {
    const base = isAll ? items.map((i) => i.name) : selected!
    if (base.includes(name)) onChange(base.filter((n) => n !== name))
    else onChange([...base, name])
  }

  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {emptyLabel} — <Link href={emptyHref} className="text-teal-700 hover:underline">criar</Link>
      </p>
    )
  }

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen(true)}
        className="flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-gray-200 px-2 py-1.5 cursor-text focus-within:ring-2 focus-within:ring-teal-600/30"
      >
        {isAll ? (
          <span className="flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
            Todas
            <button onClick={(e) => { e.stopPropagation(); onChange([]) }} className="hover:text-teal-900">
              <X className="h-3 w-3" />
            </button>
          </span>
        ) : (
          selectedItems.map((item) => (
            <span key={item.id} className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">
              {item.name}
              <button onClick={(e) => { e.stopPropagation(); removeChip(item.name) }} className="text-gray-400 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={selectedItems.length === 0 && !isAll ? placeholder : ''}
          className="min-w-[80px] flex-1 bg-transparent text-xs outline-none"
        />
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform', open && 'rotate-180')} />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow-lg">
          <button
            onClick={() => { onChange(null); setOpen(false); setSearch('') }}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50',
              isAll && 'bg-teal-50/60',
            )}
          >
            <Check className={cn('h-3.5 w-3.5', isAll ? 'opacity-100 text-teal-600' : 'opacity-0')} />
            <span className="font-medium">Selecionar todas</span>
          </button>
          <div className="max-h-48 overflow-y-auto border-t">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum resultado para "{search}"</p>
            )}
            {filtered.map((item) => {
              const checked = isAll || selected!.includes(item.name)
              return (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.name)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50"
                >
                  <Check className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', checked ? 'opacity-100 text-teal-600' : 'opacity-0')} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-gray-700">{item.name}</span>
                    {item.description && <span className="block truncate text-[11px] text-muted-foreground">{item.description}</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function ToolFlowSelector({
  enabledToolNames,
  enabledFlowNames,
  onChange,
}: {
  enabledToolNames: string[] | null
  enabledFlowNames: string[] | null
  onChange: (patch: { enabledToolNames?: string[] | null; enabledFlowNames?: string[] | null }) => void
}) {
  const { data: actions = [] } = useQuery<ExternalAction[]>({
    queryKey: ['external-actions'],
    queryFn: () => api.get('/external-actions').then((r) => r.data),
  })
  const { data: entryFlows = [] } = useQuery<Flow[]>({
    queryKey: ['flows'],
    queryFn: () => api.get('/flows').then((r) => r.data),
  })

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-gray-700">Bot Tools</span>
        <Combobox
          items={actions}
          selected={enabledToolNames}
          onChange={(next) => onChange({ enabledToolNames: next })}
          placeholder="Buscar tool..."
          emptyLabel="Nenhuma tool cadastrada ainda"
          emptyHref="/settings/actions"
        />
      </div>

      <div className="space-y-1.5">
        <span className="text-xs font-medium text-gray-700">Fluxos Guiados</span>
        <Combobox
          items={entryFlows}
          selected={enabledFlowNames}
          onChange={(next) => onChange({ enabledFlowNames: next })}
          placeholder="Buscar fluxo..."
          emptyLabel="Nenhum fluxo com entrada configurada ainda"
          emptyHref="/settings/flows"
        />
      </div>
    </div>
  )
}
