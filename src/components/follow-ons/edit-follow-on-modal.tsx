'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Pencil, X, CheckCheck, RotateCcw, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { FollowOn, User } from '@/types'

const STATUS_CONFIG = {
  pending: { label: 'Pendente', className: 'bg-amber-200 text-amber-900 ring-1 ring-amber-400' },
  done: { label: 'Concluído', className: 'bg-teal-200 text-teal-900 ring-1 ring-teal-400' },
  cancelled: { label: 'Cancelado', className: 'bg-gray-200 text-gray-700 ring-1 ring-gray-400' },
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Edição de um follow-on já existente — o caso de uso principal é permitir
 * registrar uma anotação sobre como a atividade aconteceu, mesmo depois de
 * concluída ou cancelada (não só na hora de agendar).
 */
export default function EditFollowOnModal({ fo, users, onClose, onDelete, onSaved }: {
  fo: FollowOn
  users: User[]
  onClose: () => void
  onDelete: (id: string) => void
  onSaved: () => void
}) {
  const [type, setType] = useState<FollowOn['type']>(fo.type)
  const [scheduledAt, setScheduledAt] = useState(toDatetimeLocal(fo.scheduledAt))
  const [note, setNote] = useState(fo.note ?? '')
  const [assignedUserId, setAssignedUserId] = useState(fo.assignedUserId ?? '')
  const [message, setMessage] = useState(fo.message ?? '')
  const isPending = fo.status === 'pending'

  const saveMutation = useMutation({
    mutationFn: () => api.patch(`/follow-ons/${fo.id}`, {
      type,
      scheduledAt: new Date(scheduledAt).toISOString(),
      note: note || undefined,
      assignedUserId: assignedUserId || undefined,
      ...(type === 'message' ? { message: message || undefined } : {}),
    }),
    onSuccess: () => {
      onSaved()
      toast({ title: 'Follow-on atualizado', variant: 'success' })
      onClose()
    },
    onError: () => toast({ title: 'Erro ao salvar', variant: 'destructive' }),
  })

  const completeMutation = useMutation({
    mutationFn: () => api.patch(`/follow-ons/${fo.id}/complete`),
    onSuccess: () => {
      onSaved()
      toast({ title: 'Follow-on concluído', variant: 'success' })
      onClose()
    },
    onError: () => toast({ title: 'Erro ao concluir', variant: 'destructive' }),
  })

  const reopenMutation = useMutation({
    mutationFn: () => api.patch(`/follow-ons/${fo.id}/reopen`),
    onSuccess: () => {
      onSaved()
      toast({ title: 'Follow-on marcado como pendente', variant: 'success' })
      onClose()
    },
    onError: () => toast({ title: 'Erro ao reabrir', variant: 'destructive' }),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-teal-900">Editar follow-on</h2>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_CONFIG[fo.status].className)}>
              {STATUS_CONFIG[fo.status].label}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FollowOn['type'])}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="call">Ligação</option>
              <option value="meeting">Reunião</option>
              <option value="message_manual">Mensagem (lembrete manual)</option>
              <option value="message">Mensagem (envio automático)</option>
              <option value="note">Anotação</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Data e hora</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Anotação</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Adicione uma anotação sobre esse follow-on..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {type === 'message' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Mensagem a enviar</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              />
              {fo.templateName && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Este follow-on usa o template <span className="font-mono">{fo.templateName}</span>; editar a mensagem acima não altera o template.
                </p>
              )}
            </div>
          )}

          {users.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Atribuir a</label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t px-5 py-4">
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => { onDelete(fo.id); onClose() }}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Excluir
          </Button>
          {fo.type !== 'note' && (
            isPending ? (
              <Button
                variant="outline"
                className="text-teal-700 border-teal-200 hover:bg-teal-50"
                disabled={completeMutation.isPending}
                onClick={() => completeMutation.mutate()}
              >
                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                Marcar como concluído
              </Button>
            ) : (
              <Button
                variant="outline"
                className="text-amber-700 border-amber-200 hover:bg-amber-50"
                disabled={reopenMutation.isPending}
                onClick={() => reopenMutation.mutate()}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Marcar como pendente
              </Button>
            )
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
