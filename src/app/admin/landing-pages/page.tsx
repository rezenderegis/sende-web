'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface LandingPage {
  id: string
  slug: string
  name: string
  isActive: boolean
}

export default function AdminLandingPagesPage() {
  const qc = useQueryClient()

  const { data: pages } = useQuery<LandingPage[]>({
    queryKey: ['admin-landing-pages'],
    queryFn: () => api.get('/admin/landing-pages').then((r) => r.data),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ slug, isActive }: { slug: string; isActive: boolean }) =>
      api.patch(`/admin/landing-pages/${slug}`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-landing-pages'] })
      toast({ title: 'Atualizado', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao atualizar', variant: 'destructive' }),
  })

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-1 text-xl font-semibold text-teal-900">Landing Pages</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Ativa/desativa o acesso público de cada página. Desativada, o visitante vê uma mensagem de página indisponível em vez do conteúdo — sem precisar remover nada.
      </p>

      <div className="divide-y rounded-lg border bg-white">
        {pages?.map((page) => (
          <div key={page.slug} className="flex items-center justify-between gap-4 p-4">
            <div>
              <div className="text-sm font-medium text-gray-900">{page.name}</div>
              <div className="text-xs text-muted-foreground">/{page.slug}</div>
            </div>
            <button
              disabled={toggleMutation.isPending}
              onClick={() => toggleMutation.mutate({ slug: page.slug, isActive: !page.isActive })}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                page.isActive ? 'bg-teal-100 text-teal-700 hover:bg-teal-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300',
              )}
            >
              {page.isActive ? 'Ativa' : 'Inativa'}
            </button>
          </div>
        ))}
        {pages?.length === 0 && <div className="p-4 text-sm text-muted-foreground">Nenhuma landing page cadastrada.</div>}
      </div>
    </div>
  )
}
