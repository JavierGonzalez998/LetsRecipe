'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/components/AuthProvider'
import type { Category, Ingredient, RecipeIngredient, RecipeWithDetails, Subcategory } from '@/lib/types'

// ─── Recipe form ──────────────────────────────────────────────────────────────

interface RecipeForm {
  title: string
  description: string
  instructions: string
  categoryId: string
  subcategoryId: string
  ingredients: RecipeIngredient[]
}

const emptyForm: RecipeForm = {
  title: '', description: '', instructions: '',
  categoryId: '', subcategoryId: '', ingredients: [],
}

async function uploadRecipeImage(recipeId: string, file: File) {
  const fd = new FormData()
  fd.append('file', file)
  await fetch(`/api/upload/recipe/${recipeId}`, { method: 'POST', body: fd })
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-primary font-playfair">{value}</div>
      <div className="text-xs text-base-content/50 mt-0.5">{label}</div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (user === null) router.replace('/login?from=/profile')
  }, [user, router])

  // Profile edit state
  const [nameEdit, setNameEdit] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileToast, setProfileToast] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarRef = useRef<HTMLInputElement>(null)
  const profileModalRef = useRef<HTMLDialogElement>(null)

  // Recipes state
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [form, setForm] = useState<RecipeForm>(emptyForm)
  const [editing, setEditing] = useState<RecipeWithDetails | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [recipeLoading, setRecipeLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const recipeModalRef = useRef<HTMLDialogElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }
  const showProfileToast = (msg: string) => { setProfileToast(msg); setTimeout(() => setProfileToast(null), 3000) }

  const loadRecipes = () => {
    if (!user) return
    fetch(`/api/recipes?authorId=${user.id}`).then(r => r.json()).then(setRecipes)
  }

  useEffect(() => {
    if (!user) return
    loadRecipes()
    fetch('/api/categories').then(r => r.json()).then(setCategories)
    fetch('/api/ingredients').then(r => r.json()).then(setIngredients)
  }, [user])

  useEffect(() => {
    if (!form.categoryId) return
    fetch(`/api/subcategories?categoryId=${form.categoryId}`)
      .then(r => r.json()).then(setSubcategories)
  }, [form.categoryId])

  // ── Profile edit ────────────────────────────────────────────────────────────

  const openProfileEdit = () => {
    setNameEdit(user?.name ?? '')
    setAvatarFile(null)
    setAvatarPreview(user?.avatarUrl ?? null)
    if (avatarRef.current) avatarRef.current.value = ''
    profileModalRef.current?.showModal()
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setAvatarFile(file)
    if (file) setAvatarPreview(URL.createObjectURL(file))
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSavingProfile(true)
    await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameEdit, email: user.email, role: user.role }),
    })
    if (avatarFile) {
      const fd = new FormData()
      fd.append('file', avatarFile)
      await fetch(`/api/upload/profile/${user.id}`, { method: 'POST', body: fd })
    }
    // Refresh user in context
    const updated = await fetch('/api/auth/me').then(r => r.json())
    setUser(updated)
    setSavingProfile(false)
    profileModalRef.current?.close()
    showProfileToast('Perfil actualizado')
  }

  const removeAvatar = async () => {
    if (!user) return
    await fetch(`/api/upload/profile/${user.id}`, { method: 'DELETE' })
    const updated = await fetch('/api/auth/me').then(r => r.json())
    setUser(updated)
    setAvatarPreview(null)
    showProfileToast('Foto eliminada')
  }

  // ── Recipe CRUD ─────────────────────────────────────────────────────────────

  const resetRecipeModal = () => {
    setImageFile(null)
    setImagePreview(null)
    if (imageRef.current) imageRef.current.value = ''
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? '' })
    resetRecipeModal()
    recipeModalRef.current?.showModal()
  }

  const openEdit = (r: RecipeWithDetails) => {
    setEditing(r)
    setForm({
      title: r.title, description: r.description, instructions: r.instructions,
      categoryId: r.categoryId, subcategoryId: r.subcategoryId ?? '', ingredients: r.ingredients,
    })
    resetRecipeModal()
    setImagePreview(r.imageUrl ?? null)
    recipeModalRef.current?.showModal()
  }

  const submitRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    setRecipeLoading(true)
    const payload = { ...form, subcategoryId: form.subcategoryId || undefined }
    let recipeId = editing?.id ?? ''

    if (editing) {
      await fetch(`/api/recipes/${editing.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      showToast('Receta actualizada')
    } else {
      const res = await fetch('/api/recipes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const created = await res.json()
      recipeId = created.id
      showToast('Receta publicada')
    }

    if (imageFile && recipeId) await uploadRecipeImage(recipeId, imageFile)

    setRecipeLoading(false)
    recipeModalRef.current?.close()
    loadRecipes()
  }

  const deleteRecipe = async (id: string) => {
    if (!confirm('¿Eliminar esta receta?')) return
    await fetch(`/api/recipes/${id}`, { method: 'DELETE' })
    showToast('Receta eliminada')
    loadRecipes()
  }

  const addIngredient = () =>
    setForm(f => ({ ...f, ingredients: [...f.ingredients, { ingredientId: ingredients[0]?.id ?? '', quantity: 1 }] }))
  const updateIngredient = (idx: number, field: 'ingredientId' | 'quantity', value: string | number) =>
    setForm(f => ({ ...f, ingredients: f.ingredients.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing) }))
  const removeIngredient = (idx: number) =>
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }))

  const filteredSubs = subcategories.filter(s => s.categoryId === form.categoryId)
  const getCatName = (id: string) => categories.find(c => c.id === id)?.name ?? '-'

  // ── Render ──────────────────────────────────────────────────────────────────

  if (user === undefined) {
    return (
      <div className="flex justify-center py-32">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    )
  }
  if (!user) return null

  const avgRating = recipes.length
    ? recipes.reduce((s, r) => s + r.avgRating, 0) / recipes.length
    : 0

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Toasts */}
      {(toast || profileToast) && (
        <div className="toast toast-top toast-end z-50">
          <div className="alert alert-success"><span>{toast ?? profileToast}</span></div>
        </div>
      )}

      {/* ── Profile card ─────────────────────────────────────────────────── */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative flex-none">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center ring-4 ring-base-200">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-primary">{user.name[0]}</span>
                )}
              </div>
              <span className={`absolute -bottom-1 -right-1 badge badge-sm ${user.role === 'admin' ? 'badge-primary' : 'badge-ghost'}`}>
                {user.role}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold font-playfair">{user.name}</h1>
              <p className="text-base-content/50 text-sm mt-0.5">{user.email}</p>
              <button onClick={openProfileEdit} className="btn btn-outline btn-sm mt-3">
                Editar perfil
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-6 sm:gap-8 divider-x">
              <Stat label="Recetas" value={recipes.length} />
              <div className="w-px bg-base-200" />
              <Stat label="Rating medio" value={avgRating > 0 ? avgRating.toFixed(1) : '—'} />
              <div className="w-px bg-base-200" />
              <Stat label="Comentarios" value={recipes.reduce((s, r) => s + r.commentCount, 0)} />
            </div>
          </div>
        </div>
      </div>

      {/* ── My recipes ───────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Mis recetas</h2>
          <button onClick={openCreate} className="btn btn-primary btn-sm">+ Nueva receta</button>
        </div>

        {recipes.length === 0 ? (
          <div className="text-center py-16 card bg-base-100 shadow-sm">
            <div className="text-6xl mb-3">🍽️</div>
            <p className="font-playfair text-lg font-semibold mb-1">Aún no tienes recetas</p>
            <p className="text-sm text-base-content/50 mb-4">¡Publica tu primera receta y compártela con la comunidad!</p>
            <button onClick={openCreate} className="btn btn-primary btn-sm mx-auto">Crear mi primera receta</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map(r => (
              <div key={r.id} className="card bg-base-100 shadow-sm overflow-hidden group">
                <figure className="relative">
                  <img
                    src={r.imageUrl || `https://picsum.photos/seed/${r.id}/400/250`}
                    alt={r.title}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="badge badge-primary badge-sm">{getCatName(r.categoryId)}</span>
                  </div>
                </figure>
                <div className="card-body p-4">
                  <h3 className="font-semibold leading-snug line-clamp-1">{r.title}</h3>
                  <p className="text-xs text-base-content/50 line-clamp-2">{r.description}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-base-200">
                    <div className="flex items-center gap-2 text-xs text-base-content/50">
                      <span>⭐ {r.avgRating.toFixed(1)}</span>
                      <span>·</span>
                      <span>💬 {r.commentCount}</span>
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/recipes/${r.id}`} className="btn btn-ghost btn-xs">Ver</Link>
                      <button onClick={() => openEdit(r)} className="btn btn-ghost btn-xs">Editar</button>
                      <button onClick={() => deleteRecipe(r.id)} className="btn btn-error btn-xs btn-outline">✕</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Profile edit modal ───────────────────────────────────────────── */}
      <dialog ref={profileModalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Editar perfil</h3>
          <form onSubmit={saveProfile} className="space-y-5">
            {/* Avatar upload */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Foto de perfil</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-base-200 flex items-center justify-center flex-none">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-base-content/30">👤</span>
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <input
                    ref={avatarRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="file-input file-input-bordered file-input-sm"
                    onChange={handleAvatarChange}
                  />
                  {user.avatarUrl && (
                    <button type="button" onClick={removeAvatar} className="text-xs text-error hover:underline text-left">
                      Eliminar foto actual
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Nombre</label>
              <input
                className="input input-bordered" required
                value={nameEdit}
                onChange={e => setNameEdit(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-base-content/50">Email</label>
              <input className="input input-bordered input-disabled" disabled value={user.email} />
            </div>

            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => profileModalRef.current?.close()}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? <span className="loading loading-spinner loading-xs" /> : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
        <button className="modal-backdrop" onClick={() => profileModalRef.current?.close()} />
      </dialog>

      {/* ── Recipe create / edit modal ───────────────────────────────────── */}
      <dialog ref={recipeModalRef} className="modal">
        <div className="modal-box max-w-2xl w-full">
          <h3 className="font-bold text-lg mb-4">{editing ? 'Editar receta' : 'Nueva receta'}</h3>
          <form onSubmit={submitRecipe} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">Título *</label>
                <input className="input input-bordered" required
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">Descripción *</label>
                <textarea className="textarea textarea-bordered" rows={2} required
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">Instrucciones * (una por línea)</label>
                <textarea className="textarea textarea-bordered font-mono text-sm" rows={5} required
                  placeholder="1. Paso uno&#10;2. Paso dos..."
                  value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} />
              </div>

              {/* Image upload */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">Imagen</label>
                <div className="flex items-start gap-4">
                  {imagePreview && (
                    <img src={imagePreview} alt="preview"
                      className="w-24 h-16 object-cover rounded-lg border border-base-300 flex-none" />
                  )}
                  <div className="flex flex-col gap-1 flex-1">
                    <input ref={imageRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                      className="file-input file-input-bordered file-input-sm w-full"
                      onChange={e => {
                        const file = e.target.files?.[0] ?? null
                        setImageFile(file)
                        if (file) setImagePreview(URL.createObjectURL(file))
                      }} />
                    <span className="text-xs text-base-content/40">JPG, PNG, WebP o GIF · máx 10 MB</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Categoría *</label>
                <select className="select select-bordered" required value={form.categoryId}
                  onChange={e => setForm(f => ({ ...f, categoryId: e.target.value, subcategoryId: '' }))}>
                  <option value="">Seleccionar...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Subcategoría</label>
                <select className="select select-bordered" value={form.subcategoryId}
                  onChange={e => setForm(f => ({ ...f, subcategoryId: e.target.value }))}>
                  <option value="">Ninguna</option>
                  {filteredSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label-text font-medium">Ingredientes</label>
                <button type="button" onClick={addIngredient} className="btn btn-ghost btn-xs">+ Añadir</button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {form.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select className="select select-bordered select-sm flex-1" value={ing.ingredientId}
                      onChange={e => updateIngredient(idx, 'ingredientId', e.target.value)}>
                      {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                    </select>
                    <input type="number" min="0.1" step="0.1"
                      className="input input-bordered input-sm w-24" value={ing.quantity}
                      onChange={e => updateIngredient(idx, 'quantity', parseFloat(e.target.value))} />
                    <button type="button" onClick={() => removeIngredient(idx)} className="btn btn-ghost btn-xs text-error">✕</button>
                  </div>
                ))}
                {form.ingredients.length === 0 && (
                  <p className="text-sm text-base-content/40 text-center py-2">Sin ingredientes.</p>
                )}
              </div>
            </div>

            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => recipeModalRef.current?.close()}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={recipeLoading}>
                {recipeLoading ? <span className="loading loading-spinner loading-xs" /> : (editing ? 'Guardar' : 'Publicar')}
              </button>
            </div>
          </form>
        </div>
        <button className="modal-backdrop" onClick={() => recipeModalRef.current?.close()} />
      </dialog>
    </main>
  )
}
