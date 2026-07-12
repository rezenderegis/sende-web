'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Bell, ExternalLink, CheckCheck } from 'lucide-react'
import api from '@/lib/api'
import type { AppNotification } from '@/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function NotificationBell() {
  const router = useRouter()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: notifications = [] } = useQuery<AppNotification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    refetchInterval: 30000,
  })

  const unreadCount = notifications.filter((n) => !n.readAt).length

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  function handleOpen(n: AppNotification) {
    if (!n.readAt) markReadMutation.mutate(n.id)
    if (n.conversationId) {
      router.push(`/conversations/${n.conversationId}`)
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-xl border bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Notificações</p>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-gray-900"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar tudo como lido
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Bell className="h-8 w-8 opacity-20" />
                <p className="text-xs">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleOpen(n)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 border-b last:border-0 ${!n.readAt ? 'bg-blue-50/50' : ''}`}
                >
                  <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!n.readAt ? 'bg-blue-500' : 'bg-transparent'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground truncate">{n.body}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                  {n.conversationId && <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-300 mt-0.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
