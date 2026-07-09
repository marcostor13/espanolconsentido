// Las fechas/horas de las clases se guardan como strings (YYYY-MM-DD, HH:mm)
// en la zona horaria de la profesora, pero las funciones corren en UTC.
// Este helper convierte esos strings a epoch ms de forma correcta.
const CLASS_TIMEZONE = process.env.CLASS_TIMEZONE || 'America/Lima'

function tzOffsetMs(timeZone, utcDate) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = Object.fromEntries(dtf.formatToParts(utcDate).map((p) => [p.type, p.value]))
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  )
  return asUTC - utcDate.getTime()
}

// Epoch ms del instante `date time` interpretado en la zona de las clases.
export function classDateTimeMs(date, time) {
  const guess = new Date(`${date}T${time}:00Z`)
  return guess.getTime() - tzOffsetMs(CLASS_TIMEZONE, guess)
}

export function hoursUntilClass(date, time, now = Date.now()) {
  return (classDateTimeMs(date, time) - now) / (1000 * 60 * 60)
}

export function minutesUntilClass(date, time, now = Date.now()) {
  return (classDateTimeMs(date, time) - now) / (1000 * 60)
}

// Fecha (YYYY-MM-DD) actual en la zona de las clases.
export function todayDateKey(now = new Date()) {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLASS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return dtf.format(now)
}
