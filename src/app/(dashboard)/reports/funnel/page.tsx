'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Target, XCircle } from 'lucide-react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth.store'
import type { FunnelReport } from '@/types'

function StatCard({ title, value, icon: Icon, description }: {
  title: string
  value: number | string
  icon: any
  description?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}

const PERIODS = [
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
  { days: 90, label: '90 dias' },
]

export default function FunnelReportPage() {
  const { user } = useAuthStore()
  const isManager = user?.role === 'owner' || user?.role === 'admin'
  const [days, setDays] = useState(30)

  const { data: report, isLoading } = useQuery<FunnelReport>({
    queryKey: ['funnel-report', days],
    queryFn: () => api.get(`/deals/funnel?days=${days}`).then((r) => r.data),
    enabled: isManager,
  })

  if (!isManager) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
        <p className="text-sm">Esse relatório é visível só para administradores.</p>
      </div>
    )
  }

  const maxEntered = Math.max(1, ...(report?.columns.map((c) => c.enteredCount) ?? [1]))

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-teal-900">Funil de Conversão</h1>
          <p className="text-sm text-muted-foreground">Quanto está em negociação e por onde os leads passam</p>
        </div>
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                days === p.days ? 'border-teal-600 bg-teal-600 text-white' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      {report && (
        <>
          <div className="grid gap-3 grid-cols-2 md:gap-4 lg:grid-cols-3">
            <StatCard title="Leads ativos no pipeline" value={report.activePipelineCount} icon={Target} />
            <StatCard
              title="Taxa de conversão"
              value={report.conversionRate != null ? `${Math.round(report.conversionRate * 100)}%` : '—'}
              icon={TrendingUp}
              description={`ativos ÷ entradas em ${report.days}d`}
            />
            <StatCard title={`Perdidos (${report.days}d)`} value={report.lostTotal} icon={XCircle} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por raia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.columns.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma raia configurada ainda.</p>
                )}
                {report.columns.map((col) => (
                  <div key={col.columnId}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 font-medium text-gray-800">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.columnColor }} />
                        {col.columnName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {col.activeCount} ativos · {col.enteredCount} entraram
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(col.enteredCount / maxEntered) * 100}%`, backgroundColor: col.columnColor }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Principais motivos de perda</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {report.topLostReasons.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhum lead perdido no período.</p>
                ) : (
                  report.topLostReasons.map((r, i) => (
                    <div key={i} className="flex items-center justify-between border-b px-4 py-3 last:border-0">
                      <span className="text-sm text-gray-800">{r.reason}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{r.count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
