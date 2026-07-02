import { ObjectId } from 'mongodb'
import { getDb } from './_shared/mongodb.js'
import { requireAuth, jsonResponse, serializeUserForClient } from './_shared/auth.js'

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const { user, error } = requireAuth(event)
  if (error) return error

  try {
    const db = await getDb()
    const dbUser = await db.collection('users').findOne({ _id: new ObjectId(user.id) })

    if (!dbUser || dbUser.active === false) {
      return jsonResponse(401, { error: 'Cuenta no disponible' })
    }

    return jsonResponse(200, {
      user: serializeUserForClient(dbUser),
    })
  } catch (err) {
    console.error('auth-me error:', err)
    return jsonResponse(500, { error: 'Error al obtener el usuario' })
  }
}
