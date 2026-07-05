import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Clock,
  User,
  Users,
  Wallet,
  ExternalLink,
  Globe,
  FileText,
  RefreshCw,
  XCircle,
  ClipboardList,
  MessageCircleQuestion,
  CalendarDays,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import { PAYMENT_METHOD_LABEL } from '../../lib/paymentMethods'
import { INTAKE_QUESTIONS } from '../../lib/intakeQuestions'
import RescheduleModal from '../../components/RescheduleModal'

const BOOKING_STATUS_LABEL = {
  pending: { label: 'Pendiente', className: 'bg-gray-100 text-gray-600' },
  paid: { label: 'Confirmada', className: 'bg-green-50 text-green-700' },
  completed: { label: 'Completada', className: 'bg-blue-50 text-blue-700' },
  cancelled: { label: 'Cancelada', className: 'bg-red-50 text-red-700' },
}

function isUpcoming(booking) {
  if (booking.status !== 'paid') return false
  const dt = new Date(`${booking.date}T${booking.time}:00`)
  return dt.getTime() >= Date.now()
}

function Card({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={`bg-white rounded-3xl shadow-soft border border-gray-100 p-6 ${className}`}>
      <h2 className="font-syne font-bold text-lg text-secondary mb-4 flex items-center gap-2">
        {Icon && <Icon size={18} className="text-primary shrink-0" />}
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function AdminAlumnoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()

  const [student, setStudent] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [bookings, setBookings] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [reschedulingBooking, setReschedulingBooking] = useState(null)
  const [cancelingId, setCancelingId] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [userData, enrollmentsData, bookingsData, materialsData] = await Promise.all([
        apiFetch(`admin-users?id=${id}`, { token }),
        apiFetch(`enrollments?userId=${id}`, { token }),
        apiFetch(`bookings?all=true&userId=${id}`, { token }),
        apiFetch('materials', { token }),
      ])
      setStudent(userData.user)
      setEnrollments(enrollmentsData.enrollments || [])
      setBookings(bookingsData.bookings || [])
      setMaterials(materialsData.materials || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id, token])

  useEffect(() => {
    loadData()
  }, [loadData])

  const activeEnrollments = useMemo(() => enrollments.filter((e) => e.status === 'active'), [enrollments])
  const totalRemaining = useMemo(
    () => activeEnrollments.reduce((sum, e) => sum + Math.max(0, e.totalClasses - e.classesUsed), 0),
    [activeEnrollments],
  )

  const sortedBookings = useMemo(
    () => [...bookings].sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`)),
    [bookings],
  )
  const upcoming = useMemo(
    () => sortedBookings.filter(isUpcoming).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)),
    [sortedBookings],
  )
  const nextBooking = upcoming[0] || null

  const intakeBooking = useMemo(() => {
    const withAnswers = bookings
      .filter((b) => b.questions && Object.values(b.questions).some((v) => v?.trim?.()))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    return withAnswers[0] || null
  }, [bookings])

  const studentMaterials = useMemo(
    () => materials.filter((m) => m.visibility === 'all' || m.allowedUserIds?.includes(id)),
    [materials, id],
  )

  const handleCancelClass = async (booking) => {
    if (!window.confirm(`¿Cancelar la clase del ${booking.date} a las ${booking.time}?`)) return
    setCancelingId(booking._id)
    setError(null)
    try {
      await apiFetch('bookings', { method: 'PATCH', token, body: { id: booking._id, status: 'cancelled' } })
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setCancelingId(null)
    }
  }

  if (loading) {
    return <p className="text-gray-400">Cargando...</p>
  }

  if (!student) {
    return (
      <div>
        <button
          onClick={() => navigate('/admin/alumnos')}
          className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-primary transition mb-6"
        >
          <ArrowLeft size={16} /> Volver a Alumnos
        </button>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error || 'Estudiante no encontrado.'}
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => navigate('/admin/alumnos')}
        className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-primary transition mb-6"
      >
        <ArrowLeft size={16} /> Volver a Alumnos
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-syne font-bold text-3xl text-secondary mb-1 flex items-center gap-3">
            {student.name}
            {!student.active && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-200 text-gray-500">Desactivada</span>
            )}
          </h1>
          <p className="text-gray-500">{student.email}</p>
        </div>
        <div className="flex gap-4 text-center">
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 px-5 py-3">
            <p className="font-syne font-bold text-2xl text-primary">{totalRemaining}</p>
            <p className="text-xs text-gray-400 font-bold">clases restantes</p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 px-5 py-3">
            <p className="font-syne font-bold text-2xl text-secondary">
              {student.createdAt
                ? new Date(student.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'}
            </p>
            <p className="text-xs text-gray-400 font-bold">registrado</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Próxima clase" icon={Clock} className="lg:col-span-2">
          {nextBooking ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-secondary text-lg">
                  {new Date(`${nextBooking.date}T00:00:00`).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}{' '}
                  · {nextBooking.time}
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                  {nextBooking.classType === 'group' ? <Users size={13} /> : <User size={13} />}
                  {nextBooking.serviceTitle}
                  {nextBooking.classType && ` · ${nextBooking.classType === 'group' ? 'Grupal' : 'Individual'}`}
                </p>
              </div>
              <div className="flex gap-2">
                {nextBooking.enrollmentId && nextBooking.slotId && (
                  <button
                    onClick={() => setReschedulingBooking(nextBooking)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                  >
                    <RefreshCw size={14} /> Reprogramar
                  </button>
                )}
                <button
                  onClick={() => handleCancelClass(nextBooking)}
                  disabled={cancelingId === nextBooking._id}
                  className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                >
                  {cancelingId === nextBooking._id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-2">No tiene clases próximas agendadas.</p>
          )}
        </Card>

        <Card title="Formulario de reserva" icon={MessageCircleQuestion}>
          {intakeBooking ? (
            <div className="space-y-4">
              {INTAKE_QUESTIONS.map((q) => {
                const answer = intakeBooking.questions?.[q.key]
                if (!answer?.trim?.()) return null
                return (
                  <div key={q.key}>
                    <p className="text-xs font-bold text-gray-400 mb-1">{q.label}</p>
                    <p className="text-sm text-secondary bg-gray-50 rounded-xl p-3">{answer}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-2">Este alumno no completó el formulario de reserva.</p>
          )}
        </Card>

        <Card title="Compras y planes contratados" icon={ClipboardList}>
          {enrollments.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">Aún no tiene compras registradas.</p>
          ) : (
            <div className="space-y-3">
              {enrollments.map((e) => {
                const remaining = Math.max(0, e.totalClasses - e.classesUsed)
                const pct = e.totalClasses ? Math.min(100, Math.round((e.classesUsed / e.totalClasses) * 100)) : 0
                const purchaseDate = e.paidAt || e.createdAt
                const hasDiscount = e.finalPrice !== e.price
                return (
                  <div key={e._id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-bold text-secondary">{e.serviceTitle}</p>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          e.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {e.status === 'active' ? 'Activo' : 'Finalizado'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2.5 flex items-center gap-1.5">
                      <CalendarDays size={12} />
                      Comprado el{' '}
                      {purchaseDate
                        ? new Date(purchaseDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'fecha desconocida'}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1.5">
                      <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 mb-1.5">
                      <span>
                        {e.classesUsed}/{e.totalClasses} usadas · {remaining} restantes
                      </span>
                      <span className="flex items-center gap-1 font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        <Wallet size={11} />
                        {PAYMENT_METHOD_LABEL[e.paymentMethod] || 'Sin especificar'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-secondary">
                        Pagó ${e.finalPrice}
                        {hasDiscount && <span className="text-gray-400 font-normal line-through ml-1.5">${e.price}</span>}
                      </span>
                      {(e.appliedPromo || e.trialCreditApplied) && (
                        <span className="text-green-600 font-bold">
                          {e.appliedPromo?.code}
                          {e.appliedPromo && e.trialCreditApplied && ' + '}
                          {e.trialCreditApplied && `-$${e.trialCreditAmount} prueba`}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card title="Historial de clases" icon={Clock}>
          {sortedBookings.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">Aún no tiene clases registradas.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {sortedBookings.map((b) => {
                const status = BOOKING_STATUS_LABEL[b.status] || BOOKING_STATUS_LABEL.pending
                return (
                  <div key={b._id} className="flex items-center justify-between gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50/60">
                    <div>
                      <p className="font-bold text-secondary text-sm">
                        {b.date} · {b.time}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        {b.classType === 'group' ? <Users size={11} /> : b.classType ? <User size={11} /> : null}
                        {b.serviceTitle}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card title="Material asignado" icon={FileText} className="lg:col-span-2">
          {studentMaterials.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No tiene material asignado todavía.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-2">
              {studentMaterials.map((m) => (
                <a
                  key={m._id}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:border-primary/40 transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-secondary text-sm truncate">{m.title}</p>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-primary shrink-0">
                        {m.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      {m.visibility === 'all' ? (
                        <>
                          <Globe size={11} /> Todos los estudiantes
                        </>
                      ) : (
                        'Asignado directamente'
                      )}
                    </p>
                  </div>
                  <ExternalLink size={15} className="text-gray-400 shrink-0" />
                </a>
              ))}
            </div>
          )}
        </Card>
      </div>

      {reschedulingBooking && (
        <RescheduleModal
          booking={reschedulingBooking}
          token={token}
          isAdmin
          onClose={() => setReschedulingBooking(null)}
          onRescheduled={() => {
            setReschedulingBooking(null)
            loadData()
          }}
        />
      )}
    </div>
  )
}
