import { ObjectId } from 'mongodb'
import { getDb } from './_shared/mongodb.js'
import { requireAuth, jsonResponse } from './_shared/auth.js'
import { logError } from './_shared/errorLog.js'

async function listErrors(event, db) {
  const { error } = requireAuth(event, ['admin'])
  if (error) return error

  const params = event.queryStringParameters || {}
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(params.pageSize, 10) || 25))

  const filter = {}
  if (params.source?.trim()) filter.source = params.source.trim()
  if (params.level?.trim()) filter.level = params.level.trim()
  if (params.search?.trim()) {
    const re = new RegExp(params.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ message: re }, { source: re }]
  }

  const collection = db.collection('errorLogs')
  const [errors, total] = await Promise.all([
    collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
    collection.countDocuments(filter),
  ])

  return jsonResponse(200, { errors, total, page, pageSize })
}

async function deleteErrors(event, db) {
  const { error } = requireAuth(event, ['admin'])
  if (error) return error

  const params = event.queryStringParameters || {}
  const collection = db.collection('errorLogs')

  if (params.id) {
    if (!ObjectId.isValid(params.id)) return jsonResponse(400, { error: 'id inválido' })
    await collection.deleteOne({ _id: new ObjectId(params.id) })
    return jsonResponse(200, { success: true })
  }

  if (params.all === 'true') {
    await collection.deleteMany({})
    return jsonResponse(200, { success: true })
  }

  return jsonResponse(400, { error: 'Falta id o all=true' })
}

export const handler = async (event) => {
  try {
    const db = await getDb()
    switch (event.httpMethod) {
      case 'GET':
        return await listErrors(event, db)
      case 'DELETE':
        return await deleteErrors(event, db)
      default:
        return jsonResponse(405, { error: 'Method not allowed' })
    }
  } catch (err) {
    console.error('admin-errors error:', err)
    await logError('admin-errors', err, { event })
    return jsonResponse(500, { error: 'Error al procesar los errores' })
  }
}
