import { getDb } from './_shared/mongodb.js'
import { jsonResponse, generateTempPassword, hashPassword } from './_shared/auth.js'
import { sendPasswordResetEmail } from './_shared/email.js'

// Respuesta genérica para no revelar si el email existe en el sistema.
const GENERIC_MESSAGE = 'Si existe una cuenta con ese email, enviamos instrucciones para acceder.'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const email = body.email?.trim().toLowerCase()
    if (!email) {
      return jsonResponse(400, { error: 'El email es obligatorio' })
    }

    const db = await getDb()
    const user = await db.collection('users').findOne({ email })

    if (user && user.active !== false) {
      const tempPassword = generateTempPassword()
      const passwordHash = await hashPassword(tempPassword)
      await db
        .collection('users')
        .updateOne({ _id: user._id }, { $set: { passwordHash, mustChangePassword: true } })

      try {
        await sendPasswordResetEmail({ toName: user.name, toEmail: user.email, tempPassword })
      } catch (err) {
        console.error('auth-forgot-password: failed to send email', err)
      }
    }

    return jsonResponse(200, { message: GENERIC_MESSAGE })
  } catch (err) {
    console.error('auth-forgot-password error:', err)
    return jsonResponse(500, { error: 'Error al procesar la solicitud' })
  }
}
