/**
 * Script para insertar códigos promocionales de ejemplo en MongoDB.
 * Ejecutar: node --env-file=.env scripts/seed-promocodes.js
 * O con MONGODB_URI en el entorno.
 */
import { MongoClient } from 'mongodb'

const INITIAL_CODES = [
  { code: 'WELCOME', discountPercent: 20 },
]

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('Error: MONGODB_URI no está configurada. Usa --env-file=.env o exporta la variable.')
    process.exit(1)
  }

  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db()
    const collection = db.collection('promocodes')

    for (const promo of INITIAL_CODES) {
      await collection.updateOne(
        { code: promo.code },
        { $set: { ...promo, updatedAt: new Date() } },
        { upsert: true }
      )
      console.log(`✓ Código "${promo.code}" (${promo.discountPercent}% descuento) guardado`)
    }

    console.log('\nCódigos promocionales inicializados correctamente.')
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  } finally {
    await client.close()
  }
}

seed()
