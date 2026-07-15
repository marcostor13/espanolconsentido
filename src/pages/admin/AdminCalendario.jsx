import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Loader2, Clock, AlertCircle, Users, User, ChevronLeft, ChevronRight, CalendarDays, RefreshCw, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import Calendar from '../../components/Calendar'
import TimeGrid, { reservedCategory } from '../../components/calendar/TimeGrid'
import SlotDetailModal from '../../components/calendar/SlotDetailModal'
import BulkAvailabilityModal from '../../components/calendar/BulkAvailabilityModal'
import QuickAvailabilityModal from '../../components/calendar/QuickAvailabilityModal'
import { toDateKey, parseDateKey, addDays, addMonths, startOfWeek, formatWeekRangeLabel, formatDayLabel } from '../../lib/date'
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

// Punto de color por tipo de clase: relleno = tiene reserva confirmada,
// contorno = hay franja disponible pero nadie ha reservado todavía.
// Sobre un día seleccionado (fondo naranja) se muestra en blanco para que no se pierda el contraste.
function DayDot({ booked, open, colorKey, isSelected }) {
  if (!booked && !open) return null
  if (isSelected) {
    return <span className={`w-2 h-2 rounded-full ${booked ? 'bg-white' : 'border-2 border-white/80'}`} />
  }
  const solid = colorKey === 'individual' ? 'bg-primary' : 'bg-blue-500'
  const outline = colorKey === 'individual' ? 'border-primary/50' : 'border-blue-400/60'
  return <span className={`w-2 h-2 rounded-full ${booked ? solid + ' ring-1 ring-white' : `border-2 ${outline}`}`} />
}

export default function AdminCalendario() {
  const { token } = useAuth()
  const [view, setView] = useState('week')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const [slots, setSlots] = useState([])
  const [bookings, setBookings] = useState([])
  const [busyByDate, setBusyByDate] = useState({})
  const [calendarSync, setCalendarSync] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [showSync, setShowSync] = useState(false)
  const [groupCapacity, setGroupCapacity] = useState(4)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [newTime, setNewTime] = useState('09:00')
  const [newDuration, setNewDuration] = useState(50)
  const [newType, setNewType] = useState('individual')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [detailSlot, setDetailSlot] = useState(null)
  const [bulkRange, setBulkRange] = useState(null)
  // Rango pintado con el mouse en la vista semana/día para creación rápida.
  const [quickRange, setQuickRange] = useState(null)

  const month = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), [currentDate])
  const weekStart = useMemo(() => startOfWeek(currentDate), [currentDate])

  const { from: rangeFrom, to: rangeTo } = useMemo(() => {
    if (view === 'month') return monthRange(month)
    if (view === 'week') return { from: toDateKey(weekStart), to: toDateKey(addDays(weekStart, 6)) }
    return { from: toDateKey(currentDate), to: toDateKey(currentDate) }
  }, [view, month, weekStart, currentDate])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [availData, bookingsData, busyData] = await Promise.all([
        apiFetch(`availability?from=${rangeFrom}&to=${rangeTo}`, { token }),
        apiFetch(`bookings?from=${rangeFrom}&to=${rangeTo}&all=true`, { token }),
        // Horas ocupadas en el Google Calendar de la profesora. Si el endpoint
        // aún no está desplegado o Google falla, se ignora sin romper la vista.
        apiFetch(`calendar-busy?from=${rangeFrom}&to=${rangeTo}`, { token }).catch((err) => ({
          busy: [],
          reason: 'error',
          error: err.message,
        })),
      ])
      setSlots(availData.slots || [])
      setBookings(bookingsData.bookings || [])
      const busyMap = {}
      for (const seg of busyData.busy || []) {
        if (!busyMap[seg.date]) busyMap[seg.date] = []
        busyMap[seg.date].push(seg)
      }
      setBusyByDate(busyMap)
      setCalendarSync({
        connected: busyData.connected ?? null,
        reason: busyData.reason || null,
        error: busyData.error || null,
        eventCount: busyData.eventCount ?? (busyData.busy?.length || 0),
        rawCount: busyData.rawCount ?? null,
        accountEmail: busyData.accountEmail || null,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [rangeFrom, rangeTo, token])

  const handleSync = useCallback(async () => {
    setSyncing(true)
    setShowSync(true)
    await loadData()
    setSyncing(false)
  }, [loadData])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    apiFetch('settings', { token })
      .then((data) => setGroupCapacity(data.settings.groupClassCapacity))
      .catch(() => {})
  }, [token])

  const bookingsBySlotId = useMemo(() => {
    const map = {}
    for (const b of bookings) {
      if (!b.slotId) continue
      if (!map[b.slotId]) map[b.slotId] = []
      map[b.slotId].push(b)
    }
    return map
  }, [bookings])

  const enrichedSlots = useMemo(
    () => slots.map((s) => ({ ...s, students: bookingsBySlotId[s._id] || [] })),
    [slots, bookingsBySlotId],
  )

  const slotsByDate = useMemo(() => {
    const map = {}
    for (const s of enrichedSlots) {
      if (!map[s.date]) map[s.date] = []
      map[s.date].push(s)
    }
    return map
  }, [enrichedSlots])

  const selectedKey = toDateKey(selectedDate)
  const daySlots = [...(slotsByDate[selectedKey] || [])].sort((a, b) => a.time.localeCompare(b.time))
  const dayBusy = [...(busyByDate[selectedKey] || [])].sort((a, b) => a.startTime.localeCompare(b.startTime))

  const dayContent = (date, isSelected) => {
    const daySlotsForDot = slotsByDate[toDateKey(date)]
    if (!daySlotsForDot?.length) return null
    const individualBooked = daySlotsForDot.some((s) => s.type === 'individual' && (s.bookedCount || 0) > 0)
    const individualOpen = daySlotsForDot.some((s) => s.type === 'individual' && (s.bookedCount || 0) === 0)
    const groupBooked = daySlotsForDot.some((s) => s.type === 'group' && (s.bookedCount || 0) > 0)
    const groupOpen = daySlotsForDot.some((s) => s.type === 'group' && (s.bookedCount || 0) === 0)

    return (
      <span className="flex gap-1 justify-center">
        <DayDot booked={individualBooked} open={individualOpen} colorKey="individual" isSelected={isSelected} />
        <DayDot booked={groupBooked} open={groupOpen} colorKey="group" isSelected={isSelected} />
      </span>
    )
  }

  // Resalta con un fondo de color los días que ya tienen al menos una
  // reserva confirmada, para que salten a la vista sin tener que fijarse
  // en los puntos pequeños.
  const dayHighlight = (date) => {
    const daySlotsForDate = slotsByDate[toDateKey(date)]
    if (!daySlotsForDate?.length) return null
    const hasIndividualBooked = daySlotsForDate.some((s) => s.type === 'individual' && (s.bookedCount || 0) > 0)
    const hasGroupBooked = daySlotsForDate.some((s) => s.type === 'group' && (s.bookedCount || 0) > 0)
    if (hasIndividualBooked && hasGroupBooked) return 'both'
    if (hasIndividualBooked) return 'individual'
    if (hasGroupBooked) return 'group'
    return null
  }

  const handleAddSlot = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await apiFetch('availability', {
        method: 'POST',
        token,
        body: { date: selectedKey, time: newTime, durationMin: Number(newDuration), type: newType },
      })
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSlot = async (id) => {
    setDeletingId(id)
    setError(null)
    try {
      await apiFetch(`availability?id=${id}`, { method: 'DELETE', token })
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

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

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const handleCellClick = (date, time) => {
    setSelectedDate(date)
    setNewTime(time)
  }

  const handleRangeSelect = (date, startTime, endTime) => {
    setSelectedDate(date)
    setQuickRange({ date, startTime, endTime })
  }

  const handleSlotUpdated = () => {
    loadData()
  }

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Calendario</h1>
      <p className="text-gray-500 mb-6">Gestiona tus horarios disponibles y revisa las reservas de tus estudiantes.</p>

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
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 text-sm font-bold px-3.5 py-2.5 rounded-xl border border-gray-200 text-secondary hover:border-primary hover:text-primary transition disabled:opacity-50"
            title="Volver a leer los eventos de tu Google Calendar"
          >
            <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
            Sincronizar
          </button>
          <label className="relative">
            <span className="sr-only">Ir a una fecha específica</span>
            <input
              type="date"
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

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {(() => {
        // Diagnóstico de la sincronización con Google Calendar. Los estados de
        // éxito/vacío solo se muestran tras pulsar "Sincronizar"; los de error o
        // sin conexión se muestran siempre, porque requieren acción del admin.
        if (!calendarSync) return null
        const { connected, reason, error: syncError, eventCount, rawCount, accountEmail } = calendarSync
        const acct = accountEmail ? ` (${accountEmail})` : ''
        let tone = null
        let text = null
        if (connected && eventCount > 0) {
          if (!showSync) return null
          tone = 'green'
          text = `Sincronizado con Google Calendar${acct}: ${eventCount} evento(s) bloqueando horarios en esta vista.`
        } else if (connected) {
          if (!showSync) return null
          tone = 'amber'
          text =
            rawCount > 0
              ? `Conectado a Google Calendar${acct}. En el rango visible solo hay eventos creados por la app (ya aparecen como reservas).`
              : `Conectado a Google Calendar${acct}, pero no se encontraron eventos en el rango visible. Verifica que el evento esté en tu calendario PRINCIPAL (no en uno secundario) y dentro de estas fechas.`
        } else if (reason === 'error') {
          tone = 'red'
          text = `No se pudo leer tu Google Calendar: ${syncError || 'error desconocido'}. La conexión pudo haber caducado.`
        } else {
          tone = 'red'
          text = 'Tu Google Calendar no está conectado, por eso no se bloquean horarios con tus eventos.'
        }
        const toneClass =
          tone === 'green'
            ? 'bg-green-50 border-green-200 text-green-800'
            : tone === 'amber'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-red-50 border-red-200 text-red-700'
        const Icon = tone === 'green' ? CheckCircle : AlertCircle
        return (
          <div className={`mb-6 p-3 border rounded-xl text-sm flex items-start gap-2 ${toneClass}`}>
            <Icon size={18} className="shrink-0 mt-0.5" />
            <span>
              {text}
              {tone === 'red' && (
                <>
                  {' '}
                  <Link to="/admin/configuraciones" className="font-bold underline">
                    Volver a conectar Google
                  </Link>
                </>
              )}
            </span>
          </div>
        )
      })()}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        {view === 'month' && (
          <div>
            <div className="flex flex-wrap items-center gap-4 mb-3 px-1 text-xs font-bold text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Individual reservada
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-primary/50" /> Individual disponible
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Grupal reservada
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-blue-400/60" /> Grupal disponible
              </span>
              <span className="flex items-center gap-1.5 text-gray-400 font-normal normal-case">
                · El fondo del día se colorea cuando ya tiene reservas
              </span>
            </div>
            <Calendar
              month={month}
              onMonthChange={(m) => setCurrentDate(m)}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onSelectRange={(start, end) => setBulkRange({ start, end })}
              dayContent={dayContent}
              dayHighlight={dayHighlight}
              hideNav
            />
          </div>
        )}

        {view === 'week' && (
          <TimeGrid
            days={weekDays}
            slotsByDate={slotsByDate}
            busyByDate={busyByDate}
            selectedDate={selectedDate}
            onSelectDay={setSelectedDate}
            onCellClick={handleCellClick}
            onSlotClick={setDetailSlot}
            onRangeSelect={handleRangeSelect}
          />
        )}

        {view === 'day' && (
          <TimeGrid
            days={[currentDate]}
            slotsByDate={slotsByDate}
            busyByDate={busyByDate}
            selectedDate={selectedDate}
            onSelectDay={setSelectedDate}
            onCellClick={handleCellClick}
            onSlotClick={setDetailSlot}
            onRangeSelect={handleRangeSelect}
          />
        )}

        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6">
          <h3 className="font-syne font-bold text-lg text-secondary mb-1">
            {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <p className="text-sm text-gray-400 mb-5">
            {loading ? 'Cargando...' : `${daySlots.length} franja(s)`}
          </p>

          <form onSubmit={handleAddSlot} className="space-y-3 mb-6">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewType('individual')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs border-2 transition ${
                  newType === 'individual' ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-secondary'
                }`}
              >
                <User size={14} /> Individual
              </button>
              <button
                type="button"
                onClick={() => setNewType('group')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs border-2 transition ${
                  newType === 'group' ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-secondary'
                }`}
              >
                <Users size={14} /> Grupal
              </button>
            </div>
            {newType === 'group' && (
              <p className="text-xs text-gray-400">
                Capacidad: {groupCapacity} personas (configurable en Configuraciones)
              </p>
            )}

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-bold text-secondary mb-1.5">Hora</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-secondary outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-bold text-secondary mb-1.5">Min.</label>
                <select
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-secondary outline-none focus:border-primary"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={55}>55</option>
                  <option value={60}>60</option>
                  <option value={90}>90</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-primary text-white p-2.5 rounded-xl hover:bg-orange-500 transition disabled:opacity-50 shrink-0"
                aria-label="Agregar franja"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={() => setBulkRange({ start: selectedDate, end: addDays(selectedDate, 6) })}
            className="w-full mb-5 text-xs font-bold text-primary hover:text-orange-600 transition text-left"
          >
            + Crear varias franjas en un rango de fechas
          </button>

          <div className="space-y-2">
            {daySlots.length === 0 && !loading && (
              <p className="text-sm text-gray-400 text-center py-6">No hay franjas para este día.</p>
            )}
            {daySlots.map((slot) => {
              const isGroup = slot.type === 'group'
              const isFull = slot.status === 'full'
              const activeStudents = (slot.students || []).filter((s) => s.status !== 'cancelled')
              const category = reservedCategory(slot)
              const categoryBadge =
                category === 'trial'
                  ? { label: 'Prueba', className: 'bg-violet-100 text-violet-700' }
                  : category === 'package'
                    ? { label: 'Paquete', className: 'bg-emerald-100 text-emerald-700' }
                    : category === 'single'
                      ? { label: 'Suelta', className: 'bg-orange-100 text-primary' }
                      : null
              return (
                <div
                  key={slot._id}
                  onClick={() => setDetailSlot(slot)}
                  className={`p-3 rounded-xl border cursor-pointer transition hover:border-primary/50 ${
                    isFull ? 'bg-orange-50 border-primary/20' : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <Clock size={16} className={isFull ? 'text-primary' : 'text-gray-400'} />
                      <span className="font-bold text-secondary">{slot.time}</span>
                      <span className="text-gray-400">· {slot.durationMin}min</span>
                      <span
                        className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                          isGroup ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {isGroup ? <Users size={11} /> : <User size={11} />}
                        {isGroup ? 'Grupal' : 'Individual'}
                      </span>
                      <span className={`text-xs font-bold ${isFull ? 'text-primary' : 'text-green-600'}`}>
                        {slot.bookedCount || 0}/{slot.capacity} {isFull ? 'completo' : 'reservado(s)'}
                      </span>
                      {categoryBadge && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${categoryBadge.className}`}>
                          {categoryBadge.label}
                        </span>
                      )}
                    </div>
                    {(slot.bookedCount || 0) === 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSlot(slot._id)
                        }}
                        disabled={deletingId === slot._id}
                        className="text-gray-400 hover:text-red-600 transition p-1 shrink-0"
                        aria-label="Eliminar franja"
                      >
                        {deletingId === slot._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    )}
                  </div>
                  {activeStudents.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1.5 pl-6 truncate">
                      {activeStudents.map((s) => s.userName || s.name).join(', ')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {dayBusy.length > 0 && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                🔒 Ocupado en Google Calendar
              </h4>
              <p className="text-xs text-gray-400 mb-3">Estas horas no se pueden reservar.</p>
              <div className="space-y-2">
                {dayBusy.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm p-2.5 rounded-xl bg-gray-100 border border-gray-200">
                    <Clock size={14} className="text-gray-400 shrink-0" />
                    <span className="font-bold text-secondary tabular-nums">
                      {b.startTime}–{b.endTime === '24:00' ? '00:00' : b.endTime}
                    </span>
                    <span className="text-gray-500 truncate">{b.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {detailSlot && (
        <SlotDetailModal
          slot={detailSlot}
          token={token}
          onClose={() => setDetailSlot(null)}
          onChanged={handleSlotUpdated}
          onDeleted={loadData}
        />
      )}

      {bulkRange && (
        <BulkAvailabilityModal
          startDate={bulkRange.start}
          endDate={bulkRange.end}
          token={token}
          groupCapacity={groupCapacity}
          onClose={() => setBulkRange(null)}
          onCreated={loadData}
        />
      )}

      {quickRange && (
        <QuickAvailabilityModal
          date={quickRange.date}
          startTime={quickRange.startTime}
          endTime={quickRange.endTime}
          token={token}
          groupCapacity={groupCapacity}
          onClose={() => setQuickRange(null)}
          onCreated={loadData}
        />
      )}
    </div>
  )
}
