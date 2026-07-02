import React, { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Loader2, PlusCircle, Clock, Search, ChevronLeft, ChevronRight, Wallet } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import { PACKAGES } from '../../lib/packages'
import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL } from '../../lib/paymentMethods'

const STATUS_LABEL = {
  pending: { label: 'Pendiente', className: 'bg-gray-100 text-gray-600' },
  paid: { label: 'Confirmada', className: 'bg-green-50 text-green-700' },
  completed: { label: 'Completada', className: 'bg-blue-50 text-blue-700' },
  cancelled: { label: 'Cancelada', className: 'bg-red-50 text-red-700' },
}

function EnrollmentForm({ token, onCreated }) {
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
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
            {PACKAGES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
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

const PAGE_SIZE = 10

export default function AdminReservas() {
  const { token } = useAuth()
  const [bookings, setBookings] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

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

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const loadBookings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (statusFilter) params.set('status', statusFilter)
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      if (search.trim()) params.set('search', search.trim())

      const data = await apiFetch(`bookings?${params.toString()}`, { token })
      setBookings(data.bookings || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, page, statusFilter, dateFrom, dateTo, search])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, dateFrom, dateTo])

  useEffect(() => {
    const timeout = setTimeout(loadBookings, 300)
    return () => clearTimeout(timeout)
  }, [loadBookings])

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id)
    setError(null)
    try {
      await apiFetch('bookings', { method: 'PATCH', token, body: { id, status } })
      await loadBookings()
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Reservas</h1>
      <p className="text-gray-500 mb-8">Registra compras de cursos y gestiona las reservas de tus estudiantes.</p>

      <EnrollmentForm
        token={token}
        onCreated={() => {
          loadBookings()
          loadEnrollments()
        }}
      />

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <h2 className="font-syne font-bold text-xl text-secondary p-6 pb-0">Todas las reservas</h2>

        <div className="p-6 pb-0 flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-secondary mb-1.5">Buscar</label>
            <Search size={16} className="absolute left-3 top-[calc(50%+8px)] -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre, email o curso"
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-secondary outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1.5">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-secondary outline-none focus:border-primary"
            >
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="paid">Confirmada</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1.5">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-secondary outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1.5">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-secondary outline-none focus:border-primary"
            />
          </div>
          {(search || statusFilter || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSearch('')
                setStatusFilter('')
                setDateFrom('')
                setDateTo('')
              }}
              className="text-xs font-bold text-gray-400 hover:text-primary transition px-2 py-2.5"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="p-6">
          {loading ? (
            <p className="text-gray-400">Cargando...</p>
          ) : bookings.length === 0 ? (
            <p className="text-gray-400 text-center py-6">
              {search || statusFilter || dateFrom || dateTo ? 'Ninguna reserva coincide con los filtros.' : 'Aún no hay reservas.'}
            </p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const status = STATUS_LABEL[b.status] || STATUS_LABEL.pending
                return (
                  <div
                    key={b.bookingId}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/60"
                  >
                    <div>
                      <p className="font-bold text-secondary">{b.userName || b.name}</p>
                      <p className="text-sm text-gray-500">{b.userEmail || b.email}</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="font-bold">{b.serviceTitle}</p>
                      <p className="flex items-center gap-1.5 text-gray-500">
                        {b.date} <Clock size={13} /> {b.time}
                      </p>
                    </div>
                    {b.paymentMethod && (
                      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        <Wallet size={12} />
                        {PAYMENT_METHOD_LABEL[b.paymentMethod] || b.paymentMethod}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.className}`}>{status.label}</span>
                    <div className="flex gap-2">
                      {b.status === 'paid' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(b._id, 'completed')}
                            disabled={updatingId === b._id}
                            className="text-xs font-bold px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition disabled:opacity-50"
                          >
                            Marcar completada
                          </button>
                          <button
                            onClick={() => handleStatusChange(b._id, 'cancelled')}
                            disabled={updatingId === b._id}
                            className="text-xs font-bold px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!loading && total > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-400">
                Página {page} de {totalPages} · {total} reserva(s)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Página siguiente"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden mt-8">
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
