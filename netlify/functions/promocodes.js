import { ObjectId } from 'mongodb'
import { getDb } from './_shared/mongodb.js'
import { requireAuth, jsonResponse } from './_shared/auth.js'
import { logError } from './_shared/errorLog.js'

async function listPromocodes(event, db) {
  const { error } = requireAuth(event, ['admin'])
  if (error) return error

  const promocodes = await db.collection('promocodes').find({}).sort({ createdAt: -1 }).toArray()
  return jsonResponse(200, { promocodes })
}

async function createPromocode(event, db) {
  const { error } = requireAuth(event, ['admin'])
  if (error) return error

  const body = JSON.parse(event.body || '{}')
  const code = body.code?.trim().toUpperCase()
  const discountPercent = Number(body.discountPercent)

  if (!code) return jsonResponse(400, { error: 'El código es obligatorio' })
  if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
    return jsonResponse(400, { error: 'El descuento debe ser un porcentaje entre 1 y 100' })
  }

  const existing = await db.collection('promocodes').findOne({ code })
  if (existing) return jsonResponse(409, { error: 'Ya existe un código con ese nombre' })

  const promocode = { code, discountPercent, active: true, createdAt: new Date() }
  const result = await db.collection('promocodes').insertOne(promocode)
  promocode._id = result.insertedId

  return jsonResponse(201, { promocode })
}

async function updatePromocode(event, db) {
  const { error } = requireAuth(event, ['admin'])
  if (error) return error

  const body = JSON.parse(event.body || '{}')
  const { id, active, discountPercent } = body
  if (!id || !ObjectId.isValid(id)) return jsonResponse(400, { error: 'Falta id del código' })

  const update = {}
  if (typeof active === 'boolean') update.active = active
  if (discountPercent !== undefined) {
    const n = Number(discountPercent)
    if (!Number.isFinite(n) || n <= 0 || n > 100) return jsonResponse(400, { error: 'Descuento inválido' })
    update.discountPercent = n
  }
  if (Object.keys(update).length === 0) return jsonResponse(400, { error: 'Nada para actualizar' })

  const promocode = await db
    .collection('promocodes')
    .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: update }, { returnDocument: 'after' })

  if (!promocode) return jsonResponse(404, { error: 'Código no encontrado' })
  return jsonResponse(200, { promocode })
}

async function deletePromocode(event, db) {
  const { error } = requireAuth(event, ['admin'])
  if (error) return error

  const params = event.queryStringParameters || {}
  const body = event.body ? JSON.parse(event.body) : {}
  const id = params.id || body.id
  if (!id || !ObjectId.isValid(id)) return jsonResponse(400, { error: 'Falta id del código' })

  const result = await db.collection('promocodes').deleteOne({ _id: new ObjectId(id) })
  if (result.deletedCount === 0) return jsonResponse(404, { error: 'Código no encontrado' })

  return jsonResponse(200, { success: true })
}

export const handler = async (event) => {
  try {
    const db = await getDb()
    switch (event.httpMethod) {
      case 'GET':
        return await listPromocodes(event, db)
      case 'POST':
        return await createPromocode(event, db)
      case 'PATCH':
        return await updatePromocode(event, db)
      case 'DELETE':
        return await deletePromocode(event, db)
      default:
        return jsonResponse(405, { error: 'Method not allowed' })
    }
  } catch (err) {
    console.error('promocodes error:', err)
    await logError('promocodes', err, { event })
    return jsonResponse(500, { error: 'Error al procesar los códigos promocionales' })
  }
}
