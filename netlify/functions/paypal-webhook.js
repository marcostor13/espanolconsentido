import { getDb } from './_shared/mongodb.js'
import { jsonResponse } from './_shared/auth.js'
import { verifyPayPalWebhookSignature, capturePayPalOrder } from './_shared/paypal.js'
import { confirmBookingPayment, BookingConfirmationError } from './_shared/bookingConfirmation.js'

// Red de seguridad: si el usuario aprueba el pago en PayPal pero nunca vuelve
// al sitio (cierra la pestaña, falla la red, etc.), este webhook captura y
// confirma la reserva igualmente. Es idempotente frente a capture-paypal-order.js.
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  try {
    const rawBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf-8') : event.body

    const isValid = await verifyPayPalWebhookSignature({ headers: event.headers, rawBody })
    if (!isValid) {
      console.error('paypal-webhook: invalid signature')
      return jsonResponse(400, { error: 'Firma de webhook inválida' })
    }

    const payload = JSON.parse(rawBody)

    if (payload.event_type === 'CHECKOUT.ORDER.APPROVED') {
      const order = payload.resource
      const orderId = order?.id
      const bookingId = order?.purchase_units?.[0]?.reference_id

      if (orderId && bookingId) {
        const db = await getDb()
        const booking = await db.collection('bookings').findOne({ bookingId })

        if (booking && booking.paypalOrderId === orderId && booking.status === 'pending') {
          await capturePayPalOrder(orderId)
          try {
            await confirmBookingPayment(db, bookingId, { paymentMethod: 'paypal' })
          } catch (err) {
            if (!(err instanceof BookingConfirmationError && err.code === 'ALREADY_PROCESSED')) throw err
          }
        }
      }
    }

    return jsonResponse(200, { received: true })
  } catch (err) {
    console.error('paypal-webhook error:', err)
    return jsonResponse(500, { error: 'Error al procesar el webhook de PayPal' })
  }
}
