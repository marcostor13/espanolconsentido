import React, { useCallback, useEffect, useState } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  User,
  Users,
  CalendarClock,
  XCircle,
  Loader2,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import { toDateKey } from '../../lib/date'
import { hasEnoughNotice } from '../../lib/notice'
import RescheduleModal from '../../components/RescheduleModal'

const STATUS_LABEL = {
  pending: { label: 'Pendiente', className: 'bg-gray-100 text-gray-600' },
  paid: { label: 'Confirmada', className: 'bg-green-50 text-green-700' },
  completed: { label: 'Completada', className: 'bg-blue-50 text-blue-700' },
  cancelled: { label: 'Cancelada', className: 'bg-red-50 text-red-700' },
}

function BookingCard({ booking, onCancel, onReschedule, cancelling }) {
  const status = STATUS_LABEL[booking.status] || STATUS_LABEL.pending
  const canManage = booking.status === 'paid' && booking.enrollmentId
  const notice = canManage ? hasEnoughNotice(booking) : null

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="font-bold text-secondary flex items-center gap-2 flex-wrap">
              {booking.serviceTitle}
              {booking.classType && (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {booking.classType === 'group' ? <Users size={10} /> : <User size={10} />}
                  {booking.classType === 'group' ? 'Grupal' : 'Individual'}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              {booking.date} <Clock size={13} className="ml-1" /> {booking.time}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${status.className}`}>{status.label}</span>
      </div>

      {booking.status === 'cancelled' && booking.creditRefunded !== undefined && (
        <p
          className={`mt-3 text-xs font-bold flex items-center gap-1.5 ${
            booking.creditRefunded ? 'text-green-600' : 'text-amber-600'
          }`}
        >
          {booking.creditRefunded ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
          {booking.creditRefunded
            ? 'Se te devolvió el crédito de esta clase.'
            : 'Esta clase se canceló con menos de 24h de anticipación, así que no se pudo devolver el crédito.'}
        </p>
      )}

      {canManage && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <p
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg ${
              notice ? 'text-green-700 bg-green-50' : 'text-amber-700 bg-amber-50'
            }`}
          >
            {notice ? <CheckCircle size={14} className="shrink-0" /> : <AlertTriangle size={14} className="shrink-0" />}
            {notice
              ? 'Puedes cancelar o reprogramar sin perder tu crédito.'
              : 'Quedan menos de 24h para tu clase: si cancelas o reprogramas, se perderá el crédito.'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onReschedule}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-orange-50 text-primary hover:bg-orange-100 transition"
            >
              <CalendarClock size={14} />
              Reprogramar
            </button>
            <button
              onClick={onCancel}
              disabled={cancelling}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50"
            >
              {cancelling ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CancelBookingModal({ booking, onClose, onConfirm }) {
  const notice = hasEnoughNotice(booking)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/60 backdrop-blur-sm p-4 font-grotesk overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden my-8">
        <div className="p-6 pb-0 flex items-start justify-between">
          <div>
            <h2 className="font-syne font-bold text-xl text-secondary">¿Cancelar esta clase?</h2>
            <p className="text-sm text-gray-500 mt-1">
              {booking.serviceTitle} · {booking.date} · {booking.time}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-primary transition-colors bg-gray-50 hover:bg-orange-50 rounded-full p-2"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {notice ? (
            <div className="mb-5 p-4 rounded-2xl bg-green-50 border border-green-200 flex gap-3">
              <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">
                Estás a tiempo: si cancelas ahora, tu crédito queda disponible para que reserves otra clase cuando quieras.
              </p>
            </div>
          ) : (
            <div className="mb-5 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex gap-3">
              <AlertTriangle size={22} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800 mb-1">Quedan menos de 24 horas para tu clase</p>
                <p className="text-sm text-amber-700">
                  Si cancelas ahora, no podremos devolverte el crédito de esta sesión. Es para que tu profesora pueda
                  organizar bien su tiempo. ¡Gracias por tu comprensión!
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-sm border-2 border-gray-200 text-secondary hover:border-gray-300 transition"
            >
              Volver
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl font-bold text-sm bg-primary text-white shadow-soft hover:shadow-soft-lg transition"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MisClasesPage() {
  const { token } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [cancelingBooking, setCancelingBooking] = useState(null)
  const [reschedulingBooking, setReschedulingBooking] = useState(null)

  const loadBookings = useCallback(async () => {
    try {
      const data = await apiFetch('bookings', { token })
      setBookings(data.bookings || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const handleConfirmCancel = async () => {
    const booking = cancelingBooking
    if (!booking) return
    setCancelingBooking(null)
    setCancellingId(booking._id)
    setError(null)
    try {
      await apiFetch('bookings', { method: 'PATCH', token, body: { id: booking._id, status: 'cancelled' } })
      await loadBookings()
    } catch (err) {
      setError(err.message)
    } finally {
      setCancellingId(null)
    }
  }

  const todayKey = toDateKey(new Date())
  const upcoming = bookings.filter((b) => b.date >= todayKey && b.status !== 'cancelled')
  const past = bookings.filter((b) => b.date < todayKey || b.status === 'cancelled')

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Mis clases</h1>
      <p className="text-gray-500 mb-8">Tus próximas sesiones reservadas y tu historial.</p>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="font-bold text-secondary mb-4">Próximas ({upcoming.length})</h2>
            <div className="space-y-3">
              {upcoming.length === 0 && <p className="text-sm text-gray-400">No tienes clases próximas.</p>}
              {upcoming.map((b) => (
                <BookingCard
                  key={b.bookingId}
                  booking={b}
                  cancelling={cancellingId === b._id}
                  onCancel={() => setCancelingBooking(b)}
                  onReschedule={() => setReschedulingBooking(b)}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-bold text-secondary mb-4">Historial ({past.length})</h2>
            <div className="space-y-3">
              {past.length === 0 && <p className="text-sm text-gray-400">Aún no tienes historial.</p>}
              {past.map((b) => (
                <BookingCard key={b.bookingId} booking={b} />
              ))}
            </div>
          </section>
        </div>
      )}

      {reschedulingBooking && (
        <RescheduleModal
          booking={reschedulingBooking}
          token={token}
          onClose={() => setReschedulingBooking(null)}
          onRescheduled={() => {
            setReschedulingBooking(null)
            loadBookings()
          }}
        />
      )}

      {cancelingBooking && (
        <CancelBookingModal
          booking={cancelingBooking}
          onClose={() => setCancelingBooking(null)}
          onConfirm={handleConfirmCancel}
        />
      )}
    </div>
  )
}
