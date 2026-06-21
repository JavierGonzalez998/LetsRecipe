'use client'
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User } from '@/lib/types'

interface AuthCtx {
  user: User | null | undefined  // undefined = cargando, null = no autenticado
  setUser: (u: User | null) => void
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({ user: undefined, setUser: () => {}, logout: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  const fetchUser = useCallback(async () => {
    const data = await fetch('/api/auth/me').then(r => r.json())
    setUser(data ?? null)
  }, [])

  useEffect(() => { fetchUser() }, [fetchUser])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  return <Ctx.Provider value={{ user, setUser, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
