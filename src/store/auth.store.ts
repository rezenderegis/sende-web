'use client'

import { create } from 'zustand'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  setAuth: (user, token) => {
    localStorage.setItem('sendi_token', token)
    localStorage.setItem('sendi_user', JSON.stringify(user))
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem('sendi_token')
    localStorage.removeItem('sendi_user')
    set({ user: null, token: null })
  },

  hydrate: () => {
    const token = localStorage.getItem('sendi_token')
    const userStr = localStorage.getItem('sendi_user')
    if (token && userStr) {
      set({ token, user: JSON.parse(userStr) })
    }
  },
}))
