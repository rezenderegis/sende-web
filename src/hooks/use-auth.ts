'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

export function useAuth(requireAuth = true) {
  const { user, token, hydrate } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    hydrate()
  }, [])

  useEffect(() => {
    if (requireAuth && !token && typeof window !== 'undefined') {
      const stored = localStorage.getItem('sendi_token')
      if (!stored) {
        router.push('/login')
      }
    }
  }, [token, requireAuth, router])

  return { user, token }
}
