'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import type { User } from '@/lib/types'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/admin'
  const { setUser } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (res.ok) {
      const userData: User = await res.json()
      setUser(userData)           // actualiza el contexto global inmediatamente
      router.push(from)
    } else {
      const data = await res.json()
      setError(data.error || 'Error al iniciar sesión')
    }
    setLoading(false)
  }

  const demoUsers = [
    { label: 'Admin Chef', email: 'admin@letsrecipe.com', password: 'admin123' },
    { label: 'María García', email: 'maria@example.com', password: 'maria123' },
    { label: 'Carlos López', email: 'carlos@example.com', password: 'carlos123' },
  ]

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body gap-5">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Iniciar sesión</h1>
            <p className="text-base-content/60 mt-1 text-sm">Accede a tu cuenta de LetsRecipe</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {error && (
              <div className="alert alert-error text-sm py-2">
                <span>{error}</span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-base-content">Email</label>
              <input
                type="email"
                className="input input-bordered w-full"
                placeholder="tu@email.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-base-content">Contraseña</label>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="••••••••"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : 'Entrar'}
            </button>
          </form>

          <div className="divider text-xs text-base-content/40">Usuarios demo</div>

          <div className="space-y-2">
            {demoUsers.map(u => (
              <button
                key={u.email}
                type="button"
                onClick={() => { setEmail(u.email); setPassword(u.password) }}
                className="btn btn-ghost btn-sm w-full justify-between font-normal"
              >
                <span>{u.label}</span>
                <span className="text-xs text-base-content/40 font-mono">{u.password}</span>
              </button>
            ))}
          </div>

          <div className="text-center text-sm text-base-content/50">
            <Link href="/" className="link link-hover">← Volver al blog</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
