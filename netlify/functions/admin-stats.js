import { getDb } from './_shared/mongodb.js'
import { requireAuth, jsonResponse } from './_shared/auth.js'
import { logError } from './_shared/errorLog.js'

function toCountMap(aggResult) {
  return Object.fromEntries(aggResult.map((r) => [r._id, r.count]))
}

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const { error } = requireAuth(event, ['admin'])
  if (error) return error

  try {
    const db = await getDb()
    const bookingsCol = db.collection('bookings')
    const enrollmentsCol = db.collection('enrollments')
    const usersCol = db.collection('users')

    // Filtro opcional de rango de fechas (from/to en formato YYYY-MM-DD).
    // Para las reservas se filtra por la fecha de la clase (campo `date`, que
    // ya es una cadena ISO y ordena/compara lexicográficamente); para los
    // ingresos por curso, que no tienen fecha de clase única, se filtra por la
    // fecha de compra (`createdAt`). Si no llega ningún extremo válido, el
    // dashboard sigue mostrando los totales históricos como antes.
    const params = event.queryStringParameters || {}
    const isDateStr = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
    const from = isDateStr(params.from) ? params.from : null
    const to = isDateStr(params.to) ? params.to : null
    const hasDateFilter = Boolean(from || to)

    const bookingDateMatch = {}
    if (from) bookingDateMatch.$gte = from
    if (to) bookingDateMatch.$lte = to
    const bookingDateFilter = hasDateFilter ? { date: bookingDateMatch } : {}

    const createdAtMatch = {}
    if (from) createdAtMatch.$gte = new Date(`${from}T00:00:00.000Z`)
    if (to) createdAtMatch.$lte = new Date(`${to}T23:59:59.999Z`)
    const createdAtFilter = hasDateFilter ? { createdAt: createdAtMatch } : {}

    const [enrollmentRevenue] = await enrollmentsCol
      .aggregate([
        ...(hasDateFilter ? [{ $match: createdAtFilter }] : []),
        { $group: { _id: null, total: { $sum: '$finalPrice' } } },
      ])
      .toArray()

    // Las reservas hechas contra un curso comprado (enrollmentId) ya cuentan su ingreso
    // en enrollmentRevenue; solo las reservas directas del landing (sin enrollmentId)
    // deben sumarse aquí para no contar el mismo ingreso dos veces.
    const [legacyRevenue] = await bookingsCol
      .aggregate([
        { $match: { enrollmentId: { $exists: false }, status: { $in: ['paid', 'completed'] }, ...bookingDateFilter } },
        { $group: { _id: null, total: { $sum: '$finalPrice' } } },
      ])
      .toArray()

    const bookingStatusCounts = toCountMap(
      await bookingsCol
        .aggregate([
          ...(hasDateFilter ? [{ $match: bookingDateFilter }] : []),
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ])
        .toArray(),
    )

    // Reprogramar cancela la reserva vieja y crea una nueva (RescheduleModal),
    // así que dentro de status='cancelled' hay que separar las que en
    // realidad fueron una reprogramación (cancelReason='reschedule') de las
    // cancelaciones reales, para no mezclarlas en el dashboard.
    const cancelReasonCounts = toCountMap(
      await bookingsCol
        .aggregate([
          { $match: { status: 'cancelled', ...bookingDateFilter } },
          { $group: { _id: { $ifNull: ['$cancelReason', 'cancelled'] }, count: { $sum: 1 } } },
        ])
        .toArray(),
    )

    const enrollmentStatusCounts = toCountMap(
      await enrollmentsCol.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray(),
    )

    const totalStudents = await usersCol.countDocuments({ role: 'student' })
    const activeStudents = await usersCol.countDocuments({ role: 'student', active: { $ne: false } })

    const recentBookings = await bookingsCol.find({ ...bookingDateFilter }).sort({ createdAt: -1 }).limit(5).toArray()

    // Reservas por estado CON nombre del estudiante, para que el dashboard
    // muestre quiénes están detrás de cada número (limitado a las más
    // recientes de cada estado para no inflar la respuesta).
    const bookingFields = { projection: { bookingId: 1, userName: 1, name: 1, serviceTitle: 1, date: 1, time: 1, cancelReason: 1 } }
    const [paidList, completedList, cancelledRaw] = await Promise.all([
      bookingsCol.find({ status: 'paid', ...bookingDateFilter }, bookingFields).sort({ date: 1, time: 1 }).limit(30).toArray(),
      bookingsCol.find({ status: 'completed', ...bookingDateFilter }, bookingFields).sort({ date: -1, time: -1 }).limit(30).toArray(),
      bookingsCol.find({ status: 'cancelled', ...bookingDateFilter }, bookingFields).sort({ date: -1, time: -1 }).limit(60).toArray(),
    ])
    const simplify = (b) => ({
      bookingId: b.bookingId,
      studentName: b.userName || b.name || 'Sin nombre',
      serviceTitle: b.serviceTitle,
      date: b.date,
      time: b.time,
    })
    const bookingsByStatus = {
      paid: paidList.map(simplify),
      completed: completedList.map(simplify),
      cancelled: cancelledRaw.filter((b) => (b.cancelReason || 'cancelled') === 'cancelled').slice(0, 30).map(simplify),
      rescheduled: cancelledRaw.filter((b) => b.cancelReason === 'reschedule').slice(0, 30).map(simplify),
    }

    // Lista de estudiantes activos con sus créditos, para verlos de un
    // vistazo desde el dashboard.
    const activeStudentDocs = await usersCol
      .find({ role: 'student', active: { $ne: false } }, { projection: { name: 1, email: 1, createdAt: 1 } })
      .sort({ name: 1 })
      .limit(200)
      .toArray()
    const activeEnrollments = await enrollmentsCol
      .find({ status: 'active' }, { projection: { userId: 1, totalClasses: 1, classesUsed: 1 } })
      .toArray()
    const creditsByUser = {}
    for (const e of activeEnrollments) {
      creditsByUser[e.userId] = (creditsByUser[e.userId] || 0) + Math.max(0, (e.totalClasses || 0) - (e.classesUsed || 0))
    }
    const activeStudentsList = activeStudentDocs.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      remainingClasses: creditsByUser[String(u._id)] || 0,
    }))

    return jsonResponse(200, {
      filter: { from, to },
      revenue: {
        total: Math.round(((enrollmentRevenue?.total || 0) + (legacyRevenue?.total || 0)) * 100) / 100,
        fromEnrollments: enrollmentRevenue?.total || 0,
        fromLegacyBookings: legacyRevenue?.total || 0,
      },
      bookings: {
        total: (bookingStatusCounts.paid || 0) + (bookingStatusCounts.completed || 0) + (bookingStatusCounts.cancelled || 0),
        paid: bookingStatusCounts.paid || 0,
        completed: bookingStatusCounts.completed || 0,
        cancelled: cancelReasonCounts.cancelled || 0,
        rescheduled: cancelReasonCounts.reschedule || 0,
      },
      students: { total: totalStudents, active: activeStudents },
      bookingsByStatus,
      activeStudentsList,
      enrollments: {
        total: (enrollmentStatusCounts.active || 0) + (enrollmentStatusCounts.finished || 0),
        active: enrollmentStatusCounts.active || 0,
        finished: enrollmentStatusCounts.finished || 0,
      },
      recentBookings,
    })
  } catch (err) {
    console.error('admin-stats error:', err)
    await logError('admin-stats', err, { event })
    return jsonResponse(500, { error: 'Error al calcular las estadísticas' })
  }
}
