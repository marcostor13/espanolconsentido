import { getDb } from './_shared/mongodb.js'

const INITIAL_CODES = [
  { code: 'WELCOME', discountPercent: 20 },
]

export const handler = async () => {
  try {
    const db = await getDb()
    const collection = db.collection('promocodes')

    for (const promo of INITIAL_CODES) {
      await collection.updateOne(
        { code: promo.code },
        { $set: { ...promo, updatedAt: new Date() } },
        { upsert: true }
      )
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Códigos promocionales inicializados',
        codes: INITIAL_CODES,
      }),
    }
  } catch (err) {
    console.error('seed-promocodes error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
