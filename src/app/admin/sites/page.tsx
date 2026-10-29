'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import api from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { Site } from '@/types'

interface AdminSite extends Site {
  companyName: string
}

function SiteRow({ site }: { site: AdminSite }) {
  const qc = useQueryClient()
  const [domain, setDomain] = useState(site.domain ?? '')

  const mutation = useMutation({
    mutationFn: (data: { domain?: string | null; isActive?: boolean }) => api.patch(`/admin/sites/${site.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-sites'] })
      toast({ title: 'Atualizado', variant: 'success' })
    },
    onError: (err: any) => toast({ title: err?.response?.data?.message || 'Erro ao atualizar', variant: 'destructive' }),
  })

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-4">
      <div className="min-w-[160px] flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{site.name}</p>
        <p className="truncate text-xs text-muted-foreground">{site.companyName} · /{site.slug}</p>
      </div>

      <div className="flex items-center gap-1.5">
        <Input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="dominio-do-cliente.com.br"
          className="h-8 w-56 text-xs"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ domain: domain.trim() || null })}
        >
          <Save className="h-3.5 w-3.5" />
        </Button>
      </div>

      <button
        disabled={mutation.isPending}
        onClick={() => mutation.mutate({ isActive: !site.isActive })}
        className={cn(
          'rounded-full px-3 py-1 text-xs font-medium transition-colors',
          site.isActive ? 'bg-teal-100 text-teal-700 hover:bg-teal-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300',
        )}
      >
        {site.isActive ? 'Ativa' : 'Inativa'}
      </button>
    </div>
  )
}

export default function AdminSitesPage() {
  const { data: sites } = useQuery<AdminSite[]>({
    queryKey: ['admin-sites'],
    queryFn: () => api.get('/admin/sites').then((r) => r.data),
  })

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 text-xl font-semibold text-teal-900">Sites (GlobalSixPages)</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Páginas criadas pelos clientes. Defina o domínio depois de configurar o DNS no Vercel, e ative/desative conforme pagamento.
      </p>

      <div className="space-y-3">
        {sites?.map((site) => <SiteRow key={site.id} site={site} />)}
        {sites?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum site criado ainda.</p>}
      </div>
    </div>
  )
}
