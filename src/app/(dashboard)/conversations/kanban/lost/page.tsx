'use client'

import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, RotateCcw, XCircle } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { formatPhone } from '@/lib/utils'
import type { KanbanLead } from '@/types'

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function LostLeadsPage() {
  const router = useRouter()
  const qc = useQueryClient()

  const { data: leads = [], isLoading } = useQuery<KanbanLead[]>({
    queryKey: ['kanban-leads-lost'],
    queryFn: () => api.get('/contacts/kanban?status=lost').then((r) => r.data),
  })

  const reopenMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/contacts/${id}/reopen`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban-leads-lost'] })
      qc.invalidateQueries({ queryKey: ['kanban-leads'] })
      toast({ title: 'Lead reaberto', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao reabrir', description: err.response?.data?.message, variant: 'destructive' }),
  })

  function goBack() {
    router.push('/conversations?view=kanban')
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-3 border-b-2 border-gray-200 px-4 py-4 md:px-7 md:py-5">
        <button onClick={goBack} className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-teal-900">Leads perdidos</h2>
          <p className="text-xs text-gray-600">Saíram do quadro ativo — reabra se mudar de ideia.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-7">
        <div className="mx-auto max-w-2xl space-y-2.5">
          {isLoading && <p className="text-center text-sm text-muted-foreground py-6">Carregando...</p>}
          {!isLoading && leads.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <XCircle className="h-8 w-8 opacity-30" />
              <p className="text-sm">Nenhum lead perdido por aqui.</p>
            </div>
          )}
          {leads.map((lead) => (
            <div key={lead.id} className="flex items-start gap-3 rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                {lead.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-gray-900">{lead.name}</p>
                  {lead.dealValue != null && (
                    <span className="text-xs font-semibold text-gray-500">{formatCurrency(lead.dealValue)}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{formatPhone(lead.phone)}</p>
                {lead.lostReason && <p className="mt-1.5 text-sm text-gray-700">{lead.lostReason}</p>}
                {lead.lostAt && (
                  <p className="mt-0.5 text-xs text-gray-400">
                    Perdido em {new Date(lead.lostAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5"
                disabled={reopenMutation.isPending}
                onClick={() => reopenMutation.mutate(lead.id)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reabrir
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
