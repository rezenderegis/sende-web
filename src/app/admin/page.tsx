'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Wallet, History, X } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { AdminCompanySummary, BalanceTransaction, NumberUsage } from '@/types'

function centsToReais(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function reaisToCents(value: string): number {
  const normalized = value.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(normalized)
  return Math.round((isNaN(n) ? 0 : n) * 100)
}

function NumberRow({ number, onSaveLimits }: {
  number: NumberUsage
  onSaveLimits: (numberId: string, dailyCents: number | null, monthlyCents: number | null) => void
}) {
  const [daily, setDaily] = useState(number.dailySpendLimitCents != null ? centsToReais(number.dailySpendLimitCents) : '')
  const [monthly, setMonthly] = useState(number.monthlySpendLimitCents != null ? centsToReais(number.monthlySpendLimitCents) : '')

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3 space-y-2.5">
      <p className="text-sm font-medium text-gray-800">{number.displayName}</p>

      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
        <div>
          <p className="font-medium text-gray-600">Hoje</p>
          <p>{number.today.outboundCount} saída · {number.today.botCount} bot</p>
          <p>R$ {centsToReais(number.today.totalCostCents)}</p>
        </div>
        <div>
          <p className="font-medium text-gray-600">Este mês</p>
          <p>{number.month.outboundCount} saída · {number.month.botCount} bot</p>
          <p>R$ {centsToReais(number.month.totalCostCents)}</p>
        </div>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-[11px] text-gray-500">Limite diário (R$, vazio = sem limite)</label>
          <Input value={daily} onChange={(e) => setDaily(e.target.value)} placeholder="20,00" className="h-8 text-xs" />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-[11px] text-gray-500">Limite mensal (R$, vazio = sem limite)</label>
          <Input value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="300,00" className="h-8 text-xs" />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={() => onSaveLimits(
            number.whatsappNumberId,
            daily.trim() === '' ? null : reaisToCents(daily),
            monthly.trim() === '' ? null : reaisToCents(monthly),
          )}
        >
          Salvar
        </Button>
      </div>
    </div>
  )
}

function CreditBalanceModal({ companyId, companyName, onClose }: { companyId: string; companyName: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')

  const creditMutation = useMutation({
    mutationFn: () => api.post(`/admin/companies/${companyId}/balance/credit`, {
      amountCents: reaisToCents(amount),
      reason: reason || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-companies'] })
      toast({ title: 'Saldo creditado', variant: 'success' })
      onClose()
    },
    onError: () => toast({ title: 'Erro ao creditar saldo', variant: 'destructive' }),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-sm font-semibold text-teal-900">Creditar saldo — {companyName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Valor (R$)</label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100,00" autoFocus />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Motivo (opcional)</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Pix recebido em 18/07" />
          </div>
        </div>
        <div className="flex gap-2 border-t px-5 py-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            disabled={!amount || creditMutation.isPending}
            onClick={() => creditMutation.mutate()}
          >
            {creditMutation.isPending ? 'Creditando...' : 'Creditar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function BalanceHistoryModal({ companyId, companyName, onClose }: { companyId: string; companyName: string; onClose: () => void }) {
  const { data: history = [], isLoading } = useQuery<BalanceTransaction[]>({
    queryKey: ['admin-balance-history', companyId],
    queryFn: () => api.get(`/admin/companies/${companyId}/balance/history`).then((r) => r.data),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-sm font-semibold text-teal-900">Histórico de saldo — {companyName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-96 overflow-y-auto p-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma transação registrada.</p>
          ) : (
            <div className="space-y-3">
              {history.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {tx.type === 'credit' ? 'Crédito' : 'Ajuste'}
                      {tx.reason && <span className="font-normal text-muted-foreground"> · {tx.reason}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <p className="text-sm font-semibold text-teal-700">+ R$ {centsToReais(tx.amountCents)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CompanyCard({ company }: { company: AdminCompanySummary }) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [creditModal, setCreditModal] = useState(false)
  const [historyModal, setHistoryModal] = useState(false)

  const limitsMutation = useMutation({
    mutationFn: ({ numberId, dailySpendLimitCents, monthlySpendLimitCents }: { numberId: string; dailySpendLimitCents: number | null; monthlySpendLimitCents: number | null }) =>
      api.patch(`/admin/whatsapp-numbers/${numberId}/limits`, { dailySpendLimitCents, monthlySpendLimitCents }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-companies'] })
      toast({ title: 'Limites atualizados', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao atualizar limites', variant: 'destructive' }),
  })

  return (
    <div className="rounded-lg border bg-white">
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => setExpanded((v) => !v)} className="flex flex-1 items-center gap-3 text-left min-w-0">
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', expanded && 'rotate-180')} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{company.name}</p>
            <p className="truncate text-xs text-muted-foreground">{company.email} · {company.plan}</p>
          </div>
        </button>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p className="text-sm font-semibold text-teal-700">R$ {centsToReais(company.balanceCents)}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setHistoryModal(true)} title="Histórico">
          <History className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setCreditModal(true)}>
          <Wallet className="mr-1.5 h-3.5 w-3.5" />
          Creditar
        </Button>
      </div>

      {expanded && (
        <div className="space-y-2 border-t bg-gray-50/40 p-4">
          {company.numbers.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum número conectado.</p>
          ) : (
            company.numbers.map((n) => (
              <NumberRow
                key={n.whatsappNumberId}
                number={n}
                onSaveLimits={(numberId, dailySpendLimitCents, monthlySpendLimitCents) =>
                  limitsMutation.mutate({ numberId, dailySpendLimitCents, monthlySpendLimitCents })
                }
              />
            ))
          )}
        </div>
      )}

      {creditModal && (
        <CreditBalanceModal companyId={company.id} companyName={company.name} onClose={() => setCreditModal(false)} />
      )}
      {historyModal && (
        <BalanceHistoryModal companyId={company.id} companyName={company.name} onClose={() => setHistoryModal(false)} />
      )}
    </div>
  )
}

export default function AdminCompaniesPage() {
  const { data: companies = [], isLoading } = useQuery<AdminCompanySummary[]>({
    queryKey: ['admin-companies'],
    queryFn: () => api.get('/admin/companies').then((r) => r.data),
  })

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 text-xl font-semibold text-teal-900">Empresas</h1>
      <p className="mb-6 text-sm text-muted-foreground">Saldo, limites por número e histórico de créditos.</p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : companies.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada.</p>
      ) : (
        <div className="space-y-3">
          {companies.map((c) => <CompanyCard key={c.id} company={c} />)}
        </div>
      )}
    </div>
  )
}
