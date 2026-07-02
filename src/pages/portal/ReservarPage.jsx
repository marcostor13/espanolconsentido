import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle, Clock, Loader2, User, Users } from 'lucide-react'
import Calendar from '../../components/Calendar'
import { toDateKey } from '../../lib/date'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'

function monthRange(month) {
  const from = new Date(month.getFullYear(), month.getMonth(), 1)
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  return { from: toDateKey(from), to: toDateKey(to) }
}

export default function ReservarPage() {
  const { token } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('')
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [slots, setSlots] = useState([])
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const availableEnrollments = useMemo(
    () => enrollments.filter((e) => e.status === 'active' && e.classesUsed < e.totalClasses),
    [enrollments],
  )

  const loadEnrollments = useCallback(async () => {
    try {
      const data = await apiFetch('enrollments', { token })
      setEnrollments(data.enrollments || [])
    } catch (err) {
      setError(err.message)
    }
  }, [token])

  const loadSlots = useCallback(async () => {
    setLoading(true)
    try {
      const { from, to } = monthRange(month)
      const data = await apiFetch(`availability?from=${from}&to=${to}`, { token })
      setSlots(data.slots || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [month, token])

  useEffect(() => {
    loadEnrollments()
  }, [loadEnrollments])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  useEffect(() => {
    if (!selectedEnrollmentId && availableEnrollments.length > 0) {
      setSelectedEnrollmentId(availableEnrollments[0]._id)
    }
  }, [availableEnrollments, selectedEnrollmentId])

  const slotsByDate = useMemo(() => {
    const map = {}
    for (const s of slots) {
      if (s.status !== 'open') continue
      if (!map[s.date]) map[s.date] = []
      map[s.date].push(s)
    }
    return map
  }, [slots])

  const selectedKey = toDateKey(selectedDate)
  const daySlots = [...(slotsByDate[selectedKey] || [])].sort((a, b) => a.time.localeCompare(b.time))

  const dayContent = (date) => {
    const has = slotsByDate[toDateKey(date)]?.length > 0
    return has ? <span className="w-1.5 h-1.5 rounded-full bg-green-400 mx-auto block" /> : null
  }

  const handleConfirm = async () => {
    if (!selectedEnrollmentId || !selectedSlotId) return
    setBooking(true)
    setError(null)
    setSuccess(null)
    try {
      await apiFetch('bookings', {
        method: 'POST',
        token,
        body: { enrollmentId: selectedEnrollmentId, slotId: selectedSlotId },
      })
      setSuccess('¡Clase reservada con éxito! Revisa tu email para la confirmación.')
      setSelectedSlotId(null)
      await Promise.all([loadEnrollments(), loadSlots()])
    } catch (err) {
      setError(err.message)
    } finally {
      setBooking(false)
    }
  }

  if (enrollments.length > 0 && availableEnrollments.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-10 text-center">
        <h1 className="font-syne font-bold text-2xl text-secondary mb-2">No tienes créditos disponibles</h1>
        <p className="text-gray-500">Ya usaste todas tus clases de tus cursos activos. Contacta a tu profesora para comprar más.</p>
      </div>
    )
  }

  if (enrollments.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-10 text-center">
        <h1 className="font-syne font-bold text-2xl text-secondary mb-2">Aún no tienes cursos activos</h1>
        <p className="text-gray-500">Cuando compres un curso, aparecerá aquí y podrás reservar tus clases.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Reservar clase</h1>
      <p className="text-gray-500 mb-6">Elige tu curso y una franja disponible.</p>

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

      <div className="mb-6">
        <label className="block text-sm font-bold text-secondary mb-2">Curso</label>
        <select
          value={selectedEnrollmentId}
          onChange={(e) => setSelectedEnrollmentId(e.target.value)}
          className="w-full md:w-96 p-3.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
        >
          {availableEnrollments.map((e) => (
            <option key={e._id} value={e._id}>
              {e.serviceTitle} — {e.totalClasses - e.classesUsed} clase(s) disponible(s)
            </option>
          ))}
        </select>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        <Calendar
          month={month}
          onMonthChange={setMonth}
          selectedDate={selectedDate}
          onSelectDate={(d) => {
            setSelectedDate(d)
            setSelectedSlotId(null)
          }}
          dayContent={dayContent}
          minDate={new Date(new Date().toDateString())}
        />

        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6">
          <h3 className="font-syne font-bold text-lg text-secondary mb-1">
            {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <p className="text-sm text-gray-400 mb-5">{loading ? 'Cargando...' : `${daySlots.length} horario(s) disponible(s)`}</p>

          <div className="grid grid-cols-2 gap-2 mb-6">
            {daySlots.map((slot) => {
              const isGroup = slot.type === 'group'
              const remaining = slot.capacity - (slot.bookedCount || 0)
              return (
                <button
                  key={slot._id}
                  onClick={() => setSelectedSlotId(slot._id)}
                  className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 text-sm font-bold transition ${
                    selectedSlotId === slot._id
                      ? 'bg-primary border-primary text-white'
                      : 'bg-white border-gray-200 text-secondary hover:border-primary/50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {slot.time}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-[11px] font-bold ${
                      selectedSlotId === slot._id ? 'text-white/90' : 'text-gray-400'
                    }`}
                  >
                    {isGroup ? <Users size={11} /> : <User size={11} />}
                    {isGroup ? `Grupal · ${remaining} lugar(es)` : 'Individual'}
                  </span>
                </button>
              )
            })}
            {daySlots.length === 0 && !loading && (
              <p className="col-span-2 text-sm text-gray-400 text-center py-6">No hay horarios este día.</p>
            )}
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selectedSlotId || booking}
            className="w-full bg-primary text-white py-3.5 rounded-xl font-bold shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 flex items-center justify-center gap-2"
          >
            {booking && <Loader2 size={18} className="animate-spin" />}
            Confirmar reserva
          </button>
        </div>
      </div>
    </div>
  )
}
