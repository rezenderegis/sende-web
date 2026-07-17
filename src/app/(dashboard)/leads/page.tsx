'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Mail, Phone, Users2 } from 'lucide-react'
import api from '@/lib/api'
import { formatPhone } from '@/lib/utils'
import type { Lead } from '@/types'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}min atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  const d = Math.floor(h / 24)
  return `${d}d atrás`
}

function LeadRow({ lead }: { lead: Lead }) {
  return (
    <div className="group flex items-center gap-4 px-4 py-3.5 hover:bg-teal-50/40 transition-colors border-b border-[#EEF2F6] last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
        {lead.name?.charAt(0)?.toUpperCase() ?? '?'}
      </div>

      <div className="min-w-0 w-40 shrink-0">
        <p className="truncate text-sm font-semibold text-ink">{lead.name}</p>
        <p className="text-xs text-ink-faint">{formatPhone(lead.phone)}</p>
      </div>

      <div className="min-w-0 flex-1 flex items-center gap-1.5">
        <Mail className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
        <p className="truncate text-sm text-ink-soft">{lead.email}</p>
      </div>

      <div className="w-32 shrink-0 hidden lg:flex items-center gap-1.5 text-right justify-end">
        <Phone className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
        <p className="text-xs text-ink-faint">{formatPhone(lead.phone)}</p>
      </div>

      <div className="w-24 shrink-0 hidden lg:block text-right">
        <p className="text-xs text-ink-faint">{timeAgo(lead.createdAt)}</p>
      </div>
    </div>
  )
}

export default function LeadsPage() {
  const [search, setSearch] = useState('')

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: () => api.get('/leads').then((r) => r.data),
  })

  const formLeads = useMemo(() => leads.filter((l) => l.source === 'form'), [leads])

  const filtered = useMemo(() => {
    if (!search) return formLeads
    const q = search.toLowerCase()
    return formLeads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.includes(q),
    )
  }, [formLeads, search])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[#EEF2F6] bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-teal-900">Leads</h1>
            <p className="text-sm text-ink-faint">Contatos que se cadastraram pelo formulário do site</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Search */}
        <div className="mb-4 relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-pill border border-[#EEF2F6] bg-white py-2 pl-9 pr-4 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        {/* Table */}
        <div className="rounded-card border border-[#EEF2F6] bg-white shadow-sende-sm overflow-hidden">
          <div className="hidden md:flex items-center gap-4 border-b border-[#EEF2F6] bg-gray-50/60 px-4 py-2.5">
            <div className="w-9 shrink-0" />
            <div className="w-40 shrink-0 text-xs font-semibold uppercase tracking-wider text-ink-faint">Contato</div>
            <div className="flex-1 text-xs font-semibold uppercase tracking-wider text-ink-faint">E-mail</div>
            <div className="w-32 shrink-0 hidden lg:block text-right text-xs font-semibold uppercase tracking-wider text-ink-faint">Telefone</div>
            <div className="w-24 shrink-0 hidden lg:block text-right text-xs font-semibold uppercase tracking-wider text-ink-faint">Quando</div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-ink-faint">
              Carregando leads...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-sm text-ink-faint gap-2">
              <Users2 className="h-8 w-8 text-teal-200" />
              <p>Nenhum lead encontrado</p>
            </div>
          ) : (
            filtered.map((lead) => <LeadRow key={lead.id} lead={lead} />)
          )}
        </div>

        {filtered.length > 0 && (
          <p className="mt-3 text-xs text-ink-faint text-right">
            {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  )
}
