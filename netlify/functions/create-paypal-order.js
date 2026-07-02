import { getDb } from './_shared/mongodb.js'
import { jsonResponse } from './_shared/auth.js'
import { createPayPalOrder } from './_shared/paypal.js'
import { logError } from './_shared/errorLog.js'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { bookingId } = body
    if (!bookingId) {
      return jsonResponse(400, { error: 'Falta bookingId' })
    }

    const db = await getDb()
    const bookingsCol = db.collection('bookings')
    const booking = await bookingsCol.findOne({ bookingId })

    if (!booking) return jsonResponse(404, { error: 'Reserva no encontrada' })
    if (booking.status !== 'pending') {
      return jsonResponse(400, { error: `La reserva ya está ${booking.status}` })
    }

    const amount = Number(booking.finalPrice ?? booking.price ?? 0)
    if (amount <= 0) {
      return jsonResponse(400, { error: 'Monto inválido para procesar el pago' })
    }

    const siteUrl = (process.env.SITE_URL || 'https://espanolconsentido.com').replace(/\/$/, '')

    const { orderId, approveUrl } = await createPayPalOrder({
      amount,
      description: booking.serviceTitle,
      referenceId: bookingId,
      returnUrl: `${siteUrl}/?paypal=return&bookingId=${encodeURIComponent(bookingId)}`,
      cancelUrl: `${siteUrl}/?payment=cancelled&bookingId=${encodeURIComponent(bookingId)}`,
    })

    if (!approveUrl) {
      return jsonResponse(500, { error: 'PayPal no devolvió un enlace de aprobación' })
    }

    await bookingsCol.updateOne({ bookingId }, { $set: { paymentMethod: 'paypal', paypalOrderId: orderId } })

    return jsonResponse(200, { approveUrl })
  } catch (err) {
    console.error('create-paypal-order error:', err)
    await logError('create-paypal-order', err, { event })
    return jsonResponse(500, { error: err.message || 'Error al iniciar el pago con PayPal' })
  }
}
