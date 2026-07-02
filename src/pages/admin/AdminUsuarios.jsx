import React, { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Loader2, UserPlus, Search, GraduationCap, KeyRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import AssignCourseModal from '../../components/AssignCourseModal'

function NewUserForm({ token, onCreated }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await apiFetch('admin-users', { method: 'POST', token, body: { name, email, password, role } })
      setSuccess(`Cuenta creada para ${email}.`)
      setName('')
      setEmail('')
      setPassword('')
      setRole('student')
      onCreated()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 mb-8">
      <h2 className="font-syne font-bold text-xl text-secondary mb-1">Crear cuenta</h2>
      <p className="text-sm text-gray-500 mb-5">Crea una cuenta de estudiante o administrador.</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-start gap-2">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-secondary mb-2">Nombre</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-secondary mb-2">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-secondary mb-2">Contraseña</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-secondary mb-2">Rol</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
          >
            <option value="student">Estudiante</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            Crear cuenta
          </button>
        </div>
      </form>
    </div>
  )
}

export default function AdminUsuarios() {
  const { token, user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [assigningUser, setAssigningUser] = useState(null)
  const [success, setSuccess] = useState(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''
      const data = await apiFetch(`admin-users${query}`, { token })
      setUsers(data.users || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, search])

  useEffect(() => {
    const timeout = setTimeout(loadUsers, 300)
    return () => clearTimeout(timeout)
  }, [loadUsers])

  const handleToggleActive = async (u) => {
    setUpdatingId(u._id)
    setError(null)
    try {
      await apiFetch('admin-users', { method: 'PATCH', token, body: { id: u._id, active: !u.active } })
      await loadUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRoleChange = async (u, role) => {
    setUpdatingId(u._id)
    setError(null)
    try {
      await apiFetch('admin-users', { method: 'PATCH', token, body: { id: u._id, role } })
      await loadUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleResetPassword = async (u) => {
    if (!window.confirm(`¿Restablecer la contraseña de ${u.name}? Se le enviará una contraseña temporal por correo.`)) {
      return
    }
    setUpdatingId(u._id)
    setError(null)
    setSuccess(null)
    try {
      await apiFetch('admin-users', { method: 'PATCH', token, body: { id: u._id, resetPassword: true } })
      setSuccess(`Se envió una nueva contraseña temporal a ${u.email}.`)
      await loadUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Usuarios</h1>
      <p className="text-gray-500 mb-8">Gestiona las cuentas de estudiantes y administradores.</p>

      <NewUserForm token={token} onCreated={loadUsers} />

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-start gap-2">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="p-6 pb-4 flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-syne font-bold text-xl text-secondary">Todas las cuentas</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email"
              className="pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm text-secondary w-64"
            />
          </div>
        </div>

        <div className="p-6 pt-0">
          {loading ? (
            <p className="text-gray-400">Cargando...</p>
          ) : users.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No se encontraron usuarios.</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u._id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/60"
                >
                  <div>
                    <p className="font-bold text-secondary flex items-center gap-2">
                      {u.name} {u._id === currentUser?.id && <span className="text-xs text-gray-400">(tú)</span>}
                      {u.mustChangePassword && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          Clave temporal
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>

                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u, e.target.value)}
                    disabled={updatingId === u._id || u._id === currentUser?.id}
                    className="text-sm font-bold px-3 py-2 rounded-lg border border-gray-200 bg-white text-secondary disabled:opacity-50"
                  >
                    <option value="student">Estudiante</option>
                    <option value="admin">Administrador</option>
                  </select>

                  <button
                    onClick={() => handleToggleActive(u)}
                    disabled={updatingId === u._id || u._id === currentUser?.id}
                    className={`text-xs font-bold px-3 py-2 rounded-lg transition disabled:opacity-50 ${
                      u.active ? 'bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-700' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {u.active ? 'Activo' : 'Desactivado'}
                  </button>

                  {u.role === 'student' && (
                    <button
                      onClick={() => setAssigningUser(u)}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-orange-50 text-primary hover:bg-orange-100 transition"
                    >
                      <GraduationCap size={14} />
                      Asignar curso
                    </button>
                  )}

                  <button
                    onClick={() => handleResetPassword(u)}
                    disabled={updatingId === u._id || u._id === currentUser?.id}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    {updatingId === u._id ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                    Restablecer clave
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {assigningUser && (
        <AssignCourseModal
          user={assigningUser}
          token={token}
          onClose={() => setAssigningUser(null)}
          onAssigned={loadUsers}
        />
      )}
    </div>
  )
}
