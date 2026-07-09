import React, { useMemo, useState } from 'react'
import { X, AlertCircle, Loader2, User, Users, Clock } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import { toDateKey, timeToMinutes, minutesToTime } from '../../lib/date'

// Duraciones de clase disponibles y el paso al que se generan las franjas:
// clases de 25 min cada 30 min, clases de 50 min cada 60 min.
const DURATION_STEPS = { 25: 30, 50: 60 }

// Modal que aparece al arrastrar sobre el calendario del admin: convierte el
// rango pintado en franjas de disponibilidad consecutivas según la duración.
export default function QuickAvailabilityModal({ date, startTime, endTime, token, groupCapacity, onClose, onCreated }) {
  const [type, setType] = useState('individual')
  const [durationMin, setDurationMin] = useState(50)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const step = DURATION_STEPS[durationMin] || 60

  const times = useMemo(() => {
    const from = timeToMinutes(startTime)
    const to = timeToMinutes(endTime)
    const list = []
    for (let t = from; t + durationMin <= to; t += step) {
      list.push(minutesToTime(t))
    }
    return list
  }, [startTime, endTime, durationMin, step])

  const handleCreate = async () => {
    if (times.length === 0) return
    setSaving(true)
    setError(null)
    try {
      const slots = times.map((time) => ({ date: toDateKey(date), time, durationMin, type }))
      await apiFetch('availability', { method: 'POST', token, body: { slots } })
      onCreated?.()
      onClose()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/60 backdrop-blur-sm p-4 font-grotesk overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden my-8">
        <div className="p-6 pb-0 flex items-start justify-between">
          <div>
            <h2 className="font-syne font-bold text-xl text-secondary">Crear disponibilidad</h2>
            <p className="text-sm text-gray-500 mt-1">
              {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} · {startTime} –{' '}
              {endTime}
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
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setType('individual')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs border-2 transition ${
                type === 'individual' ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-secondary'
              }`}
            >
              <User size={14} /> Individual
            </button>
            <button
              type="button"
              onClick={() => setType('group')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs border-2 transition ${
                type === 'group' ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-secondary'
              }`}
            >
              <Users size={14} /> Grupal
            </button>
          </div>
          {type === 'group' && (
            <p className="text-xs text-gray-400 mb-4 -mt-2">Capacidad: {groupCapacity} personas</p>
          )}

          <label className="block text-xs font-bold text-secondary mb-2">Duración de cada clase</label>
          <div className="flex gap-2 mb-5">
            {Object.entries(DURATION_STEPS).map(([dur, st]) => (
              <button
                key={dur}
                type="button"
                onClick={() => setDurationMin(Number(dur))}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs border-2 transition ${
                  durationMin === Number(dur)
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white border-gray-200 text-secondary'
                }`}
              >
                {dur} min <span className="font-normal opacity-80">(cada {st} min)</span>
              </button>
            ))}
          </div>

          {times.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              El rango es muy corto para una clase de {durationMin} minutos. Arrastra un rango más amplio.
            </p>
          ) : (
            <>
              <p className="text-xs font-bold text-secondary mb-2">
                Se crearán {times.length} franja(s):
              </p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {times.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-orange-50 text-primary"
                  >
                    <Clock size={11} /> {t}
                  </span>
                ))}
              </div>
            </>
          )}

          <button
            onClick={handleCreate}
            disabled={saving || times.length === 0}
            className="w-full bg-primary text-white py-3.5 rounded-xl font-bold shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={18} className="animate-spin" />}
            Crear franjas
          </button>
        </div>
      </div>
    </div>
  )
}
