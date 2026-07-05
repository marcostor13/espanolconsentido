import { ObjectId } from 'mongodb'
import { getDb } from './_shared/mongodb.js'
import { logError } from './_shared/errorLog.js'

// Debe reflejar src/lib/packages.js (SLOT_BASED_SERVICE_IDS / SERVICE_SLOT_TYPE):
// servicios de una sola clase que se reservan contra una franja real del
// calendario en el momento de la compra; los paquetes de varias clases se
// agendan después desde el portal del estudiante y no requieren slotId aquí.
const SLOT_BASED_SERVICE_IDS = ['trial', 'individual', 'group']
const SERVICE_SLOT_TYPE = { trial: 'individual', individual: 'individual', group: 'group' }
const PACKAGE_TOTAL_CLASSES = { inicio: 4, progreso: 8, pro: 12 }

function generateBookingId() {
  return 'b_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 11)
}

async function getPromoDiscount(db, code) {
  if (!code?.trim()) return null
  const promo = await db.collection('promocodes').findOne({
    code: code.trim().toUpperCase(),
    active: { $ne: false },
  })
  return promo
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { name, email, serviceId, serviceTitle, price, questions, promoCode, slotId } = body

    if (!name?.trim() || !email?.trim() || !serviceId || !serviceTitle) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Faltan campos requeridos: name, email, serviceId, serviceTitle' }),
      }
    }

    const db = await getDb()

    // Para clases sueltas (prueba, individual, grupal) la fecha/hora vienen
    // siempre de una franja real del calendario, nunca de lo que envíe el
    // cliente, para que la reserva no pueda quedar desalineada con lo que la
    // profesora realmente abrió en /admin/calendario.
    let date = null
    let time = null
    let durationMin = null
    let classType = null

    if (SLOT_BASED_SERVICE_IDS.includes(serviceId)) {
      if (!slotId || !ObjectId.isValid(slotId)) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Selecciona un horario para reservar esta clase' }),
        }
      }
      const slot = await db.collection('availability').findOne({ _id: new ObjectId(slotId) })
      if (!slot || slot.status !== 'open') {
        return {
          statusCode: 409,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Ese horario ya no está disponible. Elige otro.' }),
        }
      }
      if (slot.type !== SERVICE_SLOT_TYPE[serviceId]) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'El horario elegido no corresponde a este tipo de clase' }),
        }
      }
      date = slot.date
      time = slot.time
      durationMin = slot.durationMin
      classType = slot.type
    }

    const originalPrice = Number(price) || 0

    let finalPrice = originalPrice
    let appliedPromo = null

    if (promoCode?.trim()) {
      const promo = await getPromoDiscount(db, promoCode)
      if (!promo) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Código promocional no válido' }),
        }
      }
      const discount = Number(promo.discountPercent) || 0
      finalPrice = Math.round(originalPrice * (1 - discount / 100) * 100) / 100
      appliedPromo = { code: promo.code, discountPercent: discount }
    }

    const bookingId = generateBookingId()
    const collection = db.collection('bookings')

    const booking = {
      bookingId,
      name: name.trim(),
      email: email.trim(),
      date,
      time,
      slotId: slotId || null,
      durationMin,
      classType,
      totalClasses: PACKAGE_TOTAL_CLASSES[serviceId] || 1,
      serviceId,
      serviceTitle,
      price: originalPrice,
      finalPrice,
      appliedPromo,
      questions: questions || {},
      status: 'pending',
      createdAt: new Date(),
    }

    await collection.insertOne(booking)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        bookingId,
        finalPrice,
        originalPrice,
        appliedPromo,
        message: 'Reserva registrada. Completa el pago para confirmar.',
      }),
    }
  } catch (err) {
    console.error('create-booking error:', err)
    await logError('create-booking', err, { event })
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Error al crear la reserva' }),
    }
  }
}
