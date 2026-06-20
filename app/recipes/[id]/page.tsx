'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { RecipeDetail, User } from '@/lib/types'

function Stars({ value, interactive, onChange }: { value: number; interactive?: boolean; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`text-2xl transition-colors ${
            i <= (hover || Math.round(value))
              ? 'text-yellow-400'
              : 'text-base-300'
          } ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function RecipePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [userRating, setUserRating] = useState(0)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(setCurrentUser)
  }, [])

  const loadRecipe = () => {
    fetch(`/api/recipes/${id}`)
      .then(r => r.json())
      .then(data => {
        setRecipe(data)
        const myRating = data.ratings?.find((r: { userId: string; score: number }) => r.userId === currentUser?.id)
        if (myRating) setUserRating(myRating.score)
        setLoading(false)
      })
  }

  useEffect(() => { loadRecipe() }, [id, currentUser?.id])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !currentUser) return
    setSubmitting(true)
    await fetch(`/api/recipes/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, content: comment }),
    })
    setComment('')
    setSubmitting(false)
    showToast('Comentario publicado')
    loadRecipe()
  }

  const submitRating = async (score: number) => {
    if (!currentUser) return
    setUserRating(score)
    await fetch(`/api/recipes/${id}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, score }),
    })
    showToast(`Puntuación de ${score} estrella${score !== 1 ? 's' : ''} guardada`)
    loadRecipe()
  }

  const deleteComment = async (commentId: string) => {
    if (!currentUser) return
    await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
    showToast('Comentario eliminado')
    loadRecipe()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="text-center py-32">
        <p className="text-xl mb-4">Receta no encontrada</p>
        <Link href="/" className="btn btn-primary">Volver al inicio</Link>
      </div>
    )
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Toast */}
      {toast && (
        <div className="toast toast-top toast-end z-50">
          <div className="alert alert-success shadow-lg">
            <span>{toast}</span>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="breadcrumbs text-sm mb-6">
        <ul>
          <li><Link href="/">Inicio</Link></li>
          {recipe.category && <li>{recipe.category.name}</li>}
          {recipe.subcategory && <li>{recipe.subcategory.name}</li>}
          <li className="text-base-content/60">{recipe.title}</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="badge badge-primary">{recipe.category?.name}</span>
              {recipe.subcategory && <span className="badge badge-outline">{recipe.subcategory.name}</span>}
            </div>
            <h1 className="text-4xl font-bold mb-2">{recipe.title}</h1>
            <p className="text-base-content/70 text-lg leading-relaxed">{recipe.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-base-content/60">
              <span>por <strong>{recipe.author?.name}</strong></span>
              <span>•</span>
              <span>{formatDate(recipe.createdAt)}</span>
              <span>•</span>
              <span>{recipe.commentCount} comentario{recipe.commentCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Image */}
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/800/500`}
              alt={recipe.title}
              className="w-full max-h-96 object-cover"
            />
          </div>

          {/* Instructions */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">📋 Instrucciones</h2>
              <div className="space-y-3">
                {recipe.instructions.split('\n').filter(Boolean).map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-none w-8 h-8 bg-primary text-primary-content rounded-full flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    <p className="text-base-content/80 leading-relaxed pt-1">
                      {step.replace(/^\d+\.\s*/, '')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rating section */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-2">⭐ Puntúa esta receta</h2>
              {currentUser ? (
                <>
                  <div className="flex items-center gap-4">
                    <Stars value={userRating} interactive onChange={submitRating} />
                    {userRating > 0 && (
                      <span className="text-sm text-base-content/60">Tu puntuación: {userRating}/5</span>
                    )}
                  </div>
                  <p className="text-xs text-base-content/40 mt-1">Puntuando como: <strong>{currentUser.name}</strong></p>
                </>
              ) : (
                <p className="text-sm text-base-content/50">
                  <Link href={`/login?from=/recipes/${id}`} className="link link-primary">Inicia sesión</Link> para puntuar esta receta.
                </p>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">💬 Comentarios ({recipe.commentCount})</h2>

              {/* Add comment */}
              {currentUser ? (
              <form onSubmit={submitComment} className="flex gap-3 mb-6">
                <input
                  type="text"
                  className="input input-bordered flex-1"
                  placeholder="Escribe un comentario..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
                <button className="btn btn-primary" disabled={submitting || !comment.trim()}>
                  {submitting ? <span className="loading loading-spinner loading-xs" /> : 'Publicar'}
                </button>
              </form>
              ) : (
                <p className="text-sm text-base-content/50 mb-6">
                  <Link href={`/login?from=/recipes/${id}`} className="link link-primary">Inicia sesión</Link> para dejar un comentario.
                </p>
              )}

              {/* Comment list */}
              <div className="space-y-4">
                {recipe.comments.length === 0 ? (
                  <p className="text-base-content/40 text-center py-4">Sé el primero en comentar</p>
                ) : (
                  recipe.comments.map(cm => (
                    <div key={cm.id} className="flex gap-3">
                      <div className="avatar placeholder flex-none">
                        <div className="bg-primary/20 text-primary rounded-full w-9 h-9">
                          <span className="text-sm font-bold">{cm.user?.name?.[0] ?? '?'}</span>
                        </div>
                      </div>
                      <div className="flex-1 bg-base-200 rounded-xl px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm">{cm.user?.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-base-content/40">{formatDate(cm.createdAt)}</span>
                            {currentUser && cm.userId === currentUser.id && (
                              <button
                                onClick={() => deleteComment(cm.id)}
                                className="text-xs text-error hover:underline"
                              >
                                eliminar
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm">{cm.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Rating summary */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="font-bold text-lg">Puntuación</h3>
              <div className="text-center py-2">
                <div className="text-5xl font-bold text-primary">{recipe.avgRating.toFixed(1)}</div>
                <Stars value={recipe.avgRating} />
                <p className="text-xs text-base-content/40 mt-1">{recipe.ratingCount} valoracion{recipe.ratingCount !== 1 ? 'es' : ''}</p>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="font-bold text-lg mb-3">🧂 Ingredientes</h3>
              {recipe.ingredients.length === 0 ? (
                <p className="text-base-content/40 text-sm">Sin ingredientes registrados</p>
              ) : (
                <ul className="space-y-2">
                  {recipe.ingredients.map((ri, i) => (
                    <li key={i} className="flex items-center justify-between border-b border-base-200 pb-2 last:border-0">
                      <span className="text-sm">{ri.ingredient?.name}</span>
                      <span className="text-sm font-mono bg-base-200 px-2 py-0.5 rounded text-base-content/70">
                        {ri.quantity} {ri.ingredient?.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="font-bold text-lg mb-3">Detalles</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-base-content/60">Autor</dt>
                  <dd className="font-medium">{recipe.author?.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-base-content/60">Categoría</dt>
                  <dd><span className="badge badge-primary badge-sm">{recipe.category?.name}</span></dd>
                </div>
                {recipe.subcategory && (
                  <div className="flex justify-between">
                    <dt className="text-base-content/60">Subcategoría</dt>
                    <dd><span className="badge badge-outline badge-sm">{recipe.subcategory.name}</span></dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-base-content/60">Publicado</dt>
                  <dd>{formatDate(recipe.createdAt)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <button onClick={() => router.back()} className="btn btn-ghost btn-sm w-full">
            ← Volver
          </button>
        </aside>
      </div>
    </main>
  )
}
