'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@/lib/types'
import { useTheme } from './ThemeProvider'

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

export default function Navbar() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const router = useRouter()
  const { theme, toggle } = useTheme()

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(setUser)
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="navbar bg-base-100 shadow-sm sticky top-0 z-50 border-b border-base-200">
      <div className="flex-1">
        <Link href="/" className="btn btn-ghost gap-2 text-xl font-bold text-primary font-playfair">
          🍳 LetsRecipe
        </Link>
        {/* Desktop nav links */}
        <div className="hidden md:flex gap-1 ml-4">
          <Link href="/" className="btn btn-ghost btn-sm">Inicio</Link>
          {user?.role === 'admin' && (
            <Link href="/admin" className="btn btn-ghost btn-sm">Admin</Link>
          )}
        </div>
      </div>

      <div className="flex-none gap-2 items-center">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Cambiar tema"
          title={theme === 'cupcake' ? 'Activar modo oscuro' : 'Activar modo claro'}
        >
          {theme === 'cupcake' ? <MoonIcon /> : <SunIcon />}
        </button>

        {/* Mobile hamburger menu */}
        <div className="dropdown dropdown-bottom dropdown-end md:hidden">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-square" aria-label="Menú">
            <MenuIcon />
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-3 w-48 p-2 shadow-lg border border-base-200">
            <li><Link href="/">Inicio</Link></li>
            {user?.role === 'admin' && <li><Link href="/admin">Panel admin</Link></li>}
            <li className="border-t border-base-200 mt-1 pt-1">
              {user === undefined ? null : user ? (
                <button onClick={logout} className="text-error">Cerrar sesión</button>
              ) : (
                <Link href="/login">Iniciar sesión</Link>
              )}
            </li>
          </ul>
        </div>

        {/* Desktop user menu */}
        {user === undefined ? (
          <span className="loading loading-spinner loading-xs opacity-30 hidden md:inline-flex" />
        ) : user ? (
          <div className="dropdown dropdown-end hidden md:block">
            <div tabIndex={0} role="button" className="btn btn-ghost gap-2">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-8 overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold">{user.name[0]}</span>
                  )}
                </div>
              </div>
              <span className="text-sm">{user.name}</span>
              {user.role === 'admin' && (
                <span className="badge badge-primary badge-xs">admin</span>
              )}
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-3 w-48 p-2 shadow-lg border border-base-200">
              {user.role === 'admin' && (
                <li><Link href="/admin">Panel admin</Link></li>
              )}
              <li>
                <button onClick={logout} className="text-error">Cerrar sesión</button>
              </li>
            </ul>
          </div>
        ) : (
          <Link href="/login" className="btn btn-primary btn-sm hidden md:inline-flex">Iniciar sesión</Link>
        )}
      </div>
    </header>
  )
}
