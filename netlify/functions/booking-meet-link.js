import { getDb } from './_shared/mongodb.js'
import { requireAuth, jsonResponse } from './_shared/auth.js'
import { getEventMeetLink } from './_shared/google-calendar.js'
import { logError } from './_shared/errorLog.js'

// Devuelve el enlace de Google Meet de una reserva. Si la reserva no lo tiene
// guardado (p. ej. la sala se creó de forma asíncrona y no llegó al confirmar,
// o es una reserva anterior al arreglo), lo recupera del evento del calendario
// y lo persiste. Accesible por el admin o por el dueño de la reserva.
export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const { user, error } = requireAuth(event)
  if (error) return error

  const bookingId = (event.queryStringParameters || {}).bookingId
  if (!bookingId) return jsonResponse(400, { error: 'Falta bookingId' })

  try {
    const db = await getDb()
    const bookingsCol = db.collection('bookings')
    const booking = await bookingsCol.findOne({ bookingId })
    if (!booking) return jsonResponse(404, { error: 'Reserva no encontrada' })

    if (user.role !== 'admin' && booking.userId !== user.id) {
      return jsonResponse(403, { error: 'No autorizado para esta reserva' })
    }

    let meetLink = booking.meetLink || null
    if (!meetLink && booking.calendarEventId) {
      meetLink = await getEventMeetLink(db, booking.calendarEventId)
      if (meetLink) {
        await bookingsCol.updateOne({ bookingId }, { $set: { meetLink } })
      }
    }

    return jsonResponse(200, { meetLink })
  } catch (err) {
    console.error('booking-meet-link error:', err)
    await logError('booking-meet-link', err, { event, level: 'warning' })
    // No romper la UI si falla la consulta a Google: se devuelve sin enlace.
    return jsonResponse(200, { meetLink: null })
  }
}
