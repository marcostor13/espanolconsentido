import { ObjectId } from 'mongodb'
import { getDb } from './_shared/mongodb.js'
import { requireAuth, jsonResponse } from './_shared/auth.js'
import { createCalendarEvent } from './_shared/google-calendar.js'
import { sendBookingConfirmation } from './_shared/email.js'

function generateBookingId() {
  return 'b_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 11)
}

// Política de cancelación/reprogramación: el crédito solo se reembolsa si se
// avisa con al menos 48h de anticipación a la hora de la clase reservada.
const CANCELLATION_NOTICE_HOURS = 48

function hasEnoughNotice(booking) {
  const classDateTime = new Date(`${booking.date}T${booking.time}:00`)
  const hoursUntilClass = (classDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
  return hoursUntilClass >= CANCELLATION_NOTICE_HOURS
}

function computeEventTimes(date, time, durationMin) {
  const [hours, minutes] = time.split(':').map(Number)
  const pad = (n) => String(n).padStart(2, '0')
  const startLocal = `${date}T${pad(hours)}:${pad(minutes)}:00`
  const endMinutes = hours * 60 + minutes + durationMin
  const endHour = Math.floor(endMinutes / 60)
  const endMin = endMinutes % 60
  const endLocal = `${date}T${pad(endHour)}:${pad(endMin)}:00`
  return { startLocal, endLocal }
}

async function listBookings(event, db) {
  const { user, error } = requireAuth(event)
  if (error) return error

  const params = event.queryStringParameters || {}
  const bookingsCol = db.collection('bookings')

  if (user.role !== 'admin') {
    const bookings = await bookingsCol.find({ userId: user.id }).sort({ date: -1, time: -1 }).toArray()
    return jsonResponse(200, { bookings })
  }

  const filter = {}
  if (params.status) filter.status = params.status
  if (params.from || params.to) {
    filter.date = {}
    if (params.from) filter.date.$gte = params.from
    if (params.to) filter.date.$lte = params.to
  }
  if (params.search?.trim()) {
    const re = new RegExp(params.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ userName: re }, { userEmail: re }, { name: re }, { email: re }, { serviceTitle: re }]
  }

  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(params.pageSize, 10) || 10))

  const total = await bookingsCol.countDocuments(filter)
  const bookings = await bookingsCol
    .find(filter)
    .sort({ date: -1, time: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray()

  return jsonResponse(200, { bookings, total, page, pageSize })
}

async function createBooking(event, db) {
  const { user, error } = requireAuth(event, ['student'])
  if (error) return error

  const body = JSON.parse(event.body || '{}')
  const { enrollmentId, slotId } = body
  if (!enrollmentId || !slotId || !ObjectId.isValid(enrollmentId) || !ObjectId.isValid(slotId)) {
    return jsonResponse(400, { error: 'Faltan enrollmentId o slotId válidos' })
  }

  const availabilityCol = db.collection('availability')
  const enrollmentsCol = db.collection('enrollments')
  const bookingsCol = db.collection('bookings')

  const alreadyBooked = await bookingsCol.findOne({
    slotId,
    userId: user.id,
    status: { $ne: 'cancelled' },
  })
  if (alreadyBooked) {
    return jsonResponse(409, { error: 'Ya tienes una reserva en esa franja' })
  }

  const slot = await availabilityCol.findOneAndUpdate(
    { _id: new ObjectId(slotId), status: 'open', $expr: { $lt: ['$bookedCount', '$capacity'] } },
    { $inc: { bookedCount: 1 } },
    { returnDocument: 'after' },
  )
  if (!slot) return jsonResponse(409, { error: 'Esa franja ya no está disponible' })

  if (slot.bookedCount >= slot.capacity) {
    await availabilityCol.updateOne({ _id: slot._id }, { $set: { status: 'full' } })
  }

  const enrollment = await enrollmentsCol.findOneAndUpdate(
    {
      _id: new ObjectId(enrollmentId),
      userId: user.id,
      status: 'active',
      $expr: { $lt: ['$classesUsed', '$totalClasses'] },
    },
    { $inc: { classesUsed: 1 } },
    { returnDocument: 'after' },
  )

  if (!enrollment) {
    await availabilityCol.updateOne({ _id: slot._id }, { $inc: { bookedCount: -1 }, $set: { status: 'open' } })
    return jsonResponse(409, { error: 'No tienes créditos disponibles en ese curso' })
  }

  if (enrollment.classesUsed >= enrollment.totalClasses) {
    await enrollmentsCol.updateOne({ _id: enrollment._id }, { $set: { status: 'finished' } })
  }

  const bookingId = generateBookingId()
  const booking = {
    bookingId,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    enrollmentId: String(enrollment._id),
    slotId: String(slot._id),
    serviceTitle: enrollment.serviceTitle,
    classType: slot.type,
    date: slot.date,
    time: slot.time,
    durationMin: slot.durationMin,
    status: 'paid',
    createdAt: new Date(),
  }
  await bookingsCol.insertOne(booking)

  try {
    const { startLocal, endLocal } = computeEventTimes(slot.date, slot.time, slot.durationMin)
    await createCalendarEvent({
      summary: `${enrollment.serviceTitle} - ${user.name}`,
      description: `Email: ${user.email}`,
      start: startLocal,
      end: endLocal,
    })
  } catch (err) {
    console.error('bookings: failed to create calendar event', err)
  }

  try {
    await sendBookingConfirmation({
      toName: user.name,
      toEmail: user.email,
      bookingDetails: {
        date: slot.date,
        time: slot.time,
        serviceTitle: enrollment.serviceTitle,
        finalPrice: enrollment.finalPrice,
        name: user.name,
        email: user.email,
      },
    })
  } catch (err) {
    console.error('bookings: failed to send confirmation email', err)
  }

  return jsonResponse(201, { booking })
}

async function updateBooking(event, db) {
  const { user, error } = requireAuth(event)
  if (error) return error

  const body = JSON.parse(event.body || '{}')
  const { id, status } = body
  if (!id || !ObjectId.isValid(id) || !['paid', 'completed', 'cancelled'].includes(status)) {
    return jsonResponse(400, { error: 'Datos inválidos: se requiere id y status (paid|completed|cancelled)' })
  }

  const bookingsCol = db.collection('bookings')
  const booking = await bookingsCol.findOne({ _id: new ObjectId(id) })
  if (!booking) return jsonResponse(404, { error: 'Reserva no encontrada' })

  const isAdmin = user.role === 'admin'

  if (!isAdmin) {
    if (booking.userId !== user.id) {
      return jsonResponse(403, { error: 'No autorizado para esta reserva' })
    }
    if (status !== 'cancelled') {
      return jsonResponse(403, { error: 'Solo puedes cancelar tu propia reserva' })
    }
    if (booking.status !== 'paid') {
      return jsonResponse(409, { error: 'Esta reserva ya no se puede cancelar' })
    }
  }

  let creditRefunded = false

  if (status === 'cancelled' && booking.status !== 'cancelled') {
    // El admin siempre puede reembolsar (p. ej. si canceló la profesora); el
    // estudiante solo conserva el crédito si avisó con 48h de anticipación.
    creditRefunded = isAdmin || hasEnoughNotice(booking)

    if (booking.slotId && ObjectId.isValid(booking.slotId)) {
      await db
        .collection('availability')
        .updateOne({ _id: new ObjectId(booking.slotId) }, { $inc: { bookedCount: -1 }, $set: { status: 'open' } })
    }
    if (creditRefunded && booking.enrollmentId && ObjectId.isValid(booking.enrollmentId)) {
      await db
        .collection('enrollments')
        .updateOne({ _id: new ObjectId(booking.enrollmentId) }, { $inc: { classesUsed: -1 }, $set: { status: 'active' } })
    }
  }

  const update = { status, updatedAt: new Date() }
  if (status === 'cancelled') update.creditRefunded = creditRefunded

  await bookingsCol.updateOne({ _id: new ObjectId(id) }, { $set: update })
  return jsonResponse(200, { success: true, creditRefunded })
}

export const handler = async (event) => {
  try {
    const db = await getDb()
    switch (event.httpMethod) {
      case 'GET':
        return await listBookings(event, db)
      case 'POST':
        return await createBooking(event, db)
      case 'PATCH':
        return await updateBooking(event, db)
      default:
        return jsonResponse(405, { error: 'Method not allowed' })
    }
  } catch (err) {
    console.error('bookings error:', err)
    return jsonResponse(500, { error: 'Error al procesar la reserva' })
  }
}
