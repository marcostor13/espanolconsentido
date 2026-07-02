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

    const [enrollmentRevenue] = await enrollmentsCol
      .aggregate([{ $group: { _id: null, total: { $sum: '$finalPrice' } } }])
      .toArray()

    // Las reservas hechas contra un curso comprado (enrollmentId) ya cuentan su ingreso
    // en enrollmentRevenue; solo las reservas directas del landing (sin enrollmentId)
    // deben sumarse aquí para no contar el mismo ingreso dos veces.
    const [legacyRevenue] = await bookingsCol
      .aggregate([
        { $match: { enrollmentId: { $exists: false }, status: { $in: ['paid', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$finalPrice' } } },
      ])
      .toArray()

    const bookingStatusCounts = toCountMap(
      await bookingsCol.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray(),
    )

    const enrollmentStatusCounts = toCountMap(
      await enrollmentsCol.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray(),
    )

    const totalStudents = await usersCol.countDocuments({ role: 'student' })
    const activeStudents = await usersCol.countDocuments({ role: 'student', active: { $ne: false } })

    const recentBookings = await bookingsCol.find({}).sort({ createdAt: -1 }).limit(5).toArray()

    return jsonResponse(200, {
      revenue: {
        total: Math.round(((enrollmentRevenue?.total || 0) + (legacyRevenue?.total || 0)) * 100) / 100,
        fromEnrollments: enrollmentRevenue?.total || 0,
        fromLegacyBookings: legacyRevenue?.total || 0,
      },
      bookings: {
        total: (bookingStatusCounts.paid || 0) + (bookingStatusCounts.completed || 0) + (bookingStatusCounts.cancelled || 0),
        paid: bookingStatusCounts.paid || 0,
        completed: bookingStatusCounts.completed || 0,
        cancelled: bookingStatusCounts.cancelled || 0,
      },
      students: { total: totalStudents, active: activeStudents },
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
