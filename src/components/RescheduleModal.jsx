import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { X, AlertCircle, Loader2, Clock, User, Users } from 'lucide-react'
import Calendar from './Calendar'
import { toDateKey } from '../lib/date'
import { apiFetch } from '../lib/api'
import { hasEnoughNotice } from '../lib/notice'

function monthRange(month) {
  const from = new Date(month.getFullYear(), month.getMonth(), 1)
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  return { from: toDateKey(from), to: toDateKey(to) }
}

export default function RescheduleModal({ booking, token, onClose, onRescheduled }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [slots, setSlots] = useState([])
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const notice = hasEnoughNotice(booking)

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
    loadSlots()
  }, [loadSlots])

  const slotsByDate = useMemo(() => {
    const map = {}
    for (const s of slots) {
      if (s.status !== 'open' || s._id === booking.slotId) continue
      if (!map[s.date]) map[s.date] = []
      map[s.date].push(s)
    }
    return map
  }, [slots, booking.slotId])

  const selectedKey = toDateKey(selectedDate)
  const daySlots = [...(slotsByDate[selectedKey] || [])].sort((a, b) => a.time.localeCompare(b.time))

  const dayContent = (date) => {
    const has = slotsByDate[toDateKey(date)]?.length > 0
    return has ? <span className="w-1.5 h-1.5 rounded-full bg-green-400 mx-auto block" /> : null
  }

  const handleConfirm = async () => {
    if (!selectedSlotId) return
    setSubmitting(true)
    setError(null)
    try {
      await apiFetch('bookings', { method: 'PATCH', token, body: { id: booking._id, status: 'cancelled' } })
      await apiFetch('bookings', {
        method: 'POST',
        token,
        body: { enrollmentId: booking.enrollmentId, slotId: selectedSlotId },
      })
      onRescheduled?.()
    } catch (err) {
      setError(
        `${err.message}. Tu clase original ya fue liberada; revisa "Mis cursos" para ver tus créditos disponibles.`,
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/60 backdrop-blur-sm p-4 font-grotesk overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-8">
        <div className="p-6 pb-0 flex items-start justify-between">
          <div>
            <h2 className="font-syne font-bold text-xl text-secondary">Reprogramar clase</h2>
            <p className="text-sm text-gray-500 mt-1">
              Actual: {booking.date} · {booking.time} — {booking.serviceTitle}
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
          <div
            className={`mb-5 p-3 rounded-xl text-sm flex items-start gap-2 border ${
              notice ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            {notice
              ? 'Estás a tiempo: tu crédito se conservará para la nueva fecha.'
              : 'Faltan menos de 48 horas para tu clase actual: se perderá ese crédito y se usará uno nuevo para la fecha que elijas.'}
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
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

            <div>
              <h3 className="font-syne font-bold text-base text-secondary mb-1">
                {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <p className="text-sm text-gray-400 mb-4">{loading ? 'Cargando...' : `${daySlots.length} horario(s)`}</p>

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
                disabled={!selectedSlotId || submitting}
                className="w-full bg-primary text-white py-3.5 rounded-xl font-bold shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={18} className="animate-spin" />}
                Confirmar reprogramación
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
