'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Category, RecipeWithDetails } from '@/lib/types'

function Stars({ value }: { value: number }) {
  return (
    <span className="text-yellow-400">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= Math.round(value) ? 'opacity-100' : 'opacity-25'}>★</span>
      ))}
    </span>
  )
}

function RecipeCard({ recipe }: { recipe: RecipeWithDetails }) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="group card bg-base-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <figure className="relative overflow-hidden">
        <img
          src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/800/500`}
          alt={recipe.title}
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 left-3 flex gap-1 flex-wrap">
          <span className="badge badge-primary badge-sm shadow-sm">{recipe.category?.name}</span>
          {recipe.subcategory && (
            <span className="badge badge-sm bg-base-100/90 text-base-content shadow-sm">{recipe.subcategory.name}</span>
          )}
        </div>
      </figure>
      <div className="card-body p-5">
        <h2 className="font-playfair text-lg font-bold leading-snug group-hover:text-primary transition-colors">
          {recipe.title}
        </h2>
        <p className="text-sm text-base-content/60 line-clamp-2 leading-relaxed">{recipe.description}</p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-base-200">
          <div className="flex items-center gap-1.5">
            <Stars value={recipe.avgRating} />
            <span className="text-xs text-base-content/40">({recipe.ratingCount})</span>
          </div>
          <span className="text-xs text-base-content/50">por <span className="font-medium">{recipe.author?.name}</span></span>
        </div>
      </div>
    </Link>
  )
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Desayunos': '🥐',
  'Almuerzo': '🍽️',
  'Cenas': '🌙',
  'Postres': '🍰',
  'Bebidas': '🥤',
  'Snacks': '🥨',
  'Sopas': '🍲',
  'Ensaladas': '🥗',
  'Panadería': '🍞',
  'Vegetariano': '🥦',
}

export default function Home() {
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCat, setActiveCat] = useState<string>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories)
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeCat) params.set('categoryId', activeCat)
    if (search) params.set('search', search)
    fetch(`/api/recipes?${params}`)
      .then(r => r.json())
      .then(data => { setRecipes(data); setLoading(false) })
  }, [activeCat, search])

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-base-100">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-secondary/10 rounded-full blur-2xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span>🍳</span> Blog de recetas artesanales
          </div>
          <h1 className="font-playfair text-5xl md:text-7xl font-bold leading-tight mb-4">
            Cocina con{' '}
            <span className="text-primary relative">
              pasión
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path d="M0 6 Q50 0 100 5 Q150 10 200 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary/40" />
              </svg>
            </span>
          </h1>
          <p className="text-base-content/60 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            Descubre recetas auténticas, comparte tus creaciones y conecta con amantes de la cocina.
          </p>

          <label className="input input-bordered input-lg w-full max-w-xl flex items-center gap-3 bg-base-100 mx-auto shadow-md">
            <svg className="h-5 w-5 text-base-content/40 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar recetas, ingredientes..."
              className="grow"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-base-content/40 hover:text-base-content">✕</button>
            )}
          </label>

          {/* Stats strip */}
          <div className="flex justify-center gap-8 mt-12 text-center">
            <div>
              <div className="font-playfair text-3xl font-bold text-primary">{recipes.length}+</div>
              <div className="text-xs text-base-content/50 mt-0.5">Recetas</div>
            </div>
            <div className="w-px bg-base-200" />
            <div>
              <div className="font-playfair text-3xl font-bold text-primary">{categories.length}</div>
              <div className="text-xs text-base-content/50 mt-0.5">Categorías</div>
            </div>
            <div className="w-px bg-base-200" />
            <div>
              <div className="font-playfair text-3xl font-bold text-primary">3</div>
              <div className="text-xs text-base-content/50 mt-0.5">Chefs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Category filter */}
      <div className="bg-base-100 border-b border-base-200 sticky top-16 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveCat('')}
            className={`btn btn-sm shrink-0 rounded-full ${activeCat === '' ? 'btn-primary' : 'btn-ghost'}`}
          >
            🍴 Todas
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(activeCat === cat.id ? '' : cat.id)}
              className={`btn btn-sm shrink-0 rounded-full ${activeCat === cat.id ? 'btn-primary' : 'btn-ghost'}`}
            >
              {CATEGORY_EMOJIS[cat.name] ?? '🍽️'} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe grid */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="text-sm text-base-content/40">Cargando recetas...</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-7xl mb-4">🍽️</div>
            <p className="text-xl font-playfair font-semibold mb-2">Sin resultados</p>
            <p className="text-base-content/50 text-sm">Prueba con otro término o categoría</p>
            <button onClick={() => { setSearch(''); setActiveCat('') }} className="btn btn-primary btn-sm mt-4">
              Ver todas las recetas
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-base-content/50">
                <span className="font-semibold text-base-content">{recipes.length}</span> receta{recipes.length !== 1 ? 's' : ''}{activeCat ? ' en esta categoría' : ''}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map(r => <RecipeCard key={r.id} recipe={r} />)}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
