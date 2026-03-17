import { getDb } from './_shared/mongodb.js'
import { createCalendarEvent } from './_shared/google-calendar.js'

export const handler = async (event) => {
  const token = event.queryStringParameters?.token || event.headers['x-admin-token']
  const bookingId = event.queryStringParameters?.bookingId

  if (process.env.ADMIN_TOKEN && token !== process.env.ADMIN_TOKEN) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'No autorizado' }),
    }
  }

  if (!bookingId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falta bookingId' }),
    }
  }

  try {
    const db = await getDb()
    const collection = db.collection('bookings')
    const booking = await collection.findOne({ bookingId })

    if (!booking) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Reserva no encontrada' }),
      }
    }

    if (booking.status !== 'pending') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `La reserva ya está ${booking.status}` }),
      }
    }

    const [year, month, day] = booking.date.split('-').map(Number)
    const [hours, minutes] = booking.time.split(':').map(Number)
    const startDate = new Date(year, month - 1, day, hours, minutes)
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)

    const summary = `${booking.serviceTitle} - ${booking.name}`
    const descParts = [
      `Email: ${booking.email}`,
      ...Object.entries(booking.questions || {})
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`),
    ]
    const description = descParts.join('\n')

    await createCalendarEvent({
      summary,
      description,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      attendeeEmail: booking.email,
    })

    await collection.updateOne(
      { bookingId },
      { $set: { status: 'paid', paidAt: new Date() } }
    )

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Pago confirmado y evento creado en Google Calendar',
      }),
    }
  } catch (err) {
    console.error('confirm-payment error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Error al confirmar el pago' }),
    }
  }
}
