import React, { useEffect, useState } from 'react'
import { X, AlertCircle, CheckCircle, Loader2, Clock, User, Users, Trash2, Mail, Wallet, Video, UserPlus } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import { addMinutesToTime, formatDayLabel, parseDateKey } from '../../lib/date'

const STATUS_LABEL = {
  pending: { label: 'Pendiente', className: 'bg-gray-100 text-gray-600' },
  paid: { label: 'Confirmada', className: 'bg-green-50 text-green-700' },
  completed: { label: 'Completada', className: 'bg-blue-50 text-blue-700' },
  cancelled: { label: 'Cancelada', className: 'bg-red-50 text-red-700' },
}

export default function SlotDetailModal({ slot, token, onClose, onChanged, onDeleted }) {
  const [students, setStudents] = useState(slot.students || [])
  const [updatingId, setUpdatingId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [enrollments, setEnrollments] = useState([])
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('')
  const [reserving, setReserving] = useState(false)

  const isGroup = slot.type === 'group'
  const bookedCount = students.filter((b) => b.status !== 'cancelled').length
  const canDelete = bookedCount === 0
  // Reservar para un alumno usa un crédito de su paquete (matrícula), que son
  // clases individuales; por eso solo se ofrece en franjas individuales con cupo.
  const canReserveForStudent = !isGroup && bookedCount < (slot.capacity || 1)

  // Matrículas activas con clases disponibles del mismo tipo que la franja
  // (esta opción se ofrece solo en franjas individuales), para reservarle la
  // clase a un alumno registrado desde el calendario.
  const availableEnrollments = enrollments.filter(
    (e) =>
      e.status === 'active' &&
      (e.totalClasses || 0) - (e.classesUsed || 0) > 0 &&
      (e.classType || 'individual') === 'individual',
  )

  useEffect(() => {
    if (!canReserveForStudent) return
    apiFetch('enrollments', { token })
      .then((data) => setEnrollments(data.enrollments || []))
      .catch(() => {})
    // Solo al abrir el modal para esta franja.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleReserveForStudent = async () => {
    if (!selectedEnrollmentId) return
    setReserving(true)
    setError(null)
    setSuccess(null)
    try {
      const data = await apiFetch('bookings', {
        method: 'POST',
        token,
        body: { enrollmentId: selectedEnrollmentId, slotId: slot._id },
      })
      if (data.booking) setStudents((prev) => [...prev, data.booking])
      setSelectedEnrollmentId('')
      setSuccess('Clase reservada para el alumno. Se le agendó y se le envió el enlace de Meet.')
      onChanged?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setReserving(false)
    }
  }

  // Si una reserva confirmada no tiene guardado el enlace de Meet (la sala se
  // crea de forma asíncrona y a veces no llegó al confirmar, o es anterior al
  // arreglo), lo recuperamos del evento del calendario al abrir el modal.
  useEffect(() => {
    const missing = students.filter(
      (b) => !b.meetLink && b.calendarEventId && ['paid', 'completed'].includes(b.status),
    )
    if (!missing.length) return
    let cancelled = false
    ;(async () => {
      for (const b of missing) {
        try {
          const data = await apiFetch(`booking-meet-link?bookingId=${encodeURIComponent(b.bookingId)}`, { token })
          if (!cancelled && data.meetLink) {
            setStudents((prev) => prev.map((s) => (s._id === b._id ? { ...s, meetLink: data.meetLink } : s)))
          }
        } catch {
          // Silencioso: si no se puede recuperar, simplemente no se muestra.
        }
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleStatusChange = async (booking, status) => {
    setUpdatingId(booking._id)
    setError(null)
    setSuccess(null)
    try {
      await apiFetch('bookings', { method: 'PATCH', token, body: { id: booking._id, status } })
      setStudents((prev) => prev.map((b) => (b._id === booking._id ? { ...b, status } : b)))
      setSuccess(status === 'cancelled' ? 'Reserva cancelada.' : 'Reserva marcada como completada.')
      onChanged?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDeleteSlot = async () => {
    setDeleting(true)
    setError(null)
    try {
      await apiFetch(`availability?id=${slot._id}`, { method: 'DELETE', token })
      onDeleted?.()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const dateObj = parseDateKey(slot.date)
  const endTime = addMinutesToTime(slot.time, slot.durationMin)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/60 backdrop-blur-sm p-4 font-grotesk overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-8">
        <div className="p-6 pb-0 flex items-start justify-between">
          <div>
            <h2 className="font-syne font-bold text-xl text-secondary">Detalle de la franja</h2>
            <p className="text-sm text-gray-500 mt-1">{formatDayLabel(dateObj)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-primary transition-colors bg-gray-50 hover:bg-orange-50 rounded-full p-2"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="flex items-center gap-1.5 text-sm font-bold text-secondary bg-gray-50 px-3 py-1.5 rounded-full">
              <Clock size={14} /> {slot.time} – {endTime} · {slot.durationMin} min
            </span>
            <span
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
                isGroup ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-primary'
              }`}
            >
              {isGroup ? <Users size={13} /> : <User size={13} />}
              {isGroup ? 'Clase grupal' : 'Clase individual'}
            </span>
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                slot.status === 'full' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
              }`}
            >
              {bookedCount}/{slot.capacity} {slot.status === 'full' ? 'completo' : 'reservado(s)'}
            </span>
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

          <h3 className="font-syne font-bold text-sm text-secondary mb-3">
            Estudiantes ({students.length})
          </h3>

          {students.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-xl">
              Nadie ha reservado esta franja todavía.
            </p>
          ) : (
            <div className="space-y-2 mb-2">
              {students.map((b) => {
                const status = STATUS_LABEL[b.status] || STATUS_LABEL.pending
                return (
                  <div key={b._id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/60">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-secondary">{b.userName || b.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail size={11} /> {b.userEmail || b.email}
                        </p>
                        {b.serviceTitle && <p className="text-xs text-gray-400 mt-0.5">{b.serviceTitle}</p>}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${status.className}`}>{status.label}</span>
                    </div>
                    {b.paymentMethod && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 mt-2">
                        <Wallet size={10} />
                        {b.paymentMethod}
                      </span>
                    )}
                    {b.meetLink ? (
                      <a
                        href={b.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition break-all"
                      >
                        <Video size={14} className="shrink-0" />
                        Unirse a Google Meet
                      </a>
                    ) : (
                      ['paid', 'completed'].includes(b.status) && (
                        <p className="mt-2 text-[11px] text-gray-400 flex items-center gap-1">
                          <Video size={11} className="shrink-0" /> Enlace de Meet no disponible
                        </p>
                      )
                    )}
                    {b.status === 'paid' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleStatusChange(b, 'completed')}
                          disabled={updatingId === b._id}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition disabled:opacity-50"
                        >
                          Marcar completada
                        </button>
                        <button
                          onClick={() => handleStatusChange(b, 'cancelled')}
                          disabled={updatingId === b._id}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {updatingId === b._id && <Loader2 size={12} className="animate-spin" />}
                          Cancelar reserva
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {canReserveForStudent && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <h3 className="font-syne font-bold text-sm text-secondary mb-1 flex items-center gap-1.5">
                <UserPlus size={15} className="text-primary" /> Reservar para un alumno
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                Usa un crédito del paquete del alumno y le agenda la clase con su enlace de Meet.
              </p>
              {availableEnrollments.length === 0 ? (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                  No hay alumnos con clases disponibles en un paquete. Regístrale una compra en Reservas primero.
                </p>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedEnrollmentId}
                    onChange={(e) => setSelectedEnrollmentId(e.target.value)}
                    className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-secondary outline-none focus:border-primary"
                  >
                    <option value="">Selecciona un alumno...</option>
                    {availableEnrollments.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.studentName} — {e.serviceTitle} ({(e.totalClasses || 0) - (e.classesUsed || 0)} restantes)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleReserveForStudent}
                    disabled={reserving || !selectedEnrollmentId}
                    className="flex items-center justify-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-orange-500 transition disabled:opacity-50"
                  >
                    {reserving ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                    Reservar
                  </button>
                </div>
              )}
            </div>
          )}

          {canDelete && (
            <button
              onClick={handleDeleteSlot}
              disabled={deleting}
              className="w-full mt-4 flex items-center justify-center gap-2 text-sm font-bold px-3 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
            >
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Eliminar franja
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
