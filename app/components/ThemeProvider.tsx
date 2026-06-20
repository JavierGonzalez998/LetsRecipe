'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'cupcake' | 'dim'

interface ThemeCtx { theme: Theme; toggle: () => void }

const Ctx = createContext<ThemeCtx>({ theme: 'cupcake', toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('cupcake')

  useEffect(() => {
    const saved = localStorage.getItem('lr-theme') as Theme | null
    if (saved === 'cupcake' || saved === 'dim') {
      setTheme(saved)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dim')
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('lr-theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => (t === 'cupcake' ? 'dim' : 'cupcake'))

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)
