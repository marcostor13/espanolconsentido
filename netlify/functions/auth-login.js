import { getDb } from './_shared/mongodb.js'
import { comparePassword, signToken, jsonResponse, serializeUserForClient } from './_shared/auth.js'
import { logError } from './_shared/errorLog.js'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const email = body.email?.trim().toLowerCase()
    const password = body.password

    if (!email || !password) {
      return jsonResponse(400, { error: 'Email y contraseña son obligatorios' })
    }

    const db = await getDb()
    const user = await db.collection('users').findOne({ email })

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return jsonResponse(401, { error: 'Credenciales inválidas' })
    }
    if (user.active === false) {
      return jsonResponse(403, { error: 'Esta cuenta está desactivada' })
    }

    const token = signToken(user)
    return jsonResponse(200, {
      token,
      user: serializeUserForClient(user),
    })
  } catch (err) {
    console.error('auth-login error:', err)
    await logError('auth-login', err, { event })
    return jsonResponse(500, { error: 'Error al iniciar sesión' })
  }
}
