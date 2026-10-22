'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import api from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { Contact } from '@/types'

interface Props {
  contact: Contact
  onClose: () => void
}

/**
 * Modal leve pra editar nome/email/notas sem saltar pra tela de Contatos —
 * usado de dentro da tela de conversa, onde normalmente só se tem o telefone
 * de quem acabou de chegar e falta registrar quem é essa pessoa.
 */
export default function EditContactModal({ contact, onClose }: Props) {
  const qc = useQueryClient()
  const [name, setName] = useState(contact.name || '')
  const [email, setEmail] = useState(contact.email || '')
  const [notes, setNotes] = useState(contact.notes || '')

  const updateMutation = useMutation({
    mutationFn: () => api.patch(`/contacts/${contact.id}`, {
      name: name.trim() || undefined,
      email: email.trim() || null,
      notes: notes.trim() || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation'] })
      qc.invalidateQueries({ queryKey: ['contacts'] })
      qc.invalidateQueries({ queryKey: ['deals-kanban'] })
      toast({ title: 'Contato atualizado', variant: 'success' })
      onClose()
    },
    onError: (err: any) => toast({ title: 'Erro ao atualizar contato', description: err.response?.data?.message, variant: 'destructive' }),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-teal-900">Editar contato</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da pessoa" autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">E-mail</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Notas</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            className="flex-1"
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
          >
            {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
