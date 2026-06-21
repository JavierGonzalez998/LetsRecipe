import Link from 'next/link'
import type { ReactNode } from 'react'

const navItems = [
  { href: '/admin', label: '📊 Dashboard' },
  { href: '/admin/recipes', label: '🍽️ Recetas' },
  { href: '/admin/users', label: '👥 Usuarios' },
  { href: '/admin/categories', label: '🗂️ Categorías' },
  { href: '/admin/ingredients', label: '🧂 Ingredientes' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="drawer lg:drawer-open min-h-[calc(100vh-64px)]">
      <input id="admin-drawer" type="checkbox" className="drawer-toggle" />

      {/* Content */}
      <div className="drawer-content flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 bg-base-100 border-b border-base-200 px-4 py-3 sticky top-16 z-30">
          <label htmlFor="admin-drawer" className="btn btn-ghost btn-sm btn-square" aria-label="Abrir menú">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
          <span className="font-semibold text-sm">Panel de Admin</span>
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-40">
        <label htmlFor="admin-drawer" aria-label="Cerrar menú" className="drawer-overlay" />
        <aside className="w-60 bg-base-100 border-r border-base-200 flex flex-col py-6 px-3 min-h-full">
          <p className="text-xs font-bold uppercase tracking-widest text-base-content/40 px-3 mb-3">Panel de Admin</p>
          <nav className="flex flex-col gap-1">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} className="btn btn-ghost justify-start btn-sm">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-4 border-t border-base-200">
            <Link href="/" className="btn btn-ghost btn-sm justify-start w-full text-base-content/50">
              ← Ver blog
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
