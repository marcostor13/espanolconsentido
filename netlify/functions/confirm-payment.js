import { getDb } from './_shared/mongodb.js'
import { jsonResponse } from './_shared/auth.js'
import { confirmBookingPayment, BookingConfirmationError } from './_shared/bookingConfirmation.js'
import { logError } from './_shared/errorLog.js'

export const handler = async (event) => {
  const token = event.queryStringParameters?.token || event.headers['x-admin-token']
  const bookingId = event.queryStringParameters?.bookingId
  const paymentMethod = event.queryStringParameters?.paymentMethod

  if (process.env.ADMIN_TOKEN && token !== process.env.ADMIN_TOKEN) {
    return jsonResponse(401, { error: 'No autorizado' })
  }

  if (!bookingId) {
    return jsonResponse(400, { error: 'Falta bookingId' })
  }

  try {
    const db = await getDb()
    await confirmBookingPayment(db, bookingId, { paymentMethod })

    return jsonResponse(200, {
      success: true,
      message: 'Pago confirmado y evento creado en Google Calendar',
    })
  } catch (err) {
    if (err instanceof BookingConfirmationError) {
      return jsonResponse(err.code === 'NOT_FOUND' ? 404 : 400, { error: err.message })
    }
    console.error('confirm-payment error:', err)
    await logError('confirm-payment', err, { event })
    return jsonResponse(500, { error: err.message || 'Error al confirmar el pago' })
  }
}
