import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Loader2, Users, Save, Wallet } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import { PACKAGES } from '../../lib/packages'

function GroupCapacityCard({ token, capacity, onSaved }) {
  const [groupClassCapacity, setGroupClassCapacity] = useState(capacity)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => setGroupClassCapacity(capacity), [capacity])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const data = await apiFetch('settings', { method: 'PUT', token, body: { groupClassCapacity: Number(groupClassCapacity) } })
      onSaved(data.settings)
      setSuccess('Configuración guardada correctamente.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 max-w-lg mb-8">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-primary shrink-0">
          <Users size={22} />
        </div>
        <div>
          <h2 className="font-syne font-bold text-lg text-secondary">Clases grupales</h2>
          <p className="text-sm text-gray-500">
            Cantidad máxima de estudiantes que pueden reservar una misma franja grupal. Aplica a las nuevas
            franjas que abras desde el Calendario; las ya creadas conservan su capacidad original.
          </p>
        </div>
      </div>

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

      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-sm font-bold text-secondary mb-2">Capacidad por clase grupal</label>
          <input
            type="number"
            min={2}
            step={1}
            required
            value={groupClassCapacity}
            onChange={(e) => setGroupClassCapacity(e.target.value)}
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-white px-6 py-3.5 rounded-xl font-bold shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Guardar
        </button>
      </form>
    </div>
  )
}

function WiseLinksCard({ token, wiseLinks, onSaved }) {
  const [links, setLinks] = useState(wiseLinks)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => setLinks(wiseLinks), [wiseLinks])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const data = await apiFetch('settings', { method: 'PUT', token, body: { wiseLinks: links } })
      onSaved(data.settings)
      setSuccess('Enlaces de Wise guardados correctamente.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 max-w-lg">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-primary shrink-0">
          <Wallet size={22} />
        </div>
        <div>
          <h2 className="font-syne font-bold text-lg text-secondary">Enlaces de pago Wise</h2>
          <p className="text-sm text-gray-500">
            Wise no ofrece un checkout automático, así que se usa como enlace manual (igual que PayPal.me):
            pega aquí el enlace de pago de Wise para cada paquete. Déjalo vacío si no quieres ofrecer Wise
            para ese paquete.
          </p>
        </div>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-4">
        {PACKAGES.map((pkg) => (
          <div key={pkg.id}>
            <label className="block text-sm font-bold text-secondary mb-2">{pkg.title}</label>
            <input
              type="url"
              value={links[pkg.id] || ''}
              onChange={(e) => setLinks((prev) => ({ ...prev, [pkg.id]: e.target.value }))}
              placeholder="https://wise.com/pay/business/..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary text-sm"
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-white px-6 py-3.5 rounded-xl font-bold shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Guardar enlaces
        </button>
      </form>
    </div>
  )
}

export default function AdminConfiguraciones() {
  const { token } = useAuth()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiFetch('settings', { token })
      .then((data) => setSettings(data.settings))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Configuraciones</h1>
      <p className="text-gray-500 mb-8">Ajusta parámetros generales de la plataforma.</p>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading || !settings ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <>
          <GroupCapacityCard token={token} capacity={settings.groupClassCapacity} onSaved={setSettings} />
          <WiseLinksCard token={token} wiseLinks={settings.wiseLinks || {}} onSaved={setSettings} />
        </>
      )}
    </div>
  )
}
