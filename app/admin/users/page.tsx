'use client'
import { useEffect, useRef, useState } from 'react'
import type { User } from '@/lib/types'

const empty = { name: '', email: '', password: '', role: 'user' as 'admin' | 'user' }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const modalRef = useRef<HTMLDialogElement>(null)

  const load = () => fetch('/api/users').then(r => r.json()).then(setUsers)
  useEffect(() => { load() }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const openCreate = () => {
    setEditing(null)
    setForm(empty)
    modalRef.current?.showModal()
  }

  const openEdit = (u: User) => {
    setEditing(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role })
    modalRef.current?.showModal()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (editing) {
      await fetch(`/api/users/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      showToast('Usuario actualizado')
    } else {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      showToast('Usuario creado')
    }
    setLoading(false)
    modalRef.current?.close()
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    showToast('Usuario eliminado')
    load()
  }

  return (
    <div>
      {toast && (
        <div className="toast toast-top toast-end z-50">
          <div className="alert alert-success"><span>{toast}</span></div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <button onClick={openCreate} className="btn btn-primary">+ Nuevo usuario</button>
      </div>

      <div className="card bg-base-100 shadow-sm overflow-hidden">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Registrado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="font-medium">{u.name}</td>
                <td className="text-base-content/60">{u.email}</td>
                <td>
                  <span className={`badge badge-sm ${u.role === 'admin' ? 'badge-primary' : 'badge-ghost'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="text-sm text-base-content/50">
                  {new Date(u.createdAt).toLocaleDateString('es-ES')}
                </td>
                <td>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(u)} className="btn btn-ghost btn-xs">Editar</button>
                    <button onClick={() => remove(u.id)} className="btn btn-error btn-xs btn-outline">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-base-content/40">Sin usuarios</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <dialog ref={modalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">{editing ? 'Editar usuario' : 'Nuevo usuario'}</h3>
          <form onSubmit={submit} className="space-y-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Nombre</label>
              <input
                className="input input-bordered"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                className="input input-bordered"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Contraseña {editing && <span className="text-base-content/40 font-normal">(dejar vacío para no cambiar)</span>}
              </label>
              <input
                type="password"
                className="input input-bordered"
                required={!editing}
                placeholder={editing ? '••••••••' : 'Contraseña'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Rol</label>
              <select
                className="select select-bordered"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as 'admin' | 'user' }))}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
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
