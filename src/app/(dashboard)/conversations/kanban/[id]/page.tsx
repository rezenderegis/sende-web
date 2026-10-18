'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import LeadDetailScreen from '@/components/conversations/lead-detail-screen'
import type { Deal } from '@/types'

export default function KanbanDealPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  // Mesma queryKey do board (/conversations?view=kanban) — se o negócio já
  // estiver em cache (navegação a partir do board), não refaz a busca.
  const { data: deals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ['deals-kanban'],
    queryFn: () => api.get('/deals/kanban').then((r) => r.data),
  })

  const deal = deals.find((d) => d.id === id)

  function goBack() {
    router.push('/conversations?view=kanban')
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Carregando...</div>
  }

  if (!deal) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <p className="text-sm">Negócio não encontrado.</p>
        <button onClick={goBack} className="text-sm text-teal-700 hover:underline">Voltar pro Kanban</button>
      </div>
    )
  }

  return <LeadDetailScreen deal={deal} onBack={goBack} />
}
