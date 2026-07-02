import { getDb } from './_shared/mongodb.js'
import { jsonResponse } from './_shared/auth.js'
import { capturePayPalOrder } from './_shared/paypal.js'
import { confirmBookingPayment, BookingConfirmationError } from './_shared/bookingConfirmation.js'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { bookingId, orderId } = body
    if (!bookingId || !orderId) {
      return jsonResponse(400, { error: 'Faltan bookingId u orderId' })
    }

    const db = await getDb()
    const booking = await db.collection('bookings').findOne({ bookingId })
    if (!booking) return jsonResponse(404, { error: 'Reserva no encontrada' })
    if (booking.paypalOrderId !== orderId) {
      return jsonResponse(400, { error: 'La orden de PayPal no coincide con esta reserva' })
    }

    if (booking.status === 'pending') {
      await capturePayPalOrder(orderId)
      try {
        await confirmBookingPayment(db, bookingId, { paymentMethod: 'paypal' })
      } catch (err) {
        if (!(err instanceof BookingConfirmationError && err.code === 'ALREADY_PROCESSED')) throw err
      }
    }

    return jsonResponse(200, { success: true })
  } catch (err) {
    console.error('capture-paypal-order error:', err)
    return jsonResponse(500, { error: err.message || 'Error al confirmar el pago con PayPal' })
  }
}
