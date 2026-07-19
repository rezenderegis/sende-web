'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { AdminCompanySummary, ReconciliationResult } from '@/types'

function centsToReais(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function startOfMonthInput(): string {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

function todayInput(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function ReconciliationPage() {
  const [numberId, setNumberId] = useState('')
  const [since, setSince] = useState(startOfMonthInput())
  const [until, setUntil] = useState(todayInput())
  const [result, setResult] = useState<ReconciliationResult | null>(null)
  const [loading, setLoading] = useState(false)

  const { data: companies = [] } = useQuery<AdminCompanySummary[]>({
    queryKey: ['admin-companies'],
    queryFn: () => api.get('/admin/companies').then((r) => r.data),
  })

  const numberOptions = useMemo(
    () => companies.flatMap((c) => c.numbers.map((n) => ({
      id: n.whatsappNumberId,
      label: `${c.name} — ${n.displayName}`,
    }))),
    [companies],
  )

  async function handleSearch() {
    if (!numberId) return
    setLoading(true)
    try {
      const res = await api.get(`/admin/whatsapp-numbers/${numberId}/reconciliation`, {
        params: { since: new Date(since).toISOString(), until: new Date(`${until}T23:59:59`).toISOString() },
      })
      setResult(res.data)
    } catch {
      toast({ title: 'Erro ao buscar dados da Meta', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 text-xl font-semibold text-teal-900">Reconciliação com a Meta</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Compara o custo real cobrado pela Meta (Conversation Analytics) com o que o Sendi registrou internamente, pra ajustar a taxa se necessário.
      </p>

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
        <div className="min-w-[240px] flex-1">
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Número</label>
          <select
            value={numberId}
            onChange={(e) => setNumberId(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-600"
          >
            <option value="">Selecione um número...</option>
            {numberOptions.map((n) => (
              <option key={n.id} value={n.id}>{n.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">De</label>
          <input
            type="date"
            value={since}
            onChange={(e) => setSince(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Até</label>
          <input
            type="date"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white" disabled={!numberId || loading} onClick={handleSearch}>
          <Search className="mr-1.5 h-3.5 w-3.5" />
          {loading ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 rounded-lg border bg-white p-5">
            <div>
              <p className="text-xs text-muted-foreground">Cobrado pela Meta</p>
              <p className="text-lg font-bold text-gray-900">R$ {centsToReais(result.meta.totalCostCents)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Registrado no Sendi</p>
              <p className="text-lg font-bold text-gray-900">R$ {centsToReais(result.internal.costCents)}</p>
              <p className="text-xs text-muted-foreground">{result.internal.outboundCount} saída · {result.internal.botCount} bot</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Diferença</p>
              <p className={`text-lg font-bold ${result.deltaCents > 0 ? 'text-red-600' : result.deltaCents < 0 ? 'text-teal-700' : 'text-gray-900'}`}>
                {result.deltaCents > 0 ? '+' : ''}R$ {centsToReais(Math.abs(result.deltaCents))}
              </p>
              <p className="text-xs text-muted-foreground">
                {result.deltaCents > 0 ? 'Meta cobrou mais que o registrado' : result.deltaCents < 0 ? 'Sendi registrou mais que a Meta cobrou' : 'Bateu certinho'}
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">Por categoria (Meta)</h2>
            {result.meta.byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados no período.</p>
            ) : (
              <div className="space-y-1.5 text-sm">
                {result.meta.byCategory.map((c) => (
                  <div key={c.category} className="flex justify-between">
                    <span className="text-gray-600">{c.category}</span>
                    <span className="font-medium text-gray-900">R$ {centsToReais(c.costCents)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">Por país (Meta)</h2>
            {result.meta.byCountry.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados no período.</p>
            ) : (
              <div className="space-y-1.5 text-sm">
                {result.meta.byCountry.map((c) => (
                  <div key={c.country} className="flex justify-between">
                    <span className="text-gray-600">{c.country}</span>
                    <span className="font-medium text-gray-900">R$ {centsToReais(c.costCents)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
