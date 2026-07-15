import { getDb } from './_shared/mongodb.js'
import { requireAuth, jsonResponse } from './_shared/auth.js'
import { getBusyEvents } from './_shared/google-calendar.js'
import { classDateTimeMs, classPartsFromMs, nextDateKey } from './_shared/time.js'
import { logError } from './_shared/errorLog.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Parte un evento (instantes absolutos startMs/endMs) en tramos por día,
// expresados en fecha/hora de la zona de las clases, para poder pintarlos en
// la grilla del calendario de administración (que trabaja con HH:mm por día).
function toSegments(ev) {
  const start = classPartsFromMs(ev.startMs)
  const end = classPartsFromMs(ev.endMs)

  if (start.date === end.date) {
    return [{ date: start.date, startTime: start.time, endTime: end.time, title: ev.title }]
  }

  const segments = [{ date: start.date, startTime: start.time, endTime: '24:00', title: ev.title }]
  let day = nextDateKey(start.date)
  let guard = 0
  while (day !== end.date && guard < 90) {
    segments.push({ date: day, startTime: '00:00', endTime: '24:00', title: ev.title })
    day = nextDateKey(day)
    guard++
  }
  // El último día solo cuenta si el evento no termina justo a medianoche.
  if (end.time !== '00:00') {
    segments.push({ date: end.date, startTime: '00:00', endTime: end.time, title: ev.title })
  }
  return segments
}

// Devuelve las horas ocupadas en el calendario de Google de la profesora en un
// rango de fechas, para mostrarlas en el calendario de administración y saber
// dónde no se puede reservar. Solo admin.
export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const { error } = requireAuth(event, ['admin'])
  if (error) return error

  const params = event.queryStringParameters || {}
  const from = params.from
  const to = params.to
  if (!DATE_RE.test(from || '') || !DATE_RE.test(to || '')) {
    return jsonResponse(400, { error: 'Faltan parámetros from/to (YYYY-MM-DD) válidos' })
  }

  try {
    const db = await getDb()
    const { connected, events } = await getBusyEvents(db, {
      timeMin: new Date(classDateTimeMs(from, '00:00')).toISOString(),
      timeMax: new Date(classDateTimeMs(nextDateKey(to), '00:00')).toISOString(),
    })

    const busy = events.flatMap(toSegments).filter((s) => s.date >= from && s.date <= to)
    return jsonResponse(200, { connected, busy })
  } catch (err) {
    console.error('calendar-busy error:', err)
    await logError('calendar-busy', err, { event, level: 'warning' })
    // No romper el calendario del admin si Google falla: se devuelve vacío.
    return jsonResponse(200, { connected: false, busy: [], error: 'No se pudo leer el calendario de Google' })
  }
}
