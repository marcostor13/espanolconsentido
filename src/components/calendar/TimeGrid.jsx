import React, { useEffect, useMemo, useRef, useState } from 'react'
import { User, Users } from 'lucide-react'
import { toDateKey, timeToMinutes, minutesToTime, isSameDay } from '../../lib/date'

const START_HOUR = 6
const END_HOUR = 22
const PX_PER_MIN = 1.2
const HOUR_HEIGHT = 60 * PX_PER_MIN
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT

function layoutDaySlots(slots) {
  const events = [...slots]
    .map((slot) => ({
      slot,
      start: timeToMinutes(slot.time),
      end: timeToMinutes(slot.time) + (slot.durationMin || 60),
    }))
    .sort((a, b) => a.start - b.start)

  const clusters = []
  let current = []
  let currentEnd = -Infinity
  for (const ev of events) {
    if (current.length && ev.start < currentEnd) {
      current.push(ev)
      currentEnd = Math.max(currentEnd, ev.end)
    } else {
      if (current.length) clusters.push(current)
      current = [ev]
      currentEnd = ev.end
    }
  }
  if (current.length) clusters.push(current)

  const laidOut = []
  for (const cluster of clusters) {
    const columnEnds = []
    for (const ev of cluster) {
      let col = columnEnds.findIndex((end) => end <= ev.start)
      if (col === -1) {
        col = columnEnds.length
        columnEnds.push(ev.end)
      } else {
        columnEnds[col] = ev.end
      }
      ev.col = col
    }
    const colCount = columnEnds.length
    for (const ev of cluster) laidOut.push({ ...ev, colCount })
  }
  return laidOut
}

function SlotBlock({ layoutEvent, onSlotClick, variant, isSelected }) {
  const { slot, start, end, col, colCount } = layoutEvent
  const isGroup = slot.type === 'group'
  const students = (slot.students || []).filter((s) => s.status !== 'cancelled')
  const isFull = slot.status === 'full'
  const hasBookings = (slot.bookedCount || 0) > 0
  const remaining = Math.max(0, (slot.capacity || 0) - (slot.bookedCount || 0))
  const durationMin = end - start

  const top = (start - START_HOUR * 60) * PX_PER_MIN
  const height = Math.max(durationMin * PX_PER_MIN, 20)
  const widthPct = 100 / colCount
  const leftPct = col * widthPct

  // Modo "admin": el color indica si ya tiene reservas. Modo "student" (elegir
  // horario para reservar): todo lo que llega aquí ya está disponible, así
  // que el color solo resalta si el estudiante lo tiene seleccionado.
  const palette =
    variant === 'student'
      ? isSelected
        ? isGroup
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'bg-primary border-primary text-white'
        : isGroup
          ? 'bg-blue-50 border-blue-300 text-blue-700 hover:border-blue-400'
          : 'bg-orange-50 border-primary/40 text-primary hover:border-primary'
      : isGroup
        ? hasBookings
          ? 'bg-blue-500 border-blue-600 text-white'
          : 'bg-blue-50 border-blue-300 text-blue-700 border-dashed'
        : hasBookings
          ? 'bg-primary border-primary text-white'
          : 'bg-orange-50 border-primary/40 text-primary border-dashed'

  const detailLine =
    students.length > 0
      ? students.map((s) => s.userName || s.name).join(', ')
      : isGroup
        ? variant === 'student'
          ? `${remaining} lugar(es)`
          : hasBookings
            ? `${slot.bookedCount}/${slot.capacity} reservado(s)`
            : 'Sin reservas aún'
        : variant === 'student'
          ? 'Individual'
          : hasBookings
            ? 'Reservada'
            : 'Disponible'

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onSlotClick(slot)
      }}
      className={`absolute rounded-lg border px-1.5 py-0.5 text-left overflow-hidden shadow-sm hover:z-20 hover:shadow-md transition-shadow ${palette}`}
      style={{
        top: `${top}px`,
        height: `${height - 2}px`,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
      }}
      title={`${slot.time} · ${isGroup ? 'Grupal' : 'Individual'}${
        variant === 'student' ? ` · ${detailLine}` : ` · ${slot.bookedCount || 0}/${slot.capacity}`
      }${students.length ? ' · ' + students.map((s) => s.userName || s.name).join(', ') : ''}`}
    >
      <div className="flex items-center gap-1 text-[10px] font-bold leading-tight whitespace-nowrap">
        {isGroup ? <Users size={10} className="shrink-0" /> : <User size={10} className="shrink-0" />}
        <span>{slot.time}</span>
        {isGroup && variant !== 'student' && <span>· {slot.bookedCount || 0}/{slot.capacity}</span>}
        {isFull && !isGroup && variant !== 'student' && <span>· Completo</span>}
      </div>
      {height > 28 && <div className="text-[10px] leading-tight truncate opacity-95">{detailLine}</div>}
    </button>
  )
}

function DayColumn({ date, slots, onCellClick, onSlotClick, isToday, nowMinutes, variant, selectedSlotId }) {
  const colRef = useRef(null)
  const laidOut = useMemo(() => layoutDaySlots(slots), [slots])

  const handleClick = (e) => {
    if (!onCellClick) return
    const rect = colRef.current.getBoundingClientRect()
    const offsetY = e.clientY - rect.top
    let minutes = START_HOUR * 60 + offsetY / PX_PER_MIN
    minutes = Math.round(minutes / 30) * 30
    minutes = Math.min(Math.max(minutes, START_HOUR * 60), END_HOUR * 60 - 30)
    onCellClick(date, minutesToTime(minutes))
  }

  return (
    <div
      ref={colRef}
      onClick={handleClick}
      className={`relative flex-1 min-w-0 border-l border-gray-100 ${onCellClick ? 'cursor-pointer' : ''}`}
      style={{ height: `${TOTAL_HEIGHT}px` }}
    >
      {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
        <div key={i} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: `${i * HOUR_HEIGHT}px` }} />
      ))}
      {isToday && nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60 && (
        <div
          className="absolute left-0 right-0 border-t-2 border-red-400 z-10 pointer-events-none"
          style={{ top: `${(nowMinutes - START_HOUR * 60) * PX_PER_MIN}px` }}
        >
          <span className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-400" />
        </div>
      )}
      {laidOut.map((ev) => (
        <SlotBlock
          key={ev.slot._id}
          layoutEvent={ev}
          onSlotClick={onSlotClick}
          variant={variant}
          isSelected={ev.slot._id === selectedSlotId}
        />
      ))}
    </div>
  )
}

export default function TimeGrid({
  days,
  slotsByDate,
  selectedDate,
  onSelectDay,
  onCellClick,
  onSlotClick,
  variant = 'admin',
  selectedSlotId = null,
}) {
  const [nowMinutes, setNowMinutes] = useState(() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  })

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date()
      setNowMinutes(now.getHours() * 60 + now.getMinutes())
    }, 60000)
    return () => clearInterval(id)
  }, [])

  const todayKey = toDateKey(new Date())

  return (
    <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-4 px-6 pt-5 pb-3 border-b border-gray-100 text-xs font-bold text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary" /> Individual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Grupal
        </span>
        {variant === 'student' ? (
          <span className="text-gray-400 font-normal normal-case">Toca un horario para seleccionarlo</span>
        ) : (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-gray-300" /> Disponible sin reservas
          </span>
        )}
      </div>

      <div className="flex">
        <div className="w-14 shrink-0" />
        {days.map((date) => {
          const key = toDateKey(date)
          const isSelected = isSameDay(date, selectedDate)
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(date)}
              className={`flex-1 min-w-0 flex flex-col items-center py-2.5 border-l border-gray-100 transition ${
                isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-[11px] font-bold uppercase text-gray-400">
                {date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}
              </span>
              <span
                className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold mt-0.5 ${
                  key === todayKey ? 'bg-primary text-white' : 'text-secondary'
                }`}
              >
                {date.getDate()}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex overflow-y-auto" style={{ maxHeight: '640px' }}>
        <div className="w-14 shrink-0 relative" style={{ height: `${TOTAL_HEIGHT}px` }}>
          {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
            <div
              key={i}
              className="absolute right-2 -translate-y-1/2 text-[11px] text-gray-400 font-bold"
              style={{ top: `${i * HOUR_HEIGHT}px` }}
            >
              {String(START_HOUR + i).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        {days.map((date) => {
          const key = toDateKey(date)
          return (
            <DayColumn
              key={key}
              date={date}
              slots={slotsByDate[key] || []}
              onCellClick={onCellClick}
              onSlotClick={onSlotClick}
              isToday={key === todayKey}
              nowMinutes={nowMinutes}
              variant={variant}
              selectedSlotId={selectedSlotId}
            />
          )
        })}
      </div>
    </div>
  )
}
