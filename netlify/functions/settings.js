import { getDb } from './_shared/mongodb.js'
import { requireAuth, jsonResponse } from './_shared/auth.js'
import { getSettings, updateSettings } from './_shared/settings.js'
import { logError } from './_shared/errorLog.js'

const VALID_PACKAGE_IDS = new Set(['trial', 'inicio', 'progreso', 'pro', 'individual'])

export const handler = async (event) => {
  try {
    const db = await getDb()

    // GET es público: el checkout del landing necesita leer los enlaces de pago
    // de Wise configurados por el admin sin requerir sesión.
    if (event.httpMethod === 'GET') {
      const settings = await getSettings(db)
      return jsonResponse(200, { settings })
    }

    if (event.httpMethod === 'PUT') {
      const { error } = requireAuth(event, ['admin'])
      if (error) return error

      const body = JSON.parse(event.body || '{}')
      const updates = {}

      if (body.groupClassCapacity !== undefined) {
        const groupClassCapacity = Number(body.groupClassCapacity)
        if (!Number.isInteger(groupClassCapacity) || groupClassCapacity < 2) {
          return jsonResponse(400, { error: 'La capacidad de clases grupales debe ser un entero mayor o igual a 2' })
        }
        updates.groupClassCapacity = groupClassCapacity
      }

      if (body.wiseLinks !== undefined) {
        if (typeof body.wiseLinks !== 'object' || body.wiseLinks === null || Array.isArray(body.wiseLinks)) {
          return jsonResponse(400, { error: 'wiseLinks debe ser un objeto { paqueteId: url }' })
        }
        const wiseLinks = {}
        for (const [key, value] of Object.entries(body.wiseLinks)) {
          if (!VALID_PACKAGE_IDS.has(key)) {
            return jsonResponse(400, { error: `Paquete no reconocido: ${key}` })
          }
          const url = String(value || '').trim()
          if (url && !/^https?:\/\//i.test(url)) {
            return jsonResponse(400, { error: `El enlace de Wise para "${key}" debe ser una URL válida (http/https)` })
          }
          wiseLinks[key] = url
        }
        updates.wiseLinks = wiseLinks
      }

      if (Object.keys(updates).length === 0) {
        return jsonResponse(400, { error: 'Nada para actualizar' })
      }

      const settings = await updateSettings(db, updates)
      return jsonResponse(200, { settings })
    }

    return jsonResponse(405, { error: 'Method not allowed' })
  } catch (err) {
    console.error('settings error:', err)
    await logError('settings', err, { event })
    return jsonResponse(500, { error: 'Error al procesar la configuración' })
  }
}
