import { ObjectId } from 'mongodb'
import { getDb } from './_shared/mongodb.js'
import { requireAuth, jsonResponse } from './_shared/auth.js'
import { createCalendarEvent, isSlotBlockedByCalendar } from './_shared/google-calendar.js'
import { sendBookingConfirmation } from './_shared/email.js'
import { getSettings, getAdminNotifyEmail } from './_shared/settings.js'
import { hoursUntilClass } from './_shared/time.js'
import { logError } from './_shared/errorLog.js'

function generateBookingId() {
  return 'b_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 11)
}

// Política de cancelación/reprogramación: el crédito solo se reembolsa si se
// avisa con al menos 24h de anticipación a la hora de la clase reservada.
const CANCELLATION_NOTICE_HOURS = 24

function hasEnoughNotice(booking) {
  return hoursUntilClass(booking.date, booking.time) >= CANCELLATION_NOTICE_HOURS
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
  if (params.userId) filter.userId = params.userId
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

  // Usado por la vista de calendario para traer todas las reservas de un
  // rango de fechas de una sola vez, sin el límite de paginación de la tabla.
  if (params.all === 'true') {
    const bookings = await bookingsCol.find(filter).sort({ date: 1, time: 1 }).toArray()
    return jsonResponse(200, { bookings, total: bookings.length })
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
  const { user, error } = requireAuth(event, ['student', 'admin'])
  if (error) return error

  const body = JSON.parse(event.body || '{}')
  const { enrollmentId, slotId, rescheduledFrom } = body
  if (!enrollmentId || !slotId || !ObjectId.isValid(enrollmentId) || !ObjectId.isValid(slotId)) {
    return jsonResponse(400, { error: 'Faltan enrollmentId o slotId válidos' })
  }

  const availabilityCol = db.collection('availability')
  const enrollmentsCol = db.collection('enrollments')
  const bookingsCol = db.collection('bookings')
  const isAdmin = user.role === 'admin'

  // El admin puede reservar/reprogramar en nombre de cualquier estudiante
  // (usa la matrícula para saber a quién pertenece); el estudiante solo
  // puede usar sus propias matrículas.
  const enrollmentLookup = await enrollmentsCol.findOne(
    isAdmin ? { _id: new ObjectId(enrollmentId) } : { _id: new ObjectId(enrollmentId), userId: user.id },
  )
  if (!enrollmentLookup) return jsonResponse(404, { error: 'Matrícula no encontrada' })

  const targetUserId = isAdmin ? enrollmentLookup.userId : user.id
  const targetUserEmail = isAdmin ? enrollmentLookup.studentEmail : user.email
  const targetUserName = isAdmin ? enrollmentLookup.studentName : user.name

  const alreadyBooked = await bookingsCol.findOne({
    slotId,
    userId: targetUserId,
    status: { $ne: 'cancelled' },
  })
  if (alreadyBooked) {
    return jsonResponse(409, { error: 'Ya tiene una reserva en esa franja' })
  }

  // No permitir reservar sobre una hora ocupada en el calendario de Google de
  // la profesora (evento personal o creado a mano). Se comprueba antes de
  // descontar el cupo, así no hay que revertir nada si está bloqueada.
  const slotForCalendar = await availabilityCol.findOne({ _id: new ObjectId(slotId) })
  if (slotForCalendar && (await isSlotBlockedByCalendar(db, slotForCalendar))) {
    return jsonResponse(409, { error: 'Ese horario está ocupado en el calendario. Elige otro.' })
  }

  // Anticipación mínima configurable (independiente de la que aplica a la
  // compra pública desde la web): los alumnos ya matriculados no pueden
  // reservar con sus créditos una franja que empieza demasiado pronto. El
  // admin sí puede (para arreglos de último minuto acordados directamente
  // con el estudiante).
  const settings = await getSettings(db)
  if (!isAdmin) {
    const minNotice = Number(settings.studentMinBookingNoticeHours) || 0
    const slotToCheck = await availabilityCol.findOne({ _id: new ObjectId(slotId) })
    if (slotToCheck && hoursUntilClass(slotToCheck.date, slotToCheck.time) < minNotice) {
      return jsonResponse(409, {
        error: `Las reservas requieren al menos ${minNotice} hora(s) de anticipación. Elige otro horario.`,
      })
    }
  }

  // Las matrículas por paquete (inicio/progreso/pro) son siempre de clases
  // individuales; una franja grupal nunca debe poder consumirse con estos
  // créditos, para que la disponibilidad de cada tipo sea independiente.
  const slot = await availabilityCol.findOneAndUpdate(
    { _id: new ObjectId(slotId), status: 'open', type: 'individual', $expr: { $lt: ['$bookedCount', '$capacity'] } },
    { $inc: { bookedCount: 1 } },
    { returnDocument: 'after' },
  )
  if (!slot) {
    const existing = await availabilityCol.findOne({ _id: new ObjectId(slotId) })
    if (existing && existing.type !== 'individual') {
      return jsonResponse(400, { error: 'Esa franja es de clase grupal; los cursos por paquete solo agendan clases individuales' })
    }
    return jsonResponse(409, { error: 'Esa franja ya no está disponible' })
  }

  if (slot.bookedCount >= slot.capacity) {
    await availabilityCol.updateOne({ _id: slot._id }, { $set: { status: 'full' } })
  }

  const enrollment = await enrollmentsCol.findOneAndUpdate(
    {
      _id: enrollmentLookup._id,
      status: 'active',
      $expr: { $lt: ['$classesUsed', '$totalClasses'] },
    },
    { $inc: { classesUsed: 1 } },
    { returnDocument: 'after' },
  )

  if (!enrollment) {
    await availabilityCol.updateOne({ _id: slot._id }, { $inc: { bookedCount: -1 }, $set: { status: 'open' } })
    return jsonResponse(409, { error: 'No hay créditos disponibles en ese curso' })
  }

  if (enrollment.classesUsed >= enrollment.totalClasses) {
    await enrollmentsCol.updateOne({ _id: enrollment._id }, { $set: { status: 'finished' } })
  }

  // El evento de calendario se crea antes de insertar la reserva para poder
  // guardar el link de Google Meet en el documento y mostrarlo al estudiante.
  let calendarEventId = null
  let meetLink = null
  try {
    const { startLocal, endLocal } = computeEventTimes(slot.date, slot.time, slot.durationMin)
    const calEvent = await createCalendarEvent(db, {
      summary: `${enrollment.serviceTitle} - ${targetUserName}`,
      description: `Email: ${targetUserEmail}`,
      start: startLocal,
      end: endLocal,
      attendeeEmail: targetUserEmail,
    })
    calendarEventId = calEvent.id
    meetLink = calEvent.meetLink
  } catch (err) {
    console.error('bookings: failed to create calendar event', err)
    await logError('bookings: create calendar event', err, { event, level: 'warning' })
  }

  const bookingId = generateBookingId()
  const booking = {
    bookingId,
    userId: targetUserId,
    userEmail: targetUserEmail,
    userName: targetUserName,
    enrollmentId: String(enrollment._id),
    slotId: String(slot._id),
    serviceTitle: enrollment.serviceTitle,
    classType: slot.type,
    date: slot.date,
    time: slot.time,
    durationMin: slot.durationMin,
    status: 'paid',
    calendarEventId,
    meetLink,
    rescheduledFrom: rescheduledFrom && ObjectId.isValid(rescheduledFrom) ? String(rescheduledFrom) : null,
    createdAt: new Date(),
  }
  await bookingsCol.insertOne(booking)

  try {
    await sendBookingConfirmation({
      toName: targetUserName,
      toEmail: targetUserEmail,
      adminEmail: getAdminNotifyEmail(settings),
      bookingDetails: {
        date: slot.date,
        time: slot.time,
        serviceTitle: enrollment.serviceTitle,
        finalPrice: enrollment.finalPrice,
        name: targetUserName,
        email: targetUserEmail,
        meetLink,
      },
    })
  } catch (err) {
    console.error('bookings: failed to send confirmation email', err)
    await logError('bookings: send confirmation email', err, { event, level: 'warning' })
  }

  return jsonResponse(201, { booking })
}

async function updateBooking(event, db) {
  const { user, error } = requireAuth(event)
  if (error) return error

  const body = JSON.parse(event.body || '{}')
  const { id, status, reason } = body
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

  // Una reserva `pending` (pago manual sin confirmar) todavía no reservó la
  // franja ni consumió crédito (eso ocurre al confirmar el pago), así que al
  // cancelarla no hay que liberar cupo ni devolver crédito.
  if (status === 'cancelled' && booking.status !== 'cancelled' && booking.status !== 'pending') {
    // El admin siempre puede reembolsar (p. ej. si canceló la profesora); el
    // estudiante solo conserva el crédito si avisó con 24h de anticipación.
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
  if (status === 'cancelled') {
    update.creditRefunded = creditRefunded
    // Marca si la cancelación viene de una reprogramación (RescheduleModal:
    // cancela esta y crea una nueva enseguida) para no contarla como
    // cancelación real en las estadísticas del dashboard.
    update.cancelReason = reason === 'reschedule' ? 'reschedule' : 'cancelled'
  }

  await bookingsCol.updateOne({ _id: new ObjectId(id) }, { $set: update })
  return jsonResponse(200, { success: true, creditRefunded })
}

// Elimina una reserva por completo (solo admin). Para no dejar huérfanos, solo
// se permite borrar reservas `pending` o `cancelled`: las que no reservaron una
// franja real ni agendaron nada. Una reserva `paid`/`completed` debe cancelarse
// primero (así se libera su cupo y su crédito) antes de poder eliminarse.
async function deleteBooking(event, db) {
  const { error } = requireAuth(event, ['admin'])
  if (error) return error

  const params = event.queryStringParameters || {}
  const body = event.body ? JSON.parse(event.body) : {}
  const id = params.id || body.id
  if (!id || !ObjectId.isValid(id)) {
    return jsonResponse(400, { error: 'Falta id de la reserva' })
  }

  const bookingsCol = db.collection('bookings')
  const booking = await bookingsCol.findOne({ _id: new ObjectId(id) })
  if (!booking) return jsonResponse(404, { error: 'Reserva no encontrada' })
  if (!['pending', 'cancelled'].includes(booking.status)) {
    return jsonResponse(409, { error: 'Solo se pueden eliminar reservas pendientes o canceladas. Cancélala primero.' })
  }

  await bookingsCol.deleteOne({ _id: new ObjectId(id) })
  return jsonResponse(200, { success: true })
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
      case 'DELETE':
        return await deleteBooking(event, db)
      default:
        return jsonResponse(405, { error: 'Method not allowed' })
    }
  } catch (err) {
    console.error('bookings error:', err)
    await logError('bookings', err, { event })
    return jsonResponse(500, { error: 'Error al procesar la reserva' })
  }
}
