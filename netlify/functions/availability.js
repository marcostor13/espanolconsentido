import { ObjectId } from 'mongodb'
import { getDb } from './_shared/mongodb.js'
import { requireAuth, jsonResponse } from './_shared/auth.js'
import { getSettings } from './_shared/settings.js'
import { hoursUntilClass } from './_shared/time.js'
import { logError } from './_shared/errorLog.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/
const SLOT_TYPES = ['individual', 'group']

// Devuelve el usuario autenticado (cualquier rol) o null si no hay sesión o
// el token no es válido; se usa para distinguir visitante anónimo (compra
// pública) de alumno logueado (agenda con créditos ya comprados), cada uno
// con su propia anticipación mínima configurable.
function tryGetUser(event) {
  const header = event.headers?.authorization || event.headers?.Authorization
  if (!header) return null
  const { user } = requireAuth(event)
  return user || null
}

function validateSlotInput(slot) {
  if (!slot || !DATE_RE.test(slot.date) || !TIME_RE.test(slot.time)) {
    return 'Cada franja requiere date (YYYY-MM-DD) y time (HH:mm) válidos'
  }
  if (slot.type && !SLOT_TYPES.includes(slot.type)) {
    return 'type debe ser "individual" o "group"'
  }
  return null
}

async function getAvailability(event, db, col) {
  const params = event.queryStringParameters || {}
  const user = tryGetUser(event)
  const isAdmin = user?.role === 'admin'

  const filter = {}
  if (params.from || params.to) {
    filter.date = {}
    if (params.from) filter.date.$gte = params.from
    if (params.to) filter.date.$lte = params.to
  }
  if (SLOT_TYPES.includes(params.type)) filter.type = params.type
  if (!isAdmin) filter.status = 'open'
  else if (params.status) filter.status = params.status

  let slots = await col.find(filter).sort({ date: 1, time: 1 }).toArray()

  // A los estudiantes/visitantes solo se les muestran franjas que todavía se
  // pueden reservar según la anticipación mínima configurada; el admin ve
  // todo. Un alumno logueado (agenda con créditos ya comprados) usa su
  // propia anticipación mínima, distinta de la del visitante anónimo que
  // compra desde la web pública.
  if (!isAdmin) {
    const settings = await getSettings(db)
    const minNotice = user
      ? Number(settings.studentMinBookingNoticeHours) || 0
      : Number(settings.minBookingNoticeHours) || 0
    slots = slots.filter((s) => hoursUntilClass(s.date, s.time) >= minNotice)
  }

  return jsonResponse(200, { slots })
}

async function createAvailability(event, db, col) {
  const { error } = requireAuth(event, ['admin'])
  if (error) return error

  const body = JSON.parse(event.body || '{}')
  const inputs = Array.isArray(body.slots) ? body.slots : [body]

  for (const slot of inputs) {
    const invalid = validateSlotInput(slot)
    if (invalid) return jsonResponse(400, { error: invalid })
  }

  const settings = await getSettings(db)
  const now = new Date()
  const docs = inputs.map((slot) => {
    const type = slot.type === 'group' ? 'group' : 'individual'
    const capacity = type === 'group' ? settings.groupClassCapacity : 1
    return {
      date: slot.date,
      time: slot.time,
      durationMin: Number(slot.durationMin) || 55,
      type,
      capacity,
      bookedCount: 0,
      status: 'open',
      createdAt: now,
    }
  })

  const results = []
  for (const doc of docs) {
    // La llave incluye `type`: una franja individual y una grupal a la misma
    // fecha/hora son slots independientes, no se pisan entre sí.
    const result = await col.updateOne(
      { date: doc.date, time: doc.time, type: doc.type },
      { $setOnInsert: doc },
      { upsert: true },
    )
    results.push(result)
  }

  return jsonResponse(201, { created: results.filter((r) => r.upsertedCount > 0).length })
}

async function deleteAvailability(event, col) {
  const { error } = requireAuth(event, ['admin'])
  if (error) return error

  const params = event.queryStringParameters || {}
  const body = event.body ? JSON.parse(event.body) : {}
  const id = params.id || body.id

  if (!id || !ObjectId.isValid(id)) {
    return jsonResponse(400, { error: 'Falta id de la franja' })
  }

  const slot = await col.findOne({ _id: new ObjectId(id) })
  if (!slot) return jsonResponse(404, { error: 'Franja no encontrada' })
  if ((slot.bookedCount || 0) > 0) {
    return jsonResponse(409, { error: 'No se puede eliminar una franja con reservas' })
  }

  await col.deleteOne({ _id: new ObjectId(id) })
  return jsonResponse(200, { success: true })
}

export const handler = async (event) => {
  try {
    const db = await getDb()
    const col = db.collection('availability')

    switch (event.httpMethod) {
      case 'GET':
        return await getAvailability(event, db, col)
      case 'POST':
        return await createAvailability(event, db, col)
      case 'DELETE':
        return await deleteAvailability(event, col)
      default:
        return jsonResponse(405, { error: 'Method not allowed' })
    }
  } catch (err) {
    console.error('availability error:', err)
    await logError('availability', err, { event })
    return jsonResponse(500, { error: 'Error al procesar la disponibilidad' })
  }
}
