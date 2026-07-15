import React, { useState } from 'react'
import { X, AlertCircle, CheckCircle, Loader2, PlusCircle } from 'lucide-react'
import { apiFetch } from '../lib/api'
import { PACKAGES } from '../lib/packages'
import { PAYMENT_METHODS } from '../lib/paymentMethods'

export default function AssignCourseModal({ user, token, onClose, onAssigned }) {
  const [packageId, setPackageId] = useState(PACKAGES[1].id)
  const [totalClasses, setTotalClasses] = useState(PACKAGES[1].totalClasses)
  const [price, setPrice] = useState(PACKAGES[1].price)
  const [promoCode, setPromoCode] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('other')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handlePackageChange = (id) => {
    const pkg = PACKAGES.find((p) => p.id === id)
    setPackageId(id)
    setTotalClasses(pkg.totalClasses)
    setPrice(pkg.price)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const pkg = PACKAGES.find((p) => p.id === packageId)
      const result = await apiFetch('enrollments', {
        method: 'POST',
        token,
        body: {
          studentEmail: user.email,
          studentName: user.name,
          serviceId: packageId,
          serviceTitle: pkg.title,
          totalClasses: Number(totalClasses),
          price: Number(price),
          promoCode: promoCode.trim() || undefined,
          paymentMethod,
        },
      })
      setSuccess(`Curso "${result.enrollment.serviceTitle}" asignado a ${user.name}.`)
      onAssigned?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-secondary/60 backdrop-blur-sm p-4 font-grotesk overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 pb-0 flex items-start justify-between">
          <div>
            <h2 className="font-syne font-bold text-xl text-secondary">Asignar curso</h2>
            <p className="text-sm text-gray-500 mt-1">
              {user.name} · {user.email}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-primary transition-colors bg-gray-50 hover:bg-orange-50 rounded-full p-2">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500 mb-5">
            Útil cuando compró un curso por fuera de la plataforma (efectivo, transferencia, etc.). Se le
            acreditan los créditos de clase directamente.
          </p>

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
            <div>
              <label className="block text-sm font-bold text-secondary mb-2">Paquete</label>
              <select
                value={packageId}
                onChange={(e) => handlePackageChange(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
              >
                {PACKAGES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-secondary mb-2">Nº de clases</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={totalClasses}
                  onChange={(e) => setTotalClasses(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-secondary mb-2">Precio pagado ($)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-secondary mb-2">
                Código promocional <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-secondary mb-2">Medio de pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
                Asignar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
