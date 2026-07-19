'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { DailySpendChart } from '@/components/usage/daily-spend-chart'
import type { DailySpend, TypeSpend, ExtractEntry } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  text: 'Texto',
  image: 'Imagem',
  audio: 'Áudio',
  video: 'Vídeo',
  document: 'Documento',
  template: 'Template',
}

function centsToReais(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function UsagePage() {
  const { data: daily = [] } = useQuery<DailySpend[]>({
    queryKey: ['usage-daily'],
    queryFn: () => api.get('/companies/me/usage/daily?days=30').then((r) => r.data),
  })

  const { data: byType = [] } = useQuery<TypeSpend[]>({
    queryKey: ['usage-by-type'],
    queryFn: () => api.get('/companies/me/usage/by-type?days=30').then((r) => r.data),
  })

  const { data: extract = [] } = useQuery<ExtractEntry[]>({
    queryKey: ['usage-extract'],
    queryFn: () => api.get('/companies/me/usage/extract?days=30').then((r) => r.data),
  })

  const totalTypeCount = byType.reduce((sum, t) => sum + t.count, 0)

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-teal-900">Uso e gastos</h1>
        <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
      </div>

      {/* Gráfico diário */}
      <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">Gasto por dia</h2>
        {daily.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        ) : (
          <DailySpendChart data={daily} />
        )}
      </div>

      {/* Tabela dia a dia (view em tabela do mesmo gráfico) */}
      <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">Detalhe por dia</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 font-medium">Data</th>
                <th className="pb-2 font-medium">Saída</th>
                <th className="pb-2 font-medium">Bot</th>
                <th className="pb-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {[...daily].reverse().filter((d) => d.totalCostCents > 0).map((d) => (
                <tr key={d.date} className="border-b border-gray-50 last:border-0">
                  <td className="py-1.5 text-gray-700">{formatDate(d.date)}</td>
                  <td className="py-1.5 text-gray-600">{d.outboundCount}x · R$ {centsToReais(d.outboundCostCents)}</td>
                  <td className="py-1.5 text-gray-600">{d.botCount}x · R$ {centsToReais(d.botCostCents)}</td>
                  <td className="py-1.5 text-right font-medium text-gray-900">R$ {centsToReais(d.totalCostCents)}</td>
                </tr>
              ))}
              {daily.every((d) => d.totalCostCents === 0) && (
                <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">Nenhum gasto no período.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Por tipo de mensagem */}
      <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">Gasto por tipo de mensagem</h2>
        {byType.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        ) : (
          <div className="space-y-2">
            {byType.map((t) => {
              const share = totalTypeCount > 0 ? Math.round((t.count / totalTypeCount) * 100) : 0
              return (
                <div key={t.type} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-gray-700">{TYPE_LABELS[t.type] ?? t.type}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-teal-600" style={{ width: `${share}%` }} />
                  </div>
                  <span className="w-16 shrink-0 text-right text-muted-foreground">{t.count}x</span>
                  <span className="w-24 shrink-0 text-right font-medium text-gray-900">R$ {centsToReais(t.costCents)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Extrato de saldo */}
      <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">Extrato de saldo</h2>
        {extract.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma movimentação no período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">Data</th>
                  <th className="pb-2 font-medium">Descrição</th>
                  <th className="pb-2 text-right font-medium">Valor</th>
                  <th className="pb-2 text-right font-medium">Saldo após</th>
                </tr>
              </thead>
              <tbody>
                {extract.map((e, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-1.5 text-gray-700">{formatDateTime(e.date)}</td>
                    <td className="py-1.5 text-gray-600">{e.description}</td>
                    <td className={`py-1.5 text-right font-medium ${e.amountCents >= 0 ? 'text-teal-700' : 'text-red-600'}`}>
                      {e.amountCents >= 0 ? '+' : '-'} R$ {centsToReais(Math.abs(e.amountCents))}
                    </td>
                    <td className="py-1.5 text-right text-gray-900">R$ {centsToReais(e.balanceAfterCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
