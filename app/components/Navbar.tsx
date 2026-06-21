'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
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
  const { user, logout } = useAuth()
  const router = useRouter()
  const { theme, toggle } = useTheme()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <header className="navbar bg-base-100 shadow-sm sticky top-0 z-50 border-b border-base-200">
      <div className="flex-1">
        <Link href="/" className="btn btn-ghost gap-2 text-xl font-bold text-primary font-playfair">
          🍳 LetsRecipe
        </Link>
        <div className="hidden md:flex gap-1 ml-4">
          <Link href="/" className="btn btn-ghost btn-sm">Inicio</Link>
          {user?.role === 'admin' && (
            <Link href="/admin" className="btn btn-ghost btn-sm">Admin</Link>
          )}
        </div>
      </div>

      <div className="flex flex-none gap-2 items-center">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Cambiar tema"
          title={theme === 'cupcake' ? 'Activar modo oscuro' : 'Activar modo claro'}
        >
          {theme === 'cupcake' ? <MoonIcon /> : <SunIcon />}
        </button>

        {/* Mobile hamburger */}
        <div className="dropdown dropdown-bottom dropdown-end md:hidden">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-square" aria-label="Menú">
            <MenuIcon />
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-3 w-48 p-2 shadow-lg border border-base-200">
            <li><Link href="/">Inicio</Link></li>
            {user && <li><Link href="/profile">Mi perfil</Link></li>}
            {user?.role === 'admin' && <li><Link href="/admin">Panel admin</Link></li>}
            <li className="border-t border-base-200 mt-1 pt-1">
              {user === undefined ? (
                <span className="opacity-40 text-xs px-2">Cargando...</span>
              ) : user ? (
                <button onClick={handleLogout} className="text-error">Cerrar sesión</button>
              ) : (
                <Link href="/login">Iniciar sesión</Link>
              )}
            </li>
          </ul>
        </div>

        {/* Desktop: loading skeleton */}
        {user === undefined && (
          <div className="hidden md:flex items-center gap-2">
            <div className="skeleton w-8 h-8 rounded-full" />
            <div className="skeleton w-20 h-4 rounded" />
          </div>
        )}

        {/* Desktop: user menu */}
        {user && (
          <div className="dropdown dropdown-end hidden md:block">
            <div tabIndex={0} role="button" className="btn btn-ghost gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center flex-none">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-primary">{user.name[0]}</span>
                )}
              </div>
              <span className="text-sm">{user.name}</span>
              {user.role === 'admin' && <span className="badge badge-primary badge-xs">admin</span>}
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow-lg border border-base-200">
              <li><Link href="/profile">Mi perfil</Link></li>
              {user.role === 'admin' && <li><Link href="/admin">Panel admin</Link></li>}
              <li className="border-t border-base-200 mt-1 pt-1">
                <button onClick={handleLogout} className="text-error">Cerrar sesión</button>
              </li>
            </ul>
          </div>
        )}

        {/* Desktop: login button */}
        {user === null && (
          <Link href="/login" className="btn btn-primary btn-sm hidden md:inline-flex">
            Iniciar sesión
          </Link>
        )}
      </div>
    </header>
  )
}
