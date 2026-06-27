'use client'

import { useState, useCallback } from 'react'

type ToastVariant = 'default' | 'destructive' | 'success'

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
}

let toastQueue: ((toast: Omit<Toast, 'id'>) => void)[] = []

export function toast(options: Omit<Toast, 'id'>) {
  toastQueue.forEach((fn) => fn(options))
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...options, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  useState(() => {
    toastQueue.push(addToast)
    return () => {
      toastQueue = toastQueue.filter((fn) => fn !== addToast)
    }
  })

  return { toasts, toast: addToast }
}
