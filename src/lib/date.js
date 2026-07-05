function pad(n) {
  return String(n).padStart(2, '0')
}

export function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1)
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function isSameDay(a, b) {
  return a && b && toDateKey(a) === toDateKey(b)
}

// Semana empieza en lunes
export function startOfWeek(date) {
  const offset = (date.getDay() + 6) % 7
  return addDays(new Date(date.getFullYear(), date.getMonth(), date.getDate()), -offset)
}

export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${pad(h)}:${pad(m)}`
}

export function addMinutesToTime(time, minutes) {
  return minutesToTime(timeToMinutes(time) + minutes)
}

export function formatDayHeader(date) {
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
}

export function formatWeekRangeLabel(weekStart) {
  const weekEnd = addDays(weekStart, 6)
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth()
  const startLabel = weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: sameMonth ? undefined : 'short' })
  const endLabel = weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startLabel} – ${endLabel}`
}

export function formatDayLabel(date) {
  const label = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}
