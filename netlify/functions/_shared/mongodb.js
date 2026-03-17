import { MongoClient } from 'mongodb'

let cachedClient = null

export async function getMongoClient() {
  if (cachedClient) return cachedClient
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
