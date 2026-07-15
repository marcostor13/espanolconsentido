import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle, Check, Clock, Loader2, User, Users, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import Calendar from '../../components/Calendar'
import TimeGrid from '../../components/calendar/TimeGrid'
import {
  toDateKey,
  parseDateKey,
  addDays,
  addMonths,
  startOfWeek,
  formatWeekRangeLabel,
  formatDayLabel,
} from '../../lib/date'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'

const VIEWS = [
  { id: 'month', label: 'Mes' },
  { id: 'week', label: 'Semana' },
  { id: 'day', label: 'Día' },
]

function monthRange(month) {
  const from = new Date(month.getFullYear(), month.getMonth(), 1)
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  return { from: toDateKey(from), to: toDateKey(to) }
}

export default function ReservarPage() {
  const { token } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('')

  const [view, setView] = useState('week')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const [slots, setSlots] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const availableEnrollments = useMemo(
    () => enrollments.filter((e) => e.status === 'active' && e.classesUsed < e.totalClasses),
    [enrollments],
  )

  // Tipo de clase de la matrícula elegida: determina qué franjas (individuales
  // o grupales) puede reservar el alumno.
  const selectedEnrollment = useMemo(
    () => availableEnrollments.find((e) => e._id === selectedEnrollmentId) || null,
    [availableEnrollments, selectedEnrollmentId],
  )
  const selectedType = selectedEnrollment?.classType === 'group' ? 'group' : 'individual'

  const month = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), [currentDate])
  const weekStart = useMemo(() => startOfWeek(currentDate), [currentDate])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const { from: rangeFrom, to: rangeTo } = useMemo(() => {
    if (view === 'month') return monthRange(month)
    if (view === 'week') return { from: toDateKey(weekStart), to: toDateKey(addDays(weekStart, 6)) }
    return { from: toDateKey(currentDate), to: toDateKey(currentDate) }
  }, [view, month, weekStart, currentDate])

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
      const data = await apiFetch(`availability?from=${rangeFrom}&to=${rangeTo}`, { token })
      setSlots(data.slots || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [rangeFrom, rangeTo, token])

  const loadMyBookings = useCallback(async () => {
    try {
      const data = await apiFetch('bookings', { token })
      setMyBookings(data.bookings || [])
    } catch (err) {
      setError(err.message)
    }
  }, [token])

  useEffect(() => {
    loadEnrollments()
  }, [loadEnrollments])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  useEffect(() => {
    loadMyBookings()
  }, [loadMyBookings])

  useEffect(() => {
    if (!selectedEnrollmentId && availableEnrollments.length > 0) {
      setSelectedEnrollmentId(availableEnrollments[0]._id)
    }
  }, [availableEnrollments, selectedEnrollmentId])

  // Solo se muestran las franjas del MISMO tipo que la matrícula elegida: un
  // crédito individual solo ve franjas individuales y uno grupal solo grupales,
  // para que la disponibilidad de cada tipo sea independiente.
  const slotsByDate = useMemo(() => {
    const map = {}
    for (const s of slots) {
      if (s.status !== 'open' || s.type !== selectedType) continue
      if (!map[s.date]) map[s.date] = []
      map[s.date].push(s)
    }
    return map
  }, [slots, selectedType])

  const selectedKey = toDateKey(selectedDate)
  const daySlots = [...(slotsByDate[selectedKey] || [])].sort((a, b) => a.time.localeCompare(b.time))

  // Días en los que ya tienes una clase confirmada, para que resalten en el
  // calendario y evitar que reserves a ciegas sin ver lo que ya tienes agendado.
  const reservedDateKeys = useMemo(
    () => new Set(myBookings.filter((b) => b.status === 'paid').map((b) => b.date)),
    [myBookings],
  )

  const dayContent = (date, isSelected) => {
    const key = toDateKey(date)
    const daySlotsForDot = slotsByDate[key]
    const isReserved = reservedDateKeys.has(key)
    if (!daySlotsForDot?.length && !isReserved) return null
    const hasIndividual = daySlotsForDot?.some((s) => s.type === 'individual')
    const hasGroup = daySlotsForDot?.some((s) => s.type === 'group')
    // Sobre un día seleccionado (fondo naranja) los indicadores se pintan en
    // blanco para no perder contraste contra el mismo color de fondo.
    return (
      <span className="flex items-center gap-1 justify-center">
        {isReserved && <Check size={11} strokeWidth={3} className={isSelected ? 'text-white' : 'text-green-600'} />}
        {hasIndividual && (
          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
        )}
        {hasGroup && (
          <span className={`w-2 h-2 rounded-full ${isSelected ? 'border-2 border-white/80' : 'bg-blue-500'}`} />
        )}
      </span>
    )
  }

  // Fondo verde para marcar de un vistazo los días con una clase ya reservada.
  const dayHighlight = (date) => (reservedDateKeys.has(toDateKey(date)) ? 'reserved' : null)

  const goToday = () => {
    const now = new Date()
    setCurrentDate(now)
    setSelectedDate(now)
  }

  const goToDate = (dateKey) => {
    if (!dateKey) return
    const d = parseDateKey(dateKey)
    setCurrentDate(d)
    setSelectedDate(d)
  }

  const goPrev = () => {
    if (view === 'month') setCurrentDate((d) => addMonths(d, -1))
    else if (view === 'week') setCurrentDate((d) => addDays(d, -7))
    else setCurrentDate((d) => addDays(d, -1))
  }

  const goNext = () => {
    if (view === 'month') setCurrentDate((d) => addMonths(d, 1))
    else if (view === 'week') setCurrentDate((d) => addDays(d, 7))
    else setCurrentDate((d) => addDays(d, 1))
  }

  const rangeLabel =
    view === 'month'
      ? month.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      : view === 'week'
        ? formatWeekRangeLabel(weekStart)
        : formatDayLabel(currentDate)

  const handleGridSlotClick = (slot) => {
    setSelectedDate(parseDateKey(slot.date))
    setSelectedSlotId(slot._id)
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
      await Promise.all([loadEnrollments(), loadSlots(), loadMyBookings()])
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
          onChange={(e) => {
            setSelectedEnrollmentId(e.target.value)
            setSelectedSlotId(null)
          }}
          className="w-full md:w-96 p-3.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
        >
          {availableEnrollments.map((e) => (
            <option key={e._id} value={e._id}>
              {e.serviceTitle}
              {e.classType === 'group' ? ' (grupal)' : ''} — {e.totalClasses - e.classesUsed} clase(s) disponible(s)
            </option>
          ))}
        </select>
        {selectedType === 'group' && (
          <p className="text-xs text-gray-400 mt-2">Estás agendando una clase grupal: elige una franja grupal disponible.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={goToday}
            className="text-xs font-bold px-3.5 py-2 rounded-xl border border-gray-200 text-secondary hover:border-primary hover:text-primary transition"
          >
            Hoy
          </button>
          <div className="flex gap-1">
            <button
              onClick={goPrev}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition"
              aria-label="Anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goNext}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition"
              aria-label="Siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <h2 className="font-syne font-bold text-lg text-secondary capitalize flex items-center gap-2">
            <CalendarDays size={18} className="text-primary shrink-0" />
            {rangeLabel}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <label className="relative">
            <span className="sr-only">Ir a una fecha específica</span>
            <input
              type="date"
              min={toDateKey(new Date())}
              value={toDateKey(currentDate)}
              onChange={(e) => goToDate(e.target.value)}
              className="p-2.5 bg-white border border-gray-200 rounded-xl text-sm text-secondary outline-none focus:border-primary"
            />
          </label>

          <div className="flex bg-gray-100 rounded-xl p-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  view === v.id ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-secondary'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        {view === 'month' && (
          <div>
            <div className="flex flex-wrap items-center gap-4 mb-3 px-1 text-xs font-bold text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Individual
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Grupal
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={12} strokeWidth={3} className="text-green-600" /> Ya tienes clase reservada
              </span>
            </div>
            <Calendar
              month={month}
              onMonthChange={(m) => setCurrentDate(m)}
              selectedDate={selectedDate}
              onSelectDate={(d) => {
                setSelectedDate(d)
                setSelectedSlotId(null)
              }}
              dayContent={dayContent}
              dayHighlight={dayHighlight}
              minDate={new Date(new Date().toDateString())}
              hideNav
            />
          </div>
        )}

        {view === 'week' && (
          <TimeGrid
            days={weekDays}
            slotsByDate={slotsByDate}
            selectedDate={selectedDate}
            onSelectDay={(d) => {
              setSelectedDate(d)
              setSelectedSlotId(null)
            }}
            onSlotClick={handleGridSlotClick}
            variant="student"
            selectedSlotId={selectedSlotId}
          />
        )}

        {view === 'day' && (
          <TimeGrid
            days={[currentDate]}
            slotsByDate={slotsByDate}
            selectedDate={selectedDate}
            onSelectDay={(d) => {
              setSelectedDate(d)
              setSelectedSlotId(null)
            }}
            onSlotClick={handleGridSlotClick}
            variant="student"
            selectedSlotId={selectedSlotId}
          />
        )}

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
