'use client'
import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user === null) router.replace('/login?from=/admin')
    else if (user && user.role !== 'admin') router.replace('/')
  }, [user, router])

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center flex-1 py-32">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    )
  }

  if (!user || user.role !== 'admin') return null

  return <>{children}</>
}
