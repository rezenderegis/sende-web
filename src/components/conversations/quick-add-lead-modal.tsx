'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Search, UserCheck, AlertTriangle } from 'lucide-react'
import api from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { cn, formatPhone } from '@/lib/utils'
import type { Contact } from '@/types'

interface Props {
  kanbanColumnId: string | null
  onClose: () => void
}

export default function QuickAddLeadModal({ kanbanColumnId, onClose }: Props) {
  const qc = useQueryClient()
  const [mode, setMode] = useState<'existing' | 'new'>('existing')

  // --- aba "Contato existente" ---
  const [search, setSearch] = useState('')
  const { data: allContacts = [] } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: () => api.get('/contacts').then((r) => r.data),
  })

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return allContacts.slice(0, 30)
    const digits = term.replace(/\D/g, '')
    return allContacts
      .filter((c) => c.name?.toLowerCase().includes(term) || (digits.length > 0 && c.phone?.includes(digits)))
      .slice(0, 30)
  }, [allContacts, search])

  const assignMutation = useMutation({
    mutationFn: (contactId: string) => api.patch(`/contacts/${contactId}`, { kanbanColumnId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban-leads'] })
      toast({ title: 'Contato colocado no quadro', variant: 'success' })
      onClose()
    },
    onError: (err: any) => toast({ title: 'Erro ao colocar no quadro', description: err.response?.data?.message, variant: 'destructive' }),
  })

  // --- aba "Novo contato" ---
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [duplicate, setDuplicate] = useState<Contact | null>(null)
  const [checkingPhone, setCheckingPhone] = useState(false)

  const normalizedPhone = phone.replace(/\D/g, '')

  useEffect(() => {
    if (normalizedPhone.length < 10) {
      setDuplicate(null)
      return
    }
    setCheckingPhone(true)
    const t = setTimeout(() => {
      api.get('/contacts/by-phone', { params: { phone: normalizedPhone } })
        .then((r) => setDuplicate(r.data ?? null))
        .catch(() => setDuplicate(null))
        .finally(() => setCheckingPhone(false))
    }, 400)
    return () => clearTimeout(t)
  }, [normalizedPhone])

  const createMutation = useMutation({
    mutationFn: () => api.post('/contacts', {
      name: name.trim() || undefined,
      phone: normalizedPhone,
      notes: notes.trim() || undefined,
      kanbanColumnId: kanbanColumnId ?? undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban-leads'] })
      qc.invalidateQueries({ queryKey: ['contacts'] })
      toast({ title: 'Lead adicionado ao quadro', variant: 'success' })
      onClose()
    },
    onError: (err: any) => {
      if (err.response?.status === 409 && err.response?.data?.contactId) {
        setDuplicate({ id: err.response.data.contactId } as Contact)
        toast({ title: 'Esse telefone já está cadastrado', description: 'Use o contato existente em vez de criar um novo.', variant: 'destructive' })
        return
      }
      toast({
        title: 'Erro ao adicionar lead',
        description: err.response?.data?.message || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    },
  })

  const validNew = normalizedPhone.length >= 10 && !duplicate

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border bg-white shadow-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-teal-900">Adicionar lead ao quadro</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Toggle de modo */}
        <div className="mb-4 flex rounded-lg border bg-gray-50 p-1">
          <button
            onClick={() => setMode('existing')}
            className={cn(
              'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
              mode === 'existing' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            Contato existente
          </button>
          <button
            onClick={() => setMode('new')}
            className={cn(
              'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
              mode === 'new' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            Novo contato
          </button>
        </div>

        {mode === 'existing' ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border">
              {filteredContacts.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhum contato encontrado</p>
              )}
              {filteredContacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => assignMutation.mutate(c.id)}
                  disabled={assignMutation.isPending}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-teal-50 disabled:opacity-50 border-b last:border-b-0"
                >
                  <span>
                    <span className="block font-medium text-gray-900">{c.name}</span>
                    <span className="block text-xs text-muted-foreground">{formatPhone(c.phone)}</span>
                  </span>
                  {c.kanbanColumnId === kanbanColumnId && kanbanColumnId && (
                    <span className="shrink-0 text-xs text-teal-600">já está aqui</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Telefone <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {checkingPhone && <p className="mt-1 text-xs text-muted-foreground">Verificando...</p>}
                {duplicate && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="flex-1 text-xs text-amber-800">
                      Já existe um contato com esse telefone{duplicate.name ? ` (${duplicate.name})` : ''}.
                      <button
                        onClick={() => assignMutation.mutate(duplicate.id)}
                        className="mt-1 flex items-center gap-1 font-semibold text-amber-900 hover:underline"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Usar esse contato
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
                <Input
                  placeholder="João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
                <Input
                  placeholder="Observações sobre o lead"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
              <Button
                className="flex-1 gap-2"
                disabled={!validNew || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                <Plus className="h-4 w-4" />
                {createMutation.isPending ? 'Salvando...' : 'Adicionar ao quadro'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
