import { getDb } from './_shared/mongodb.js'
import { jsonResponse } from './_shared/auth.js'
import { getSettings, getAdminNotifyEmail } from './_shared/settings.js'
import { sendWisePaymentNotification } from './_shared/email.js'
import { logError } from './_shared/errorLog.js'

// Debe reflejar src/lib/paymentMethods.js: métodos de transferencia manual
// soportados (el estudiante adjunta comprobante, la admin confirma a mano).
const TRANSFER_PAYMENT_METHOD_IDS = ['wise', 'global66']

// El estudiante eligió pagar por transferencia manual (Wise o Global66):
// después de abrir el enlace de pago puede adjuntar aquí su comprobante
// (link o referencia de la transferencia). La reserva sigue `pending` hasta
// que la admin verifique el dinero y la confirme desde el panel; esto solo
// registra el comprobante y avisa por correo a administración. El nombre del
// endpoint y los campos en Mongo quedaron como "wise" por ser el primer
// proveedor soportado, pero valen para cualquier método de transferencia.
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const bookingId = String(body.bookingId || '').trim()
    const proof = String(body.proof || '').trim().slice(0, 500)
    const paymentMethod = TRANSFER_PAYMENT_METHOD_IDS.includes(body.paymentMethod) ? body.paymentMethod : 'wise'

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

    await bookingsCol.updateOne(
      { bookingId },
      {
        $set: {
          paymentMethod,
          wisePaymentProof: proof || null,
          wiseProofSubmittedAt: new Date(),
        },
      },
    )

    try {
      const settings = await getSettings(db)
      await sendWisePaymentNotification({
        adminEmail: getAdminNotifyEmail(settings),
        booking,
        proof,
        paymentMethod,
      })
    } catch (err) {
      console.error('submit-wise-payment: failed to notify admin', err)
      await logError('submit-wise-payment: notify admin', err, { level: 'warning' })
    }

    return jsonResponse(200, {
      success: true,
      message: 'Recibimos tu comprobante. Confirmaremos tu reserva en cuanto verifiquemos el pago.',
    })
  } catch (err) {
    console.error('submit-wise-payment error:', err)
    await logError('submit-wise-payment', err, { event })
    return jsonResponse(500, { error: 'Error al registrar el comprobante de pago' })
  }
}
