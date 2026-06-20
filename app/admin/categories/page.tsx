'use client'
import { useEffect, useRef, useState } from 'react'
import type { Category, Subcategory } from '@/lib/types'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [activeTab, setActiveTab] = useState<'categories' | 'subcategories'>('categories')
  const [toast, setToast] = useState<string | null>(null)

  // Category form state
  const [catForm, setCatForm] = useState({ name: '' })
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const catModalRef = useRef<HTMLDialogElement>(null)

  // Subcategory form state
  const [subForm, setSubForm] = useState({ name: '', categoryId: '' })
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null)
  const subModalRef = useRef<HTMLDialogElement>(null)

  const load = () => {
    fetch('/api/categories').then(r => r.json()).then(setCategories)
    fetch('/api/subcategories').then(r => r.json()).then(setSubcategories)
  }
  useEffect(() => { load() }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  // ── Categories ──
  const openCatCreate = () => { setEditingCat(null); setCatForm({ name: '' }); catModalRef.current?.showModal() }
  const openCatEdit = (c: Category) => { setEditingCat(c); setCatForm({ name: c.name }); catModalRef.current?.showModal() }

  const submitCat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCat) {
      await fetch(`/api/categories/${editingCat.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(catForm),
      })
      showToast('Categoría actualizada')
    } else {
      await fetch('/api/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(catForm),
      })
      showToast('Categoría creada')
    }
    catModalRef.current?.close(); load()
  }

  const removeCat = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría y sus subcategorías?')) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    showToast('Categoría eliminada'); load()
  }

  // ── Subcategories ──
  const openSubCreate = () => {
    setEditingSub(null)
    setSubForm({ name: '', categoryId: categories[0]?.id ?? '' })
    subModalRef.current?.showModal()
  }
  const openSubEdit = (s: Subcategory) => {
    setEditingSub(s)
    setSubForm({ name: s.name, categoryId: s.categoryId })
    subModalRef.current?.showModal()
  }

  const submitSub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingSub) {
      await fetch(`/api/subcategories/${editingSub.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subForm),
      })
      showToast('Subcategoría actualizada')
    } else {
      await fetch('/api/subcategories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subForm),
      })
      showToast('Subcategoría creada')
    }
    subModalRef.current?.close(); load()
  }

  const removeSub = async (id: string) => {
    if (!confirm('¿Eliminar esta subcategoría?')) return
    await fetch(`/api/subcategories/${id}`, { method: 'DELETE' })
    showToast('Subcategoría eliminada'); load()
  }

  const getCatName = (id: string) => categories.find(c => c.id === id)?.name ?? '-'

  return (
    <div>
      {toast && (
        <div className="toast toast-top toast-end z-50">
          <div className="alert alert-success"><span>{toast}</span></div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6">Categorías</h1>

      <div role="tablist" className="tabs tabs-lifted mb-6">
        <button
          role="tab"
          className={`tab ${activeTab === 'categories' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categorías ({categories.length})
        </button>
        <button
          role="tab"
          className={`tab ${activeTab === 'subcategories' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('subcategories')}
        >
          Subcategorías ({subcategories.length})
        </button>
      </div>

      {activeTab === 'categories' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={openCatCreate} className="btn btn-primary btn-sm">+ Nueva categoría</button>
          </div>
          <div className="card bg-base-100 shadow-sm overflow-hidden">
            <table className="table table-zebra">
              <thead>
                <tr><th>Nombre</th><th>Slug</th><th>Subcategorías</th><th></th></tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.name}</td>
                    <td><code className="text-xs bg-base-200 px-2 py-1 rounded">{c.slug}</code></td>
                    <td className="text-base-content/60">
                      {subcategories.filter(s => s.categoryId === c.id).length}
                    </td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openCatEdit(c)} className="btn btn-ghost btn-xs">Editar</button>
                        <button onClick={() => removeCat(c.id)} className="btn btn-error btn-xs btn-outline">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-base-content/40">Sin categorías</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'subcategories' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={openSubCreate} className="btn btn-primary btn-sm" disabled={categories.length === 0}>
              + Nueva subcategoría
            </button>
          </div>
          <div className="card bg-base-100 shadow-sm overflow-hidden">
            <table className="table table-zebra">
              <thead>
                <tr><th>Nombre</th><th>Categoría padre</th><th>Slug</th><th></th></tr>
              </thead>
              <tbody>
                {subcategories.map(s => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.name}</td>
                    <td><span className="badge badge-primary badge-sm">{getCatName(s.categoryId)}</span></td>
                    <td><code className="text-xs bg-base-200 px-2 py-1 rounded">{s.slug}</code></td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openSubEdit(s)} className="btn btn-ghost btn-xs">Editar</button>
                        <button onClick={() => removeSub(s.id)} className="btn btn-error btn-xs btn-outline">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {subcategories.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-base-content/40">Sin subcategorías</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Category modal */}
      <dialog ref={catModalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">{editingCat ? 'Editar categoría' : 'Nueva categoría'}</h3>
          <form onSubmit={submitCat} className="space-y-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Nombre</label>
              <input
                className="input input-bordered" required
                value={catForm.name}
                onChange={e => setCatForm({ name: e.target.value })}
              />
            </div>
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => catModalRef.current?.close()}>Cancelar</button>
              <button type="submit" className="btn btn-primary">{editingCat ? 'Guardar' : 'Crear'}</button>
            </div>
          </form>
        </div>
        <button className="modal-backdrop" onClick={() => catModalRef.current?.close()} />
      </dialog>

      {/* Subcategory modal */}
      <dialog ref={subModalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">{editingSub ? 'Editar subcategoría' : 'Nueva subcategoría'}</h3>
          <form onSubmit={submitSub} className="space-y-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Nombre</label>
              <input
                className="input input-bordered" required
                value={subForm.name}
                onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Categoría padre</label>
              <select
                className="select select-bordered" required
                value={subForm.categoryId}
                onChange={e => setSubForm(f => ({ ...f, categoryId: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => subModalRef.current?.close()}>Cancelar</button>
              <button type="submit" className="btn btn-primary">{editingSub ? 'Guardar' : 'Crear'}</button>
            </div>
          </form>
        </div>
        <button className="modal-backdrop" onClick={() => subModalRef.current?.close()} />
      </dialog>
    </div>
  )
}
