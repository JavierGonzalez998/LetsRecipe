'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ recipes: 0, users: 0, categories: 0, ingredients: 0 })

  useEffect(() => {
    Promise.all([
      fetch('/api/recipes').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/ingredients').then(r => r.json()),
    ]).then(([recipes, users, categories, ingredients]) => {
      setStats({
        recipes: recipes.length,
        users: users.length,
        categories: categories.length,
        ingredients: ingredients.length,
      })
    })
  }, [])

  const statCards = [
    { label: 'Recetas', value: stats.recipes, icon: '🍽️', href: '/admin/recipes', color: 'text-primary' },
    { label: 'Usuarios', value: stats.users, icon: '👥', href: '/admin/users', color: 'text-secondary' },
    { label: 'Categorías', value: stats.categories, icon: '🗂️', href: '/admin/categories', color: 'text-accent' },
    { label: 'Ingredientes', value: stats.ingredients, icon: '🧂', href: '/admin/ingredients', color: 'text-info' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map(s => (
          <Link key={s.href} href={s.href}>
            <div className="stat bg-base-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="stat-figure text-3xl">{s.icon}</div>
              <div className={`stat-value ${s.color}`}>{s.value}</div>
              <div className="stat-title">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>
      <div className="card bg-base-100 shadow-sm p-6">
        <h2 className="font-bold text-lg mb-2">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/recipes" className="btn btn-primary btn-sm">+ Nueva receta</Link>
          <Link href="/admin/users" className="btn btn-secondary btn-sm">+ Nuevo usuario</Link>
          <Link href="/admin/categories" className="btn btn-accent btn-sm">+ Nueva categoría</Link>
          <Link href="/admin/ingredients" className="btn btn-info btn-sm">+ Nuevo ingrediente</Link>
        </div>
      </div>
    </div>
  )
}
