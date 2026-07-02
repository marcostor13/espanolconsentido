import { ObjectId } from 'mongodb'
import { getDb } from './_shared/mongodb.js'
import { requireAuth, jsonResponse } from './_shared/auth.js'

async function listMaterials(event, db) {
  const { user, error } = requireAuth(event)
  if (error) return error

  const col = db.collection('materials')
  const filter =
    user.role === 'admin'
      ? {}
      : { $or: [{ visibility: 'all' }, { visibility: 'selected', allowedUserIds: user.id }] }

  const materials = await col.find(filter).sort({ createdAt: -1 }).toArray()
  return jsonResponse(200, { materials })
}

async function createMaterial(event, db) {
  const { user, error } = requireAuth(event, ['admin'])
  if (error) return error

  const body = JSON.parse(event.body || '{}')
  const { title, description, url, category, visibility, allowedEmails } = body

  if (!title?.trim() || !url?.trim()) {
    return jsonResponse(400, { error: 'El título y la URL son obligatorios' })
  }

  const vis = visibility === 'selected' ? 'selected' : 'all'
  let allowedUserIds = []

  if (vis === 'selected') {
    const emails = Array.isArray(allowedEmails)
      ? allowedEmails
      : String(allowedEmails || '')
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean)

    if (emails.length === 0) {
      return jsonResponse(400, { error: 'Agrega al menos un email de estudiante para visibilidad restringida' })
    }

    const normalizedEmails = [...new Set(emails.map((e) => e.toLowerCase()))]
    const students = await db
      .collection('users')
      .find({ email: { $in: normalizedEmails }, role: 'student' })
      .toArray()

    if (students.length !== normalizedEmails.length) {
      const foundEmails = new Set(students.map((s) => s.email))
      const missing = normalizedEmails.filter((e) => !foundEmails.has(e))
      return jsonResponse(400, { error: `No se encontraron estudiantes con estos emails: ${missing.join(', ')}` })
    }

    allowedUserIds = students.map((s) => String(s._id))
  }

  const material = {
    title: title.trim(),
    description: description?.trim() || '',
    url: url.trim(),
    category: category?.trim() || 'General',
    visibility: vis,
    allowedUserIds,
    createdAt: new Date(),
    createdBy: user.id,
  }

  const result = await db.collection('materials').insertOne(material)
  material._id = result.insertedId

  return jsonResponse(201, { material })
}

async function deleteMaterial(event, db) {
  const { error } = requireAuth(event, ['admin'])
  if (error) return error

  const params = event.queryStringParameters || {}
  const body = event.body ? JSON.parse(event.body) : {}
  const id = params.id || body.id

  if (!id || !ObjectId.isValid(id)) {
    return jsonResponse(400, { error: 'Falta id del material' })
  }

  const result = await db.collection('materials').deleteOne({ _id: new ObjectId(id) })
  if (result.deletedCount === 0) return jsonResponse(404, { error: 'Material no encontrado' })

  return jsonResponse(200, { success: true })
}

export const handler = async (event) => {
  try {
    const db = await getDb()
    switch (event.httpMethod) {
      case 'GET':
        return await listMaterials(event, db)
      case 'POST':
        return await createMaterial(event, db)
      case 'DELETE':
        return await deleteMaterial(event, db)
      default:
        return jsonResponse(405, { error: 'Method not allowed' })
    }
  } catch (err) {
    console.error('materials error:', err)
    return jsonResponse(500, { error: 'Error al procesar el material' })
  }
}
