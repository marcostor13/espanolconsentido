import { getDb } from './mongodb.js'

let indexEnsured = false

async function ensureIndex(db) {
  if (indexEnsured) return
  indexEnsured = true
  try {
    // Se guardan los errores por 60 días; después se limpian solos.
    await db.collection('errorLogs').createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 })
  } catch (err) {
    console.error('errorLog: failed to ensure TTL index', err)
  }
}

/**
 * Registra un error en la colección errorLogs para poder revisarlo desde
 * /admin/errores. Nunca lanza: si falla el guardado, solo hace console.error,
 * para no romper la respuesta original de la función que lo llamó.
 */
export async function logError(source, err, { event, level = 'error' } = {}) {
  try {
    const db = await getDb()
    await ensureIndex(db)
    await db.collection('errorLogs').insertOne({
      source,
      level,
      message: err?.message || String(err),
      stack: err?.stack || null,
      method: event?.httpMethod || null,
      path: event?.path || event?.rawUrl || null,
      createdAt: new Date(),
    })
  } catch (logErr) {
    console.error('errorLog: failed to persist error log', logErr)
  }
}
