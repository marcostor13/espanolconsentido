import React, { useMemo, useState } from 'react'
import { X, AlertCircle, CheckCircle, Loader2, Plus, Trash2, User, Users } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import { addDays, toDateKey } from '../../lib/date'

const WEEKDAYS = [
  { key: 0, label: 'Lun' },
  { key: 1, label: 'Mar' },
  { key: 2, label: 'Mié' },
  { key: 3, label: 'Jue' },
  { key: 4, label: 'Vie' },
  { key: 5, label: 'Sáb' },
  { key: 6, label: 'Dom' },
]

function rangeDates(start, end) {
  const dates = []
  let cur = new Date(start)
  while (cur <= end) {
    dates.push(new Date(cur))
    cur = addDays(cur, 1)
  }
  return dates
}

let nextRowId = 1

export default function BulkAvailabilityModal({ startDate, endDate, token, groupCapacity, onClose, onCreated }) {
  const allDates = useMemo(() => rangeDates(startDate, endDate), [startDate, endDate])
  const weekdaysPresent = useMemo(() => new Set(allDates.map((d) => (d.getDay() + 6) % 7)), [allDates])

  const [activeWeekdays, setActiveWeekdays] = useState(() => new Set(weekdaysPresent))
  const [rows, setRows] = useState(() => [{ id: nextRowId++, time: '09:00', durationMin: 60, type: 'individual' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const matchingDates = useMemo(
    () => allDates.filter((d) => activeWeekdays.has((d.getDay() + 6) % 7)),
    [allDates, activeWeekdays],
  )
  const totalSlots = matchingDates.length * rows.length

  const toggleWeekday = (key) => {
    setActiveWeekdays((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const updateRow = (id, patch) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const addRow = () => {
    setRows((prev) => [...prev, { id: nextRowId++, time: '10:00', durationMin: 60, type: 'individual' }])
  }

  const removeRow = (id) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))
  }

  const handleSubmit = async () => {
    if (totalSlots === 0) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const slots = []
      for (const date of matchingDates) {
        for (const row of rows) {
          slots.push({ date: toDateKey(date), time: row.time, durationMin: Number(row.durationMin), type: row.type })
        }
      }
      const result = await apiFetch('availability', { method: 'POST', token, body: { slots } })
      setSuccess(
        `Se crearon ${result.created} franja(s) nueva(s) de ${slots.length} intentada(s). Las repetidas ya existentes se omitieron.`,
      )
      onCreated?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const sameDay = toDateKey(startDate) === toDateKey(endDate)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/60 backdrop-blur-sm p-4 font-grotesk overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8">
        <div className="p-6 pb-0 flex items-start justify-between">
          <div>
            <h2 className="font-syne font-bold text-xl text-secondary">Crear franjas en lote</h2>
            <p className="text-sm text-gray-500 mt-1">
              {sameDay
                ? startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                : `${startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`}
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
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-start gap-2">
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {!sameDay && (
            <div className="mb-5">
              <label className="block text-xs font-bold text-secondary mb-2">Repetir solo en estos días</label>
              <div className="flex gap-1.5 flex-wrap">
                {WEEKDAYS.filter((w) => weekdaysPresent.has(w.key)).map((w) => (
                  <button
                    key={w.key}
                    type="button"
                    onClick={() => toggleWeekday(w.key)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition ${
                      activeWeekdays.has(w.key)
                        ? 'bg-primary border-primary text-white'
                        : 'bg-white border-gray-200 text-gray-400'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="block text-xs font-bold text-secondary mb-2">Horarios a crear cada día seleccionado</label>
          <div className="space-y-2 mb-3">
            {rows.map((row) => (
              <div key={row.id} className="flex items-end gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateRow(row.id, { type: 'individual' })}
                    className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold border-2 transition ${
                      row.type === 'individual' ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-secondary'
                    }`}
                  >
                    <User size={12} /> Ind.
                  </button>
                  <button
                    type="button"
                    onClick={() => updateRow(row.id, { type: 'group' })}
                    className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold border-2 transition ${
                      row.type === 'group' ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-secondary'
                    }`}
                  >
                    <Users size={12} /> Grupal
                  </button>
                </div>
                <div>
                  <input
                    type="time"
                    value={row.time}
                    onChange={(e) => updateRow(row.id, { time: e.target.value })}
                    className="p-2 bg-white border border-gray-200 rounded-lg text-sm text-secondary outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <select
                    value={row.durationMin}
                    onChange={(e) => updateRow(row.id, { durationMin: e.target.value })}
                    className="p-2 bg-white border border-gray-200 rounded-lg text-sm text-secondary outline-none focus:border-primary"
                  >
                    <option value={30}>30 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                  </select>
                </div>
                {row.type === 'group' && <span className="text-[11px] text-gray-400">Cap. {groupCapacity}</span>}
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1}
                  className="ml-auto text-gray-400 hover:text-red-600 transition p-1.5 disabled:opacity-30"
                  aria-label="Quitar horario"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-orange-600 transition mb-6"
          >
            <Plus size={14} /> Agregar otro horario
          </button>

          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl mb-5">
            <p className="text-sm text-secondary font-bold">
              Se crearán hasta {totalSlots} franja(s) en {matchingDates.length} día(s)
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || totalSlots === 0}
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
