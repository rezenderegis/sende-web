'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Search, UserPlus, MessageSquare } from 'lucide-react'
import api from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatPhone, formatDate } from '@/lib/utils'
import type { Contact } from '@/types'

export default function ContactsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery<{ data: Contact[]; total: number }>({
    queryKey: ['contacts'],
    queryFn: () => api.get('/contacts?limit=100').then((r) => r.data),
  })

  const contacts = data?.data?.filter((c) =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search),
  ) ?? []

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} contatos</p>
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou número..."
          className="pl-9 max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Carregando...</div>
          )}
          {!isLoading && !contacts.length && (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Nenhum contato encontrado
            </div>
          )}
          {contacts.map((contact) => (
            <div key={contact.id} className="flex items-center gap-4 border-b px-6 py-4 last:border-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                {contact.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{contact.name || 'Sem nome'}</p>
                <p className="text-sm text-muted-foreground">{formatPhone(contact.phone)}</p>
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">
                {formatDate(contact.createdAt)}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => router.push('/conversations')}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Ver conversa
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
