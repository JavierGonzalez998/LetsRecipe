'use client'
import { useEffect, useRef, useState } from 'react'
import type { Ingredient } from '@/lib/types'

const empty = { name: '', unit: '' }

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const modalRef = useRef<HTMLDialogElement>(null)

  const load = () => fetch('/api/ingredients').then(r => r.json()).then(setIngredients)
  useEffect(() => { load() }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const openCreate = () => { setEditing(null); setForm(empty); modalRef.current?.showModal() }
  const openEdit = (i: Ingredient) => { setEditing(i); setForm({ name: i.name, unit: i.unit }); modalRef.current?.showModal() }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (editing) {
      await fetch(`/api/ingredients/${editing.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      showToast('Ingrediente actualizado')
    } else {
      await fetch('/api/ingredients', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      showToast('Ingrediente creado')
    }
    setLoading(false); modalRef.current?.close(); load()
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este ingrediente?')) return
    await fetch(`/api/ingredients/${id}`, { method: 'DELETE' })
    showToast('Ingrediente eliminado'); load()
  }

  const filtered = ingredients.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  const commonUnits = ['g', 'kg', 'ml', 'l', 'taza', 'cucharada', 'cucharadita', 'unidad', 'diente', 'pizca', 'al gusto']

  return (
    <div>
      {toast && (
        <div className="toast toast-top toast-end z-50">
          <div className="alert alert-success"><span>{toast}</span></div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Ingredientes</h1>
        <button onClick={openCreate} className="btn btn-primary">+ Nuevo ingrediente</button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar ingredientes..."
          className="input input-bordered w-full max-w-xs"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card bg-base-100 shadow-sm overflow-hidden">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Unidad</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(i => (
              <tr key={i.id}>
                <td className="font-medium">{i.name}</td>
                <td><span className="badge badge-ghost">{i.unit}</span></td>
                <td>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(i)} className="btn btn-ghost btn-xs">Editar</button>
                    <button onClick={() => remove(i.id)} className="btn btn-error btn-xs btn-outline">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={3} className="text-center py-8 text-base-content/40">Sin ingredientes</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-base-content/40 mt-2">{filtered.length} de {ingredients.length} ingredientes</p>

      <dialog ref={modalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">{editing ? 'Editar ingrediente' : 'Nuevo ingrediente'}</h3>
          <form onSubmit={submit} className="space-y-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Nombre</label>
              <input
                className="input input-bordered" required
                placeholder="ej. Harina, Tomate..."
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Unidad de medida</label>
              <div className="flex gap-2">
                <input
                  className="input input-bordered flex-1" required
                  placeholder="ej. g, taza, unidad..."
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {commonUnits.map(u => (
                  <button
                    key={u} type="button"
                    onClick={() => setForm(f => ({ ...f, unit: u }))}
                    className={`badge cursor-pointer hover:badge-primary ${form.unit === u ? 'badge-primary' : 'badge-ghost'}`}
                  >
                    {u}
                  </button>
                ))}
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
