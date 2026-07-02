import { ObjectId } from 'mongodb'
import { getDb } from './_shared/mongodb.js'
import { requireAuth, jsonResponse, hashPassword, comparePassword } from './_shared/auth.js'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const { user, error } = requireAuth(event)
  if (error) return error

  try {
    const body = JSON.parse(event.body || '{}')
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return jsonResponse(400, { error: 'Se requiere la contraseña actual y la nueva' })
    }
    if (newPassword.length < 8) {
      return jsonResponse(400, { error: 'La nueva contraseña debe tener al menos 8 caracteres' })
    }

    const db = await getDb()
    const dbUser = await db.collection('users').findOne({ _id: new ObjectId(user.id) })
    if (!dbUser) return jsonResponse(404, { error: 'Usuario no encontrado' })

    const valid = await comparePassword(currentPassword, dbUser.passwordHash)
    if (!valid) return jsonResponse(401, { error: 'La contraseña actual no es correcta' })

    const passwordHash = await hashPassword(newPassword)
    await db
      .collection('users')
      .updateOne({ _id: dbUser._id }, { $set: { passwordHash }, $unset: { mustChangePassword: '' } })

    return jsonResponse(200, { success: true })
  } catch (err) {
    console.error('auth-change-password error:', err)
    return jsonResponse(500, { error: 'Error al cambiar la contraseña' })
  }
}
