import { getDb } from './_shared/mongodb.js'
import { requireAuth, jsonResponse } from './_shared/auth.js'
import { getSettings, updateSettings, publicSettings, adminSettings, DEFAULT_PACKAGE_PRICES } from './_shared/settings.js'
import { logError } from './_shared/errorLog.js'

const VALID_PACKAGE_IDS = new Set(Object.keys(DEFAULT_PACKAGE_PRICES))

function tryGetAdmin(event) {
  const header = event.headers?.authorization || event.headers?.Authorization
  if (!header) return false
  const { user } = requireAuth(event, ['admin'])
  return Boolean(user)
}

export const handler = async (event) => {
  try {
    const db = await getDb()

    // GET es público: el checkout del landing necesita leer precios, enlaces
    // de Wise y anticipación mínima sin sesión. El admin autenticado recibe
    // además el correo de administración y el estado de la conexión Google.
    if (event.httpMethod === 'GET') {
      const settings = await getSettings(db)
      return jsonResponse(200, { settings: tryGetAdmin(event) ? adminSettings(settings) : publicSettings(settings) })
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

      if (body.packagePrices !== undefined) {
        if (typeof body.packagePrices !== 'object' || body.packagePrices === null || Array.isArray(body.packagePrices)) {
          return jsonResponse(400, { error: 'packagePrices debe ser un objeto { paqueteId: precio }' })
        }
        const packagePrices = {}
        for (const [key, value] of Object.entries(body.packagePrices)) {
          if (!VALID_PACKAGE_IDS.has(key)) {
            return jsonResponse(400, { error: `Paquete no reconocido: ${key}` })
          }
          const price = Number(value)
          if (!Number.isFinite(price) || price < 0) {
            return jsonResponse(400, { error: `El precio de "${key}" debe ser un número mayor o igual a 0` })
          }
          packagePrices[key] = Math.round(price * 100) / 100
        }
        updates.packagePrices = { ...DEFAULT_PACKAGE_PRICES, ...packagePrices }
      }

      if (body.minBookingNoticeHours !== undefined) {
        const hours = Number(body.minBookingNoticeHours)
        if (!Number.isFinite(hours) || hours < 0 || hours > 168) {
          return jsonResponse(400, { error: 'La anticipación mínima debe ser un número de horas entre 0 y 168' })
        }
        updates.minBookingNoticeHours = hours
      }

      if (body.adminNotifyEmail !== undefined) {
        const email = String(body.adminNotifyEmail || '').trim()
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return jsonResponse(400, { error: 'El correo de administración no es válido' })
        }
        updates.adminNotifyEmail = email
      }

      if (Object.keys(updates).length === 0) {
        return jsonResponse(400, { error: 'Nada para actualizar' })
      }

      const settings = await updateSettings(db, updates)
      return jsonResponse(200, { settings: adminSettings(settings) })
    }

    return jsonResponse(405, { error: 'Method not allowed' })
  } catch (err) {
    console.error('settings error:', err)
    await logError('settings', err, { event })
    return jsonResponse(500, { error: 'Error al procesar la configuración' })
  }
}
