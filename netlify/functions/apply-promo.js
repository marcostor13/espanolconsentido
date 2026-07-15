import { getDb } from './_shared/mongodb.js'
import { jsonResponse } from './_shared/auth.js'
import { logError } from './_shared/errorLog.js'

async function getPromo(db, code) {
  if (!code?.trim()) return null
  return db.collection('promocodes').findOne({ code: code.trim().toUpperCase(), active: { $ne: false } })
}

// Aplica (o quita) un código promocional a una reserva pendiente ya creada,
// recalculando su precio final. Se usa en la compra desde el portal del alumno,
// donde la reserva se crea al abrir el modal (para mostrar el precio con el
// crédito de la clase de prueba) y el código se ingresa después. El descuento
// del código se aplica sobre el precio del paquete y, si corresponde, luego se
// resta el crédito de la clase de prueba, igual que en create-booking.
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const bookingId = String(body.bookingId || '').trim()
    const promoCode = String(body.promoCode || '').trim()
    if (!bookingId) return jsonResponse(400, { error: 'Falta bookingId' })

    const db = await getDb()
    const col = db.collection('bookings')
    const booking = await col.findOne({ bookingId })
    if (!booking) return jsonResponse(404, { error: 'Reserva no encontrada' })
    if (booking.status !== 'pending') {
      return jsonResponse(400, { error: `La reserva ya está ${booking.status}` })
    }

    const originalPrice = Number(booking.price) || 0
    let appliedPromo = null
    let discounted = originalPrice

    if (promoCode) {
      const promo = await getPromo(db, promoCode)
      if (!promo) return jsonResponse(400, { error: 'Código promocional no válido' })
      const discount = Number(promo.discountPercent) || 0
      discounted = Math.round(originalPrice * (1 - discount / 100) * 100) / 100
      appliedPromo = { code: promo.code, discountPercent: discount }
    }

    let finalPrice = discounted
    if (booking.trialCreditApplied) {
      finalPrice = Math.max(0, Math.round((discounted - (booking.trialCreditAmount || 0)) * 100) / 100)
    }

    await col.updateOne({ bookingId }, { $set: { finalPrice, appliedPromo } })

    return jsonResponse(200, {
      finalPrice,
      appliedPromo,
      originalPrice,
      trialCreditApplied: Boolean(booking.trialCreditApplied),
      trialCreditAmount: booking.trialCreditAmount || 0,
    })
  } catch (err) {
    console.error('apply-promo error:', err)
    await logError('apply-promo', err, { event })
    return jsonResponse(500, { error: 'Error al aplicar el código promocional' })
  }
}
