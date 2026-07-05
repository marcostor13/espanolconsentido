import React, { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toDateKey, addMonths } from '../lib/date'

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function buildMonthGrid(month) {
  const year = month.getFullYear()
  const m = month.getMonth()
  const firstDay = new Date(year, m, 1)
  const startOffset = (firstDay.getDay() + 6) % 7 // semana empieza en lunes
  const daysInMonth = new Date(year, m + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, m, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

const HIGHLIGHT_CLASSES = {
  individual: 'text-secondary bg-orange-50 hover:bg-orange-100',
  group: 'text-secondary bg-blue-50 hover:bg-blue-100',
  both: 'text-secondary bg-gradient-to-br from-orange-50 to-blue-50 hover:from-orange-100 hover:to-blue-100',
  reserved: 'text-secondary bg-green-50 hover:bg-green-100',
}

export default function Calendar({
  month,
  onMonthChange,
  selectedDate,
  onSelectDate,
  onSelectRange,
  dayContent,
  minDate,
  hideNav,
  dayHighlight,
}) {
  const weeks = useMemo(() => buildMonthGrid(month), [month])
  const todayKey = toDateKey(new Date())
  const minKey = minDate ? toDateKey(minDate) : null

  const [dragAnchor, setDragAnchor] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const isDragging = Boolean(dragAnchor)

  useEffect(() => {
    if (!isDragging) return undefined
    const finish = () => {
      const anchor = dragAnchor
      const over = dragOver || dragAnchor
      setDragAnchor(null)
      setDragOver(null)
      if (!anchor) return
      const anchorKey = toDateKey(anchor)
      const overKey = toDateKey(over)
      if (onSelectRange && anchorKey !== overKey) {
        const [start, end] = anchor <= over ? [anchor, over] : [over, anchor]
        onSelectRange(start, end)
      } else {
        onSelectDate(anchor)
      }
    }
    window.addEventListener('mouseup', finish)
    return () => window.removeEventListener('mouseup', finish)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, dragAnchor, dragOver])

  const dragRange = useMemo(() => {
    if (!dragAnchor || !dragOver) return null
    const [start, end] = dragAnchor <= dragOver ? [dragAnchor, dragOver] : [dragOver, dragAnchor]
    return { startKey: toDateKey(start), endKey: toDateKey(end) }
  }, [dragAnchor, dragOver])

  return (
    <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 select-none">
      {!hideNav && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-syne font-bold text-xl text-secondary capitalize">
            {month.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onMonthChange(addMonths(month, -1))}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => onMonthChange(addMonths(month, 1))}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {onSelectRange && (
        <p className="text-xs text-gray-400 mb-3 -mt-3">Consejo: arrastra sobre varios días para crear franjas en lote.</p>
      )}

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-bold uppercase text-gray-400 py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((date, idx) => {
          if (!date) return <div key={idx} />
          const key = toDateKey(date)
          const isSelected = selectedDate && toDateKey(selectedDate) === key
          const isToday = key === todayKey
          const isDisabled = minKey ? key < minKey : false
          const isInDragRange = dragRange && key >= dragRange.startKey && key <= dragRange.endKey
          const highlight = !isDisabled && dayHighlight ? dayHighlight(date) : null

          return (
            <button
              key={idx}
              type="button"
              onMouseDown={(e) => {
                if (isDisabled) return
                e.preventDefault()
                setDragAnchor(date)
                setDragOver(date)
              }}
              onMouseEnter={() => {
                if (isDragging && !isDisabled) setDragOver(date)
              }}
              disabled={isDisabled}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 text-sm font-bold transition-all ${
                isSelected || isInDragRange
                  ? 'bg-primary text-white shadow-soft'
                  : isDisabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : highlight
                      ? HIGHLIGHT_CLASSES[highlight]
                      : 'text-secondary hover:bg-orange-50'
              } ${isToday && !isSelected && !isInDragRange ? 'ring-2 ring-primary/40' : ''}`}
            >
              <span>{date.getDate()}</span>
              {dayContent && <span className="h-1.5">{dayContent(date, Boolean(isSelected || isInDragRange))}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
