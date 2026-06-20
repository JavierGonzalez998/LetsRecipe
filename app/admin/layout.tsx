import Link from 'next/link'
import type { ReactNode } from 'react'

const navItems = [
  { href: '/admin', label: '📊 Dashboard', exact: true },
  { href: '/admin/recipes', label: '🍽️ Recetas' },
  { href: '/admin/users', label: '👥 Usuarios' },
  { href: '/admin/categories', label: '🗂️ Categorías' },
  { href: '/admin/ingredients', label: '🧂 Ingredientes' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-60 bg-base-100 border-r border-base-200 flex flex-col py-6 px-3 shrink-0">
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
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
