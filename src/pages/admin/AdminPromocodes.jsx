import React, { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Loader2, PlusCircle, Trash2, Tag } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'

function NewPromocodeForm({ token, onCreated }) {
  const [code, setCode] = useState('')
  const [discountPercent, setDiscountPercent] = useState(10)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await apiFetch('promocodes', { method: 'POST', token, body: { code, discountPercent: Number(discountPercent) } })
      setCode('')
      setDiscountPercent(10)
      onCreated()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 mb-8">
      <h2 className="font-syne font-bold text-xl text-secondary mb-1">Crear código</h2>
      <p className="text-sm text-gray-500 mb-5">
        Se aplica automáticamente al confirmar una reserva del landing o al registrar una compra de curso.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-bold text-secondary mb-2">Código</label>
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="WELCOME"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary uppercase"
          />
        </div>
        <div className="w-32">
          <label className="block text-sm font-bold text-secondary mb-2">Descuento (%)</label>
          <input
            type="number"
            min={1}
            max={100}
            required
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
          Crear
        </button>
      </form>
    </div>
  )
}

export default function AdminPromocodes() {
  const { token } = useAuth()
  const [promocodes, setPromocodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const loadPromocodes = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch('promocodes', { token })
      setPromocodes(data.promocodes || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadPromocodes()
  }, [loadPromocodes])

  const handleToggleActive = async (p) => {
    setUpdatingId(p._id)
    setError(null)
    try {
      await apiFetch('promocodes', { method: 'PATCH', token, body: { id: p._id, active: !p.active } })
      await loadPromocodes()
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este código promocional?')) return
    setUpdatingId(id)
    setError(null)
    try {
      await apiFetch(`promocodes?id=${id}`, { method: 'DELETE', token })
      await loadPromocodes()
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Códigos de descuento</h1>
      <p className="text-gray-500 mb-8">Crea y administra los códigos promocionales de la plataforma.</p>

      <NewPromocodeForm token={token} onCreated={loadPromocodes} />

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6">
        <h2 className="font-syne font-bold text-xl text-secondary mb-5">Todos los códigos</h2>
        {loading ? (
          <p className="text-gray-400">Cargando...</p>
        ) : promocodes.length === 0 ? (
          <p className="text-gray-400 text-center py-6">Aún no has creado códigos promocionales.</p>
        ) : (
          <div className="space-y-2">
            {promocodes.map((p) => (
              <div
                key={p._id}
                className="flex items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-primary shrink-0">
                    <Tag size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-secondary">{p.code}</p>
                    <p className="text-sm text-gray-500">{p.discountPercent}% de descuento</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(p)}
                    disabled={updatingId === p._id}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition disabled:opacity-50 ${
                      p.active !== false
                        ? 'bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-700'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {p.active !== false ? <CheckCircle size={13} /> : null}
                    {p.active !== false ? 'Activo' : 'Desactivado'}
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    disabled={updatingId === p._id}
                    className="text-gray-400 hover:text-red-600 transition p-2"
                    aria-label="Eliminar código"
                  >
                    {updatingId === p._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
