import { ObjectId } from 'mongodb'
import { getDb } from './_shared/mongodb.js'
import { requireAuth, jsonResponse, hashPassword, generateTempPassword } from './_shared/auth.js'
import { sendPasswordResetEmail } from './_shared/email.js'

function serializeUser(u) {
  return {
    _id: u._id,
    email: u.email,
    name: u.name,
    role: u.role,
    active: u.active !== false,
    mustChangePassword: Boolean(u.mustChangePassword),
    createdAt: u.createdAt,
  }
}

async function listUsers(event, db) {
  const { error } = requireAuth(event, ['admin'])
  if (error) return error

  const params = event.queryStringParameters || {}
  const filter = {}
  if (params.role) filter.role = params.role
  if (params.search?.trim()) {
    const re = new RegExp(params.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ email: re }, { name: re }]
  }

  const users = await db.collection('users').find(filter).sort({ createdAt: -1 }).toArray()
  return jsonResponse(200, { users: users.map(serializeUser) })
}

async function createUser(event, db) {
  const { error } = requireAuth(event, ['admin'])
  if (error) return error

  const body = JSON.parse(event.body || '{}')
  const email = body.email?.trim().toLowerCase()
  const password = body.password
  const name = body.name?.trim()
  const role = body.role === 'admin' ? 'admin' : 'student'

  if (!email || !password || !name) {
    return jsonResponse(400, { error: 'Nombre, email y contraseña son obligatorios' })
  }
  if (password.length < 8) {
    return jsonResponse(400, { error: 'La contraseña debe tener al menos 8 caracteres' })
  }

  const existing = await db.collection('users').findOne({ email })
  if (existing) return jsonResponse(409, { error: 'Ya existe una cuenta con ese email' })

  const passwordHash = await hashPassword(password)
  const user = { email, passwordHash, name, role, active: true, createdAt: new Date() }
  const result = await db.collection('users').insertOne(user)
  user._id = result.insertedId

  return jsonResponse(201, { user: serializeUser(user) })
}

async function updateUser(event, db) {
  const { user: actor, error } = requireAuth(event, ['admin'])
  if (error) return error

  const body = JSON.parse(event.body || '{}')
  const { id, active, role, name, resetPassword } = body
  if (!id || !ObjectId.isValid(id)) {
    return jsonResponse(400, { error: 'Falta id de usuario' })
  }
  if (String(actor.id) === String(id) && (active === false || role === 'student')) {
    return jsonResponse(400, { error: 'No puedes desactivarte o quitarte el rol de admin a ti mismo' })
  }

  const update = {}
  if (typeof active === 'boolean') update.active = active
  if (role === 'admin' || role === 'student') update.role = role
  if (name?.trim()) update.name = name.trim()

  let tempPassword = null
  if (resetPassword) {
    tempPassword = generateTempPassword()
    update.passwordHash = await hashPassword(tempPassword)
    update.mustChangePassword = true
  }

  if (Object.keys(update).length === 0) {
    return jsonResponse(400, { error: 'Nada para actualizar' })
  }

  const result = await db
    .collection('users')
    .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: update }, { returnDocument: 'after' })

  if (!result) return jsonResponse(404, { error: 'Usuario no encontrado' })

  if (tempPassword) {
    try {
      await sendPasswordResetEmail({ toName: result.name, toEmail: result.email, tempPassword })
    } catch (err) {
      console.error('admin-users: failed to send password reset email', err)
    }
  }

  return jsonResponse(200, { user: serializeUser(result) })
}

export const handler = async (event) => {
  try {
    const db = await getDb()
    switch (event.httpMethod) {
      case 'GET':
        return await listUsers(event, db)
      case 'POST':
        return await createUser(event, db)
      case 'PATCH':
        return await updateUser(event, db)
      default:
        return jsonResponse(405, { error: 'Method not allowed' })
    }
  } catch (err) {
    console.error('admin-users error:', err)
    return jsonResponse(500, { error: 'Error al procesar usuarios' })
  }
}
