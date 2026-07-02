import { getDb } from './_shared/mongodb.js'
import { hashPassword, signToken, jsonResponse, serializeUserForClient } from './_shared/auth.js'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const name = body.name?.trim()

    if (!email || !password || !name) {
      return jsonResponse(400, { error: 'Nombre, email y contraseña son obligatorios' })
    }
    if (password.length < 8) {
      return jsonResponse(400, { error: 'La contraseña debe tener al menos 8 caracteres' })
    }

    const db = await getDb()
    const users = db.collection('users')

    const existing = await users.findOne({ email })
    if (existing) {
      return jsonResponse(409, { error: 'Ya existe una cuenta con ese email' })
    }

    const passwordHash = await hashPassword(password)
    const user = {
      email,
      passwordHash,
      name,
      role: 'student',
      active: true,
      createdAt: new Date(),
    }

    const result = await users.insertOne(user)
    user._id = result.insertedId

    const token = signToken(user)
    return jsonResponse(201, {
      token,
      user: serializeUserForClient(user),
    })
  } catch (err) {
    console.error('auth-register error:', err)
    return jsonResponse(500, { error: 'Error al registrar la cuenta' })
  }
}
