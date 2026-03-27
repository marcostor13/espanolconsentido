import { MongoClient } from 'mongodb'
import dns from 'node:dns'

let cachedClient = null
let dnsServersApplied = false

/**
 * En algunos entornos Windows, Node puede fallar al resolver SRV de mongodb+srv.
 * Si NODE_DNS_SERVERS existe, fuerza los DNS para esta ejecución.
 */
function applyOptionalNodeDnsServers() {
  if (dnsServersApplied) return

  const raw = process.env.NODE_DNS_SERVERS?.trim()
  if (!raw) return

  const servers = raw.split(/[\s,]+/).filter(Boolean)
  if (servers.length === 0) return

  dns.setServers(servers)
  dnsServersApplied = true
}

export async function getMongoClient() {
  if (cachedClient) return cachedClient

  applyOptionalNodeDnsServers()

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI no está configurada')
  cachedClient = new MongoClient(uri)
  await cachedClient.connect()
  return cachedClient
}

export async function getDb() {
  const client = await getMongoClient()
  return client.db()
}
