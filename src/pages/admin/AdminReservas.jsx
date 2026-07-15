import React, { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Clock, Loader2, PlusCircle, Wallet } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import { PACKAGES, withConfiguredPrices } from '../../lib/packages'
import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL, TRANSFER_PAYMENT_METHOD_IDS } from '../../lib/paymentMethods'

// Reservas del landing (prueba/individual/grupal/paquete) que quedaron
// `pending` porque el estudiante pagó por un medio manual (Wise,
// transferencia, efectivo): no hay webhook que las confirme solo, así que la
// admin las revisa aquí y confirma el pago a mano después de verificarlo.
function PendingPaymentsPanel({ token, onConfirmed }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [paymentMethodById, setPaymentMethodById] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch('bookings?status=pending&all=true', { token })
      setBookings(data.bookings || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const handleConfirm = async (booking) => {
    setConfirmingId(booking.bookingId)
    setError(null)
    try {
      await apiFetch('confirm-payment', {
        method: 'POST',
        token,
        body: { bookingId: booking.bookingId, paymentMethod: paymentMethodById[booking.bookingId] || 'wise' },
      })
      setBookings((prev) => prev.filter((b) => b.bookingId !== booking.bookingId))
      onConfirmed?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setConfirmingId(null)
    }
  }

  if (loading) return null
  if (bookings.length === 0) return null

  return (
    <div className="bg-white rounded-3xl shadow-soft border border-amber-200 overflow-hidden mb-8">
      <div className="p-6 pb-0 flex items-center gap-2">
        <Clock size={18} className="text-amber-600" />
        <h2 className="font-syne font-bold text-xl text-secondary">Pagos pendientes de confirmar</h2>
      </div>
      <p className="text-sm text-gray-500 px-6 pt-1">
        Reservas del sitio público con pago manual (Wise, transferencia, efectivo). Confírmalas solo después de
        verificar que el dinero llegó: al confirmar se reserva la franja y se agenda la clase.
      </p>
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.bookingId}
              className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-amber-100 bg-amber-50/40"
            >
              <div>
                <p className="font-bold text-secondary">{b.name}</p>
                <p className="text-sm text-gray-500">{b.email}</p>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-bold">{b.serviceTitle}</p>
                {b.date && (
                  <p className="text-gray-500">
                    {b.date} · {b.time}
                  </p>
                )}
                {b.wisePaymentProof && (
                  <div className="text-xs mt-1">
                    <span className="font-bold text-green-700">
                      Comprobante {PAYMENT_METHOD_LABEL[b.paymentMethod] || 'Wise'}:{' '}
                    </span>
                    {/^https?:\/\//i.test(b.wisePaymentProof) ? (
                      <>
                        <a
                          href={b.wisePaymentProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline break-all"
                        >
                          {/\.(png|jpe?g|webp|heic|gif)(\?|$)/i.test(b.wisePaymentProof) ? 'Ver imagen' : 'Ver comprobante'}
                        </a>
                        {/\.(png|jpe?g|webp|heic|gif)(\?|$)/i.test(b.wisePaymentProof) && (
                          <a href={b.wisePaymentProof} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
                            <img
                              src={b.wisePaymentProof}
                              alt="Comprobante de pago"
                              className="max-h-40 rounded-lg border border-gray-200 object-contain"
                            />
                          </a>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-600 break-all">{b.wisePaymentProof}</span>
                    )}
                  </div>
                )}
                {TRANSFER_PAYMENT_METHOD_IDS.includes(b.paymentMethod) && !b.wisePaymentProof && (
                  <p className="text-xs mt-1 text-amber-600 font-bold">
                    Eligió {PAYMENT_METHOD_LABEL[b.paymentMethod]}, sin comprobante aún
                  </p>
                )}
              </div>
              <p className="font-bold text-secondary">${b.finalPrice}</p>
              <select
                value={paymentMethodById[b.bookingId] || b.paymentMethod || 'wise'}
                onChange={(e) => setPaymentMethodById((prev) => ({ ...prev, [b.bookingId]: e.target.value }))}
                className="p-2 bg-white border border-gray-200 rounded-lg text-sm text-secondary outline-none focus:border-primary"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleConfirm(b)}
                disabled={confirmingId === b.bookingId}
                className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl bg-primary text-white hover:bg-orange-500 transition disabled:opacity-50"
              >
                {confirmingId === b.bookingId ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Confirmar pago
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EnrollmentForm({ token, onCreated }) {
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  // Paquetes con el precio configurado en /admin/configuraciones (los de
  // PACKAGES son solo el valor por defecto mientras carga).
  const [packages, setPackages] = useState(PACKAGES)
  const [packageId, setPackageId] = useState(PACKAGES[1].id)
  const [totalClasses, setTotalClasses] = useState(PACKAGES[1].totalClasses)
  const [price, setPrice] = useState(PACKAGES[1].price)
  const [promoCode, setPromoCode] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('other')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    apiFetch('settings', { token })
      .then((data) => {
        const updated = withConfiguredPrices(PACKAGES, data.settings?.packagePrices)
        setPackages(updated)
        setPrice((prev) => {
          const current = updated.find((p) => p.id === packageId)
          return current ? current.price : prev
        })
      })
      .catch(() => {})
    // Solo al montar: el precio editable no debe pisarse mientras se escribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handlePackageChange = (id) => {
    const pkg = packages.find((p) => p.id === id)
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
      const pkg = packages.find((p) => p.id === packageId)
      const result = await apiFetch('enrollments', {
        method: 'POST',
        token,
        body: {
          studentEmail: studentEmail.trim(),
          studentName: studentName.trim(),
          serviceId: packageId,
          serviceTitle: pkg.title,
          totalClasses: Number(totalClasses),
          price: Number(price),
          promoCode: promoCode.trim() || undefined,
          paymentMethod,
        },
      })
      const parts = [`Curso "${result.enrollment.serviceTitle}" asignado a ${studentEmail}.`]
      if (result.enrollment.trialCreditApplied) {
        parts.push(`Se descontaron $${result.enrollment.trialCreditAmount} por su clase de prueba previa.`)
      }
      if (result.accountCreated) {
        parts.push('Se creó su cuenta y se le envió un correo con su contraseña temporal.')
      }
      setSuccess(parts.join(' '))
      setStudentName('')
      setStudentEmail('')
      setPromoCode('')
      setPaymentMethod('other')
      onCreated()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 mb-8">
      <h2 className="font-syne font-bold text-xl text-secondary mb-1">Registrar compra</h2>
      <p className="text-sm text-gray-500 mb-5">
        Asigna créditos de clase a un estudiante. Si aún no tiene cuenta, se crea automáticamente y se le
        envía un correo con su contraseña temporal.
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

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-secondary mb-2">Nombre del estudiante</label>
          <input
            type="text"
            required
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
            placeholder="Nombre completo"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-secondary mb-2">Email del estudiante</label>
          <input
            type="email"
            required
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
            placeholder="estudiante@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-secondary mb-2">Paquete</label>
          <select
            value={packageId}
            onChange={(e) => handlePackageChange(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
          >
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} (${p.price})
              </option>
            ))}
          </select>
        </div>
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
        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
            Registrar compra
          </button>
        </div>
      </form>
    </div>
  )
}

export default function AdminReservas() {
  const { token } = useAuth()
  const [error, setError] = useState(null)

  const [enrollments, setEnrollments] = useState([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true)

  const loadEnrollments = useCallback(async () => {
    setEnrollmentsLoading(true)
    try {
      const data = await apiFetch('enrollments', { token })
      setEnrollments(data.enrollments || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setEnrollmentsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadEnrollments()
  }, [loadEnrollments])

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Reservas</h1>
      <p className="text-gray-500 mb-8">Registra compras de cursos y gestiona las reservas de tus estudiantes.</p>

      <PendingPaymentsPanel token={token} onConfirmed={loadEnrollments} />

      <EnrollmentForm token={token} onCreated={loadEnrollments} />

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <h2 className="font-syne font-bold text-xl text-secondary p-6 pb-0">Compras de cursos</h2>
        <div className="p-6">
          {enrollmentsLoading ? (
            <p className="text-gray-400">Cargando...</p>
          ) : enrollments.length === 0 ? (
            <p className="text-gray-400 text-center py-6">Aún no hay compras de cursos.</p>
          ) : (
            <div className="space-y-3">
              {enrollments.map((e) => (
                <div
                  key={e._id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/60"
                >
                  <div>
                    <p className="font-bold text-secondary">{e.studentName}</p>
                    <p className="text-sm text-gray-500">{e.studentEmail}</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="font-bold">{e.serviceTitle}</p>
                    <p className="text-gray-500">
                      {e.classesUsed}/{e.totalClasses} clases usadas
                    </p>
                  </div>
                  <div className="text-sm text-right">
                    <p className="font-bold text-secondary">${e.finalPrice}</p>
                    {(e.appliedPromo || e.trialCreditApplied) && (
                      <p className="text-xs text-green-600">
                        {e.appliedPromo?.code}
                        {e.appliedPromo && e.trialCreditApplied && ' + '}
                        {e.trialCreditApplied && `-$${e.trialCreditAmount} prueba`}
                      </p>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                    <Wallet size={12} />
                    {PAYMENT_METHOD_LABEL[e.paymentMethod] || 'Sin especificar'}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      e.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {e.status === 'active' ? 'Activo' : 'Finalizado'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
