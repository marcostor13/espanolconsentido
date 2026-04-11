import { getDb } from './_shared/mongodb.js'
import { createCalendarEvent } from './_shared/google-calendar.js'
import { sendBookingConfirmation } from './_shared/email.js'

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

    // Format as local time strings for Google Calendar (with timeZone field)
    const pad = (n) => String(n).padStart(2, '0')
    const startLocal = `${booking.date}T${pad(hours)}:${pad(minutes)}:00`
    const endMinutes = hours * 60 + minutes + 60
    const endHour = Math.floor(endMinutes / 60)
    const endMin = endMinutes % 60
    const endLocal = `${booking.date}T${pad(endHour)}:${pad(endMin)}:00`

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
      start: startLocal,
      end: endLocal,
    })

    // Send email notifications
    await sendBookingConfirmation({
      toName: booking.name,
      toEmail: booking.email,
      bookingDetails: {
        date: booking.date,
        time: booking.time,
        serviceTitle: booking.serviceTitle,
        finalPrice: booking.finalPrice,
        name: booking.name,
        email: booking.email,
      },
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
