'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertTriangle, Filter } from 'lucide-react'
import { useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { formatPhone } from '@/lib/utils'
import type { Broadcast } from '@/types'

interface FailureRow {
  id: string
  broadcastId: string
  broadcastName: string
  contactId: string
  contactName: string
  contactPhone: string
  error: string | null
  sentAt: string | null
  createdAt: string
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function FailuresPage() {
  const router = useRouter()
  const [broadcastId, setBroadcastId] = useState<string>('')

  const { data: broadcasts = [] } = useQuery<Broadcast[]>({
    queryKey: ['broadcasts'],
    queryFn: () => api.get('/broadcasts').then((r) => r.data),
  })

  const broadcastsWithFailures = broadcasts.filter((b) => b.failedCount > 0)

  const { data: failures = [], isLoading } = useQuery<FailureRow[]>({
    queryKey: ['broadcast-failures', broadcastId],
    queryFn: () =>
      api
        .get('/broadcasts/failures', { params: broadcastId ? { broadcastId } : {} })
        .then((r) => r.data),
    refetchInterval: 30000,
  })

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-white px-4 py-3 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/broadcasts')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h1 className="text-base font-semibold text-gray-900">Falhas de Entrega</h1>
        </div>
        <div className="ml-auto flex items-center gap-2 min-w-0">
          <Filter className="h-4 w-4 text-gray-400 shrink-0" />
          <select
            value={broadcastId}
            onChange={(e) => setBroadcastId(e.target.value)}
            className="text-sm border rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary min-w-0 max-w-[200px] truncate"
          >
            <option value="">Todos</option>
            {broadcastsWithFailures.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.failedCount})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            Carregando...
          </div>
        ) : failures.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
            <AlertTriangle className="h-8 w-8" />
            <p className="text-sm">Nenhuma falha encontrada</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500 font-medium">
              {failures.length} falha{failures.length !== 1 ? 's' : ''} encontrada{failures.length !== 1 ? 's' : ''}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">
                    <th className="px-4 py-3">Contato</th>
                    <th className="px-4 py-3">Número</th>
                    <th className="px-4 py-3">Broadcast</th>
                    <th className="px-4 py-3">Erro</th>
                    <th className="px-4 py-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {failures.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {row.contactName !== row.contactPhone ? row.contactName : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                        {formatPhone(row.contactPhone)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => router.push(`/broadcasts/${row.broadcastId}`)}
                          className="text-primary hover:underline text-left"
                        >
                          {row.broadcastName}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-red-600 text-xs max-w-xs truncate" title={row.error ?? undefined}>
                        {row.error || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(row.sentAt ?? row.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
