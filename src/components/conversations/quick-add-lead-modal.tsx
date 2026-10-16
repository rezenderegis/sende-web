'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Plus } from 'lucide-react'
import api from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

interface Props {
  kanbanColumnId: string | null
  onClose: () => void
}

export default function QuickAddLeadModal({ kanbanColumnId, onClose }: Props) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  const createMutation = useMutation({
    mutationFn: () => api.post('/contacts', {
      name: name.trim() || undefined,
      phone: phone.replace(/\D/g, ''),
      notes: notes.trim() || undefined,
      kanbanColumnId: kanbanColumnId ?? undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban-leads'] })
      toast({ title: 'Lead adicionado ao quadro', variant: 'success' })
      onClose()
    },
    onError: (err: any) => toast({
      title: 'Erro ao adicionar lead',
      description: err.response?.data?.message || 'Verifique os dados e tente novamente.',
      variant: 'destructive',
    }),
  })

  const valid = phone.replace(/\D/g, '').length >= 10

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-teal-900">Novo lead no Kanban</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          Coloca a pessoa direto na raia, sem enviar nenhuma mensagem. Quando quiser, você inicia a conversa normalmente.
        </p>

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
            disabled={!valid || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <Plus className="h-4 w-4" />
            {createMutation.isPending ? 'Salvando...' : 'Adicionar ao quadro'}
          </Button>
        </div>
      </div>
    </div>
  )
}
