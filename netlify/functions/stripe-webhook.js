import Stripe from 'stripe'
import { getDb } from './_shared/mongodb.js'
import { jsonResponse } from './_shared/auth.js'
import { confirmBookingPayment, BookingConfirmationError } from './_shared/bookingConfirmation.js'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secretKey || !webhookSecret) {
    console.error('stripe-webhook: Stripe no está configurado en el servidor')
    return jsonResponse(500, { error: 'Stripe no está configurado en el servidor' })
  }

  const stripe = new Stripe(secretKey)
  const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature']
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('stripe-webhook: invalid signature', err.message)
    return jsonResponse(400, { error: `Firma de webhook inválida: ${err.message}` })
  }

  try {
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object
      const bookingId = session.metadata?.bookingId

      if (bookingId) {
        const db = await getDb()
        try {
          await confirmBookingPayment(db, bookingId)
        } catch (err) {
          // Si ya estaba confirmada (reintento de Stripe) no es un error real.
          if (!(err instanceof BookingConfirmationError && err.code === 'ALREADY_PROCESSED')) {
            throw err
          }
        }
      }
    }

    return jsonResponse(200, { received: true })
  } catch (err) {
    console.error('stripe-webhook error:', err)
    return jsonResponse(500, { error: 'Error al procesar el webhook de Stripe' })
  }
}
