import { getDb } from './_shared/mongodb.js'
import { requireAuth, jsonResponse } from './_shared/auth.js'
import { confirmBookingPayment, BookingConfirmationError } from './_shared/bookingConfirmation.js'
import { logError } from './_shared/errorLog.js'

// Confirmación manual de pagos que no pasan por un webhook automático (Wise,
// transferencia, efectivo): la admin la dispara desde el panel después de
// verificar el pago a mano, nunca el propio frontend público sin sesión.
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const { error } = requireAuth(event, ['admin'])
  if (error) return error

  const body = JSON.parse(event.body || '{}')
  const bookingId = body.bookingId
  const paymentMethod = body.paymentMethod

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
