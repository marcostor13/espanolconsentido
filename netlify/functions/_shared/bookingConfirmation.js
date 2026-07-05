import { ObjectId } from 'mongodb'
import { createCalendarEvent } from './google-calendar.js'
import { sendBookingConfirmation, sendWelcomeCredentials } from './email.js'
import { findOrCreateStudent } from './auth.js'
import { logError } from './errorLog.js'

// Debe reflejar src/lib/packages.js: ids de paquetes de varias clases que,
// al confirmarse el pago, generan una matrícula real (enrollment) en vez de
// reservar una franja puntual del calendario.
const PACKAGE_SERVICE_IDS = ['inicio', 'progreso', 'pro']

export class BookingConfirmationError extends Error {
  constructor(message, code) {
    super(message)
    this.code = code
  }
}

async function reserveAvailabilitySlot(db, slotId) {
  const availabilityCol = db.collection('availability')
  const slot = await availabilityCol.findOneAndUpdate(
    { _id: new ObjectId(slotId), status: 'open', $expr: { $lt: ['$bookedCount', '$capacity'] } },
    { $inc: { bookedCount: 1 } },
    { returnDocument: 'after' },
  )
  if (!slot) return null
  if (slot.bookedCount >= slot.capacity) {
    await availabilityCol.updateOne({ _id: slot._id }, { $set: { status: 'full' } })
  }
  return slot
}

async function createEnrollmentFromBooking(db, booking, studentUser, paymentMethod) {
  const enrollment = {
    userId: String(studentUser._id),
    studentEmail: studentUser.email,
    studentName: studentUser.name,
    serviceId: booking.serviceId,
    serviceTitle: booking.serviceTitle,
    totalClasses: booking.totalClasses || 1,
    classesUsed: 0,
    price: booking.price,
    finalPrice: booking.finalPrice,
    appliedPromo: booking.appliedPromo || null,
    trialCreditApplied: false,
    trialCreditAmount: 0,
    paymentMethod: paymentMethod || booking.paymentMethod || 'other',
    status: 'active',
    createdAt: new Date(),
    paidAt: new Date(),
  }
  const result = await db.collection('enrollments').insertOne(enrollment)
  enrollment._id = result.insertedId
  return enrollment
}

/**
 * Marca una reserva pública (bookings, sin enrollmentId) como pagada:
 * crea/vincula la cuenta del estudiante y, según el tipo de compra:
 *  - clase suelta (prueba/individual/grupal, con slotId): reserva la franja
 *    real del calendario y agenda el evento en Google Calendar.
 *  - paquete de varias clases (sin slotId): crea una matrícula (enrollment)
 *    real para que el estudiante agende sus clases desde el portal.
 * Envía los correos de confirmación (y de bienvenida si la cuenta es nueva).
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

  const isPackage = PACKAGE_SERVICE_IDS.includes(booking.serviceId)
  const update = { status: 'paid', paidAt: new Date(), userId: String(studentUser._id) }
  if (paymentMethod) update.paymentMethod = paymentMethod

  if (isPackage) {
    await createEnrollmentFromBooking(db, booking, studentUser, paymentMethod)
  } else if (booking.date && booking.time) {
    // Reserva la franja real si la tiene (todo lo creado tras este cambio la
    // trae siempre); si no (reservas creadas justo antes de este despliegue,
    // con fecha/hora fija y sin slotId), igual se agenda en Google Calendar
    // como antes, solo que sin descontar cupo de ninguna franja.
    if (booking.slotId && ObjectId.isValid(booking.slotId)) {
      const slot = await reserveAvailabilitySlot(db, booking.slotId)
      if (!slot) {
        // Alguien más tomó esa franja entre la compra y la confirmación del
        // pago. El dinero ya se cobró, así que no revertimos la reserva; se
        // marca para que el admin reprograme manualmente con el estudiante.
        update.slotConflict = true
        await logError(
          'confirmBookingPayment: slot no longer available at payment confirmation',
          new Error(`slotId ${booking.slotId} ya no está abierto (bookingId ${bookingId})`),
          { level: 'warning' },
        )
      }
    }

    const [hours, minutes] = booking.time.split(':').map(Number)
    const pad = (n) => String(n).padStart(2, '0')
    const durationMin = booking.durationMin || 60
    const startLocal = `${booking.date}T${pad(hours)}:${pad(minutes)}:00`
    const endMinutes = hours * 60 + minutes + durationMin
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
      await logError('confirmBookingPayment: create calendar event', err, { level: 'warning' })
    }
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
        isPackage,
        totalClasses: booking.totalClasses || 1,
      },
    })
  } catch (err) {
    console.error('confirmBookingPayment: failed to send booking confirmation email', err)
    await logError('confirmBookingPayment: send booking confirmation email', err, { level: 'warning' })
  }

  if (isNewAccount) {
    try {
      await sendWelcomeCredentials({ toName: booking.name, toEmail: booking.email, tempPassword })
    } catch (err) {
      console.error('confirmBookingPayment: failed to send welcome credentials email', err)
      await logError('confirmBookingPayment: send welcome credentials email', err, { level: 'warning' })
    }
  }

  await collection.updateOne({ bookingId }, { $set: update })

  return { booking, studentUser }
}
