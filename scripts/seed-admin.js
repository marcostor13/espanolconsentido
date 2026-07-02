/**
 * Script para crear (o actualizar) el primer usuario administrador.
 * Ejecutar: node --env-file=.env scripts/seed-admin.js
 * Usa SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD y SEED_ADMIN_NAME del .env,
 * o los recibe como argumentos: node scripts/seed-admin.js email password "Nombre"
 */
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import dns from 'node:dns'

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('Error: MONGODB_URI no está configurada. Usa --env-file=.env o exporta la variable.')
    process.exit(1)
  }

  // En algunos entornos Windows, Node falla al resolver SRV de mongodb+srv.
  const dnsServers = process.env.NODE_DNS_SERVERS?.trim()
  if (dnsServers) {
    dns.setServers(dnsServers.split(/[\s,]+/).filter(Boolean))
  }

  const [, , argEmail, argPassword, argName] = process.argv
  const email = (argEmail || process.env.SEED_ADMIN_EMAIL)?.trim().toLowerCase()
  const password = argPassword || process.env.SEED_ADMIN_PASSWORD
  const name = argName || process.env.SEED_ADMIN_NAME || 'Administrador'

  if (!email || !password) {
    console.error('Error: falta email o contraseña. Define SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD o pásalos como argumentos.')
    process.exit(1)
  }
  if (password.length < 8) {
    console.error('Error: la contraseña debe tener al menos 8 caracteres.')
    process.exit(1)
  }

  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db()
    const users = db.collection('users')

    const passwordHash = await bcrypt.hash(password, 10)
    await users.updateOne(
      { email },
      {
        $set: { email, passwordHash, name, role: 'admin', active: true },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    )

    console.log(`✓ Usuario admin "${email}" creado/actualizado correctamente.`)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  } finally {
    await client.close()
  }
}

seed()
