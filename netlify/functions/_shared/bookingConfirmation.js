import { createCalendarEvent } from './google-calendar.js'
import { sendBookingConfirmation, sendWelcomeCredentials } from './email.js'
import { findOrCreateStudent } from './auth.js'

export class BookingConfirmationError extends Error {
  constructor(message, code) {
    super(message)
    this.code = code
  }
}

/**
 * Marca una reserva pública (bookings, sin enrollmentId) como pagada:
 * crea/vincula la cuenta del estudiante, agenda el evento en Google Calendar,
 * y envía los correos de confirmación (y de bienvenida si la cuenta es nueva).
 * Usado por la confirmación manual del admin (confirm-payment.js), el
 * retorno de PayPal (capture-paypal-order.js) y el webhook de PayPal.
 */
export async function confirmBookingPayment(db, bookingId, { paymentMethod } = {}) {
  const collection = db.collection('bookings')
  const booking = await collection.findOne({ bookingId })

  if (!booking) {
    throw new BookingConfirmationError('Reserva no encontrada', 'NOT_FOUND')
  }
  if (booking.status !== 'pending') {
    throw new BookingConfirmationError(`La reserva ya está ${booking.status}`, 'ALREADY_PROCESSED')
  }

  const { user: studentUser, isNew: isNewAccount, tempPassword } = await findOrCreateStudent(db, {
    email: booking.email,
    name: booking.name,
  })

  const [hours, minutes] = booking.time.split(':').map(Number)
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

  try {
    await createCalendarEvent({ summary, description, start: startLocal, end: endLocal })
  } catch (err) {
    console.error('confirmBookingPayment: failed to create calendar event', err)
  }

  try {
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
  } catch (err) {
    console.error('confirmBookingPayment: failed to send booking confirmation email', err)
  }

  if (isNewAccount) {
    try {
      await sendWelcomeCredentials({ toName: booking.name, toEmail: booking.email, tempPassword })
    } catch (err) {
      console.error('confirmBookingPayment: failed to send welcome credentials email', err)
    }
  }

  const update = { status: 'paid', paidAt: new Date(), userId: String(studentUser._id) }
  if (paymentMethod) update.paymentMethod = paymentMethod

  await collection.updateOne({ bookingId }, { $set: update })

  return { booking, studentUser }
}
