import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Loader2, Clock, AlertCircle, Users, User } from 'lucide-react'
import Calendar from '../../components/Calendar'
import { toDateKey } from '../../lib/date'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'

function monthRange(month) {
  const from = new Date(month.getFullYear(), month.getMonth(), 1)
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  return { from: toDateKey(from), to: toDateKey(to) }
}

export default function AdminCalendario() {
  const { token } = useAuth()
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [slots, setSlots] = useState([])
  const [groupCapacity, setGroupCapacity] = useState(4)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [newTime, setNewTime] = useState('09:00')
  const [newDuration, setNewDuration] = useState(60)
  const [newType, setNewType] = useState('individual')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const loadSlots = useCallback(async () => {
    setLoading(true)
    setError(null)
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

  useEffect(() => {
    apiFetch('settings', { token })
      .then((data) => setGroupCapacity(data.settings.groupClassCapacity))
      .catch(() => {})
  }, [token])

  const slotsByDate = useMemo(() => {
    const map = {}
    for (const s of slots) {
      if (!map[s.date]) map[s.date] = []
      map[s.date].push(s)
    }
    return map
  }, [slots])

  const selectedKey = toDateKey(selectedDate)
  const daySlots = [...(slotsByDate[selectedKey] || [])].sort((a, b) => a.time.localeCompare(b.time))

  const dayContent = (date) => {
    const daySlotsForDot = slotsByDate[toDateKey(date)]
    if (!daySlotsForDot?.length) return null
    const hasOpen = daySlotsForDot.some((s) => s.status === 'open')
    const hasFull = daySlotsForDot.some((s) => s.status === 'full')
    return (
      <span className="flex gap-0.5 justify-center">
        {hasOpen && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
        {hasFull && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
      </span>
    )
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
      await loadSlots()
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
      await loadSlots()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Calendario</h1>
      <p className="text-gray-500 mb-8">Gestiona tus horarios disponibles y revisa las reservas de tus estudiantes.</p>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <Calendar month={month} onMonthChange={setMonth} selectedDate={selectedDate} onSelectDate={setSelectedDate} dayContent={dayContent} />

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
                  <option value={30}>30</option>
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

          <div className="space-y-2">
            {daySlots.length === 0 && !loading && (
              <p className="text-sm text-gray-400 text-center py-6">No hay franjas para este día.</p>
            )}
            {daySlots.map((slot) => {
              const isGroup = slot.type === 'group'
              const isFull = slot.status === 'full'
              return (
                <div
                  key={slot._id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    isFull ? 'bg-orange-50 border-primary/20' : 'bg-gray-50 border-gray-100'
                  }`}
                >
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
                  </div>
                  {(slot.bookedCount || 0) === 0 && (
                    <button
                      onClick={() => handleDeleteSlot(slot._id)}
                      disabled={deletingId === slot._id}
                      className="text-gray-400 hover:text-red-600 transition p-1 shrink-0"
                      aria-label="Eliminar franja"
                    >
                      {deletingId === slot._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
