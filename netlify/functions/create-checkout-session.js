import Stripe from 'stripe'
import { getDb } from './_shared/mongodb.js'
import { jsonResponse } from './_shared/auth.js'

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('Stripe no está configurado en el servidor')
  return new Stripe(secretKey)
}

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

    const amount = Math.round((booking.finalPrice ?? booking.price ?? 0) * 100)
    if (amount <= 0) {
      return jsonResponse(400, { error: 'Monto inválido para procesar el pago' })
    }

    const siteUrl = (process.env.SITE_URL || 'https://espanolconsentido.com').replace(/\/$/, '')
    const stripe = getStripeClient()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: booking.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: booking.serviceTitle },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: { bookingId },
      success_url: `${siteUrl}/?payment=success&bookingId=${encodeURIComponent(bookingId)}`,
      cancel_url: `${siteUrl}/?payment=cancelled&bookingId=${encodeURIComponent(bookingId)}`,
    })

    await bookingsCol.updateOne(
      { bookingId },
      { $set: { paymentMethod: 'stripe', stripeSessionId: session.id } },
    )

    return jsonResponse(200, { url: session.url })
  } catch (err) {
    console.error('create-checkout-session error:', err)
    return jsonResponse(500, { error: err.message || 'Error al iniciar el pago con Stripe' })
  }
}
