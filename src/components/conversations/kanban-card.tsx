'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock, Zap, MessageCircleOff } from 'lucide-react'
import { cn, formatPhone, timeAgo } from '@/lib/utils'
import type { KanbanLead } from '@/types'

function getWindowStatus(lastInboundAt: string | null) {
  if (!lastInboundAt) return 'closed'
  const remaining = 24 * 3600000 - (Date.now() - new Date(lastInboundAt).getTime())
  if (remaining <= 0) return 'closed'
  if (remaining <= 3 * 3600000) return 'closing'
  return 'open'
}

function getWindowLabel(lastInboundAt: string | null) {
  if (!lastInboundAt) return 'Expirada'
  const remaining = 24 * 3600000 - (Date.now() - new Date(lastInboundAt).getTime())
  if (remaining <= 0) return 'Expirada'
  const hours = Math.floor(remaining / 3600000)
  if (hours >= 1) return `${hours}h`
  return `${Math.floor((remaining % 3600000) / 60000)}min`
}

interface Props {
  lead: KanbanLead
  onOpen: () => void
}

export default function KanbanCard({ lead, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { type: 'card', lead },
  })

  const conv = lead.conversation
  const ws = conv ? getWindowStatus(conv.lastInboundAt) : null
  const wLabel = conv ? getWindowLabel(conv.lastInboundAt) : null

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-xl border border-gray-100 bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing select-none',
        isDragging && 'opacity-40 ring-2 ring-teal-400',
      )}
      onClick={onOpen}
    >
      {/* Nome */}
      <p className="truncate font-semibold text-sm text-gray-900">
        {lead.name || formatPhone(lead.phone || '')}
      </p>

      {/* Número WhatsApp / telefone */}
      <p className="mt-0.5 truncate text-xs text-gray-400">
        {conv?.whatsappNumber?.phoneNumber ?? formatPhone(lead.phone || '')}
      </p>

      {/* Badges */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {conv ? (
          <>
            {/* Janela */}
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
              ws === 'open' && 'bg-gray-100 text-gray-500',
              ws === 'closing' && 'bg-amber-100 text-amber-700',
              ws === 'closed' && 'bg-gray-100 text-gray-400',
            )}>
              <Clock className="h-3 w-3" />
              {wLabel}
            </span>

            {/* Campanha */}
            {conv.campaignPrompt && conv.campaignExpiresAt && new Date(conv.campaignExpiresAt) > new Date() && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                <Zap className="h-3 w-3" />
                Campanha
              </span>
            )}

            {/* Tags da conversa */}
            {conv.tags?.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-400">
            <MessageCircleOff className="h-3 w-3" />
            Sem conversa iniciada
          </span>
        )}

        {/* Tags do contato (quando não vieram pela conversa) */}
        {!conv && lead.tags?.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
          </span>
        ))}
      </div>

      {/* Rodapé: atendente + tempo */}
      <div className="mt-2 flex items-center justify-between">
        {conv?.assignedUser ? (
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[9px] font-semibold text-gray-600">
              {conv.assignedUser.name.charAt(0).toUpperCase()}
            </div>
            {conv.assignedUser.name.split(' ')[0]}
          </span>
        ) : <span />}
        <span className="text-[11px] text-gray-400">
          {timeAgo(conv?.lastMessageAt || lead.updatedAt)}
        </span>
      </div>
    </div>
  )
}
