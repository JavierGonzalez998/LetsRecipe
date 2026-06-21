'use client'
import Link from 'next/link'
import { useAuth } from './AuthProvider'

export default function FooterAccount() {
  const { user, logout } = useAuth()

  return (
    <div>
      <h4 className="font-semibold mb-3 text-base-content/80">Cuenta</h4>
      <ul className="space-y-2 text-sm text-base-content/60">
        {user === undefined && (
          <li><span className="opacity-40">Cargando...</span></li>
        )}
        {user === null && (
          <li><Link href="/login" className="hover:text-primary transition-colors">Iniciar sesión</Link></li>
        )}
        {user && (
          <>
            <li><Link href="/profile" className="hover:text-primary transition-colors">Mi perfil</Link></li>
            {user.role === 'admin' && (
              <li><Link href="/admin" className="hover:text-primary transition-colors">Panel admin</Link></li>
            )}
            <li>
              <button
                onClick={() => logout()}
                className="hover:text-error transition-colors text-left"
              >
                Cerrar sesión
              </button>
            </li>
          </>
        )}
      </ul>
    </div>
  )
}
