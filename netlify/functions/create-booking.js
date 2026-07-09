import { ObjectId } from 'mongodb'
import { getDb } from './_shared/mongodb.js'
import { logError } from './_shared/errorLog.js'
import { findUnusedTrialCredit } from './_shared/trialCredit.js'
import { getSettings, getServicePrice, getTrialCreditAmount } from './_shared/settings.js'
import { hoursUntilClass } from './_shared/time.js'

// Debe reflejar src/lib/packages.js (SLOT_BASED_SERVICE_IDS / SERVICE_SLOT_TYPE):
// servicios de una sola clase que se reservan contra una franja real del
// calendario en el momento de la compra; los paquetes de varias clases se
// agendan después desde el portal del estudiante y no requieren slotId aquí.
const SLOT_BASED_SERVICE_IDS = ['trial', 'individual', 'group']
const SERVICE_SLOT_TYPE = { trial: 'individual', individual: 'individual', group: 'group' }
const PACKAGE_TOTAL_CLASSES = { inicio: 4, progreso: 8, pro: 12 }
// Debe reflejar PACKAGE_SERVICE_IDS en _shared/bookingConfirmation.js.
const PACKAGE_SERVICE_IDS = ['inicio', 'progreso', 'pro']

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
    const { name, email, serviceId, serviceTitle, questions, promoCode, slotId } = body

    if (!name?.trim() || !email?.trim() || !serviceId || !serviceTitle) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Faltan campos requeridos: name, email, serviceId, serviceTitle' }),
      }
    }

    const db = await getDb()
    const settings = await getSettings(db)

    // El precio SIEMPRE sale de la configuración del servidor, nunca de lo que
    // envíe el cliente, para que no se pueda manipular desde el navegador.
    const originalPrice = getServicePrice(settings, serviceId)
    if (originalPrice === null) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Servicio no reconocido' }),
      }
    }

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
      const minNotice = Number(settings.minBookingNoticeHours) || 0
      if (hoursUntilClass(slot.date, slot.time) < minNotice) {
        return {
          statusCode: 409,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: `Las reservas requieren al menos ${minNotice} hora(s) de anticipación. Elige otro horario.`,
          }),
        }
      }
      date = slot.date
      time = slot.time
      durationMin = slot.durationMin
      classType = slot.type
    }

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

    // Si el estudiante ya pagó una clase de prueba y compra un paquete, se le
    // descuenta el valor de esa clase antes de cobrar (no después), para que
    // lo que pague por PayPal ya sea el monto con el descuento aplicado. Se
    // busca por email porque a esta altura puede que aún no exista su cuenta.
    const trialCreditAmount = getTrialCreditAmount(settings)
    let trialCredit = null
    if (PACKAGE_SERVICE_IDS.includes(serviceId)) {
      trialCredit = await findUnusedTrialCredit(db, { email: email.trim() })
      if (trialCredit) {
        finalPrice = Math.max(0, Math.round((finalPrice - trialCreditAmount) * 100) / 100)
      }
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
      trialCreditApplied: Boolean(trialCredit),
      trialCreditAmount: trialCredit ? trialCreditAmount : 0,
      trialCreditSourceCollection: trialCredit ? trialCredit.collection : null,
      trialCreditSourceId: trialCredit ? String(trialCredit.id) : null,
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
        trialCreditApplied: Boolean(trialCredit),
        trialCreditAmount: trialCredit ? trialCreditAmount : 0,
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
