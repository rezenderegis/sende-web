'use client'

import { useQuery } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { Company } from '@/types'

const planLabel: Record<string, string> = {
  free: 'Grátis',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export default function CompanyPage() {
  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ['company'],
    queryFn: () => api.get('/companies/me').then((r) => r.data),
  })

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Empresa</h1>
        <p className="text-sm text-muted-foreground">Informações da sua conta</p>
      </div>

      {isLoading && <p className="text-muted-foreground">Carregando...</p>}

      {company && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 pb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100">
              <Building2 className="h-7 w-7 text-whatsapp" />
            </div>
            <div>
              <CardTitle>{company.name}</CardTitle>
              <CardDescription>{company.email}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm text-muted-foreground">Plano</span>
              <Badge>{planLabel[company.plan] || company.plan}</Badge>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={company.isActive ? 'success' : 'destructive'}>
                {company.isActive ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Membro desde</span>
              <span className="text-sm font-medium">{formatDate(company.createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
