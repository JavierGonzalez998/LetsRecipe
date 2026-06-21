'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Category, Ingredient, RecipeIngredient, RecipeWithDetails, Subcategory, User } from '@/lib/types'

// Uploads a file to S3 for the given recipe ID. Returns the public URL.
async function uploadRecipeImage(recipeId: string, file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`/api/upload/recipe/${recipeId}`, { method: 'POST', body: fd })
  const data = await res.json()
  return data.url as string
}

interface RecipeForm {
  title: string
  description: string
  instructions: string
  imageUrl: string
  categoryId: string
  subcategoryId: string
  authorId: string
  ingredients: RecipeIngredient[]
}

const emptyForm: RecipeForm = {
  title: '', description: '', instructions: '', imageUrl: '',
  categoryId: '', subcategoryId: '', authorId: '', ingredients: [],
}

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState<RecipeForm>(emptyForm)
  const [editing, setEditing] = useState<RecipeWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const modalRef = useRef<HTMLDialogElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => {
    Promise.all([
      fetch('/api/recipes').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/subcategories').then(r => r.json()),
      fetch('/api/ingredients').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([r, c, s, i, u]) => {
      setRecipes(r); setCategories(c); setSubcategories(s); setIngredients(i); setUsers(u)
    })
  }
  useEffect(() => { load() }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const filteredSubs = subcategories.filter(s => s.categoryId === form.categoryId)

  const resetImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? '', authorId: users[0]?.id ?? '' })
    resetImage()
    modalRef.current?.showModal()
  }

  const openEdit = (r: RecipeWithDetails) => {
    setEditing(r)
    setForm({
      title: r.title, description: r.description, instructions: r.instructions,
      imageUrl: r.imageUrl ?? '', categoryId: r.categoryId, subcategoryId: r.subcategoryId ?? '',
      authorId: r.authorId, ingredients: r.ingredients,
    })
    resetImage()
    setImagePreview(r.imageUrl ?? null)
    modalRef.current?.showModal()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    if (file) setImagePreview(URL.createObjectURL(file))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
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
      showToast('Receta creada')
    }

    if (imageFile && recipeId) {
      await uploadRecipeImage(recipeId, imageFile)
    }

    setLoading(false); modalRef.current?.close(); load()
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar esta receta?')) return
    await fetch(`/api/recipes/${id}`, { method: 'DELETE' })
    showToast('Receta eliminada'); load()
  }

  // Ingredient list helpers
  const addIngredient = () =>
    setForm(f => ({ ...f, ingredients: [...f.ingredients, { ingredientId: ingredients[0]?.id ?? '', quantity: 1 }] }))

  const updateIngredient = (idx: number, field: 'ingredientId' | 'quantity', value: string | number) =>
    setForm(f => ({ ...f, ingredients: f.ingredients.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing) }))

  const removeIngredient = (idx: number) =>
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }))

  const getIngName = (id: string) => ingredients.find(i => i.id === id)?.name ?? '-'
  const getCatName = (id: string) => categories.find(c => c.id === id)?.name ?? '-'

  return (
    <div>
      {toast && (
        <div className="toast toast-top toast-end z-50">
          <div className="alert alert-success"><span>{toast}</span></div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Recetas</h1>
        <button onClick={openCreate} className="btn btn-primary">+ Nueva receta</button>
      </div>

      <div className="card bg-base-100 shadow-sm overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr><th>Título</th><th>Categoría</th><th>Autor</th><th>Rating</th><th>Fecha</th><th></th></tr>
          </thead>
          <tbody>
            {recipes.map(r => (
              <tr key={r.id}>
                <td>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-base-content/50 line-clamp-1">{r.description}</div>
                </td>
                <td><span className="badge badge-primary badge-sm">{getCatName(r.categoryId)}</span></td>
                <td className="text-sm text-base-content/60">{r.author?.name}</td>
                <td>
                  <span className="text-yellow-500">★</span>
                  <span className="text-sm ml-1">{r.avgRating.toFixed(1)}</span>
                  <span className="text-xs text-base-content/40 ml-1">({r.ratingCount})</span>
                </td>
                <td className="text-sm text-base-content/50">
                  {new Date(r.createdAt).toLocaleDateString('es-ES')}
                </td>
                <td>
                  <div className="flex gap-1 justify-end">
                    <Link href={`/recipes/${r.id}`} className="btn btn-ghost btn-xs">Ver</Link>
                    <button onClick={() => openEdit(r)} className="btn btn-ghost btn-xs">Editar</button>
                    <button onClick={() => remove(r.id)} className="btn btn-error btn-xs btn-outline">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {recipes.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-base-content/40">Sin recetas</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recipe modal */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box max-w-2xl w-full">
          <h3 className="font-bold text-lg mb-4">{editing ? 'Editar receta' : 'Nueva receta'}</h3>
          <form onSubmit={submit} className="space-y-5">
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
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">Imagen</label>
                <div className="flex items-start gap-4">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="w-24 h-16 object-cover rounded-lg border border-base-300 flex-none"
                    />
                  )}
                  <div className="flex flex-col gap-1 flex-1">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="file-input file-input-bordered file-input-sm w-full"
                      onChange={handleImageChange}
                    />
                    <span className="text-xs text-base-content/40">JPG, PNG, WebP o GIF · máx 10 MB</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Categoría *</label>
                <select className="select select-bordered" required
                  value={form.categoryId}
                  onChange={e => setForm(f => ({ ...f, categoryId: e.target.value, subcategoryId: '' }))}>
                  <option value="">Seleccionar...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Subcategoría</label>
                <select className="select select-bordered"
                  value={form.subcategoryId}
                  onChange={e => setForm(f => ({ ...f, subcategoryId: e.target.value }))}>
                  <option value="">Ninguna</option>
                  {filteredSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Autor *</label>
                <select className="select select-bordered" required
                  value={form.authorId} onChange={e => setForm(f => ({ ...f, authorId: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label-text font-medium">Ingredientes</label>
                <button type="button" onClick={addIngredient} className="btn btn-ghost btn-xs">+ Añadir</button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {form.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      className="select select-bordered select-sm flex-1"
                      value={ing.ingredientId}
                      onChange={e => updateIngredient(idx, 'ingredientId', e.target.value)}
                    >
                      {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                    </select>
                    <input
                      type="number" min="0.1" step="0.1"
                      className="input input-bordered input-sm w-24"
                      value={ing.quantity}
                      onChange={e => updateIngredient(idx, 'quantity', parseFloat(e.target.value))}
                    />
                    <button type="button" onClick={() => removeIngredient(idx)} className="btn btn-ghost btn-xs text-error">✕</button>
                  </div>
                ))}
                {form.ingredients.length === 0 && (
                  <p className="text-sm text-base-content/40 text-center py-2">Sin ingredientes. Haz click en + Añadir.</p>
                )}
              </div>
            </div>

            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => modalRef.current?.close()}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="loading loading-spinner loading-xs" /> : (editing ? 'Guardar' : 'Crear')}
              </button>
            </div>
          </form>
        </div>
        <button className="modal-backdrop" onClick={() => modalRef.current?.close()} />
      </dialog>
    </div>
  )
}
