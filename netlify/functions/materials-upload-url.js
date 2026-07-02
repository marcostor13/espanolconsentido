import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { requireAuth, jsonResponse } from './_shared/auth.js'
import { logError } from './_shared/errorLog.js'

const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
])

const MAX_FILE_NAME_LENGTH = 120
const PRESIGNED_URL_EXPIRY_SECONDS = 300

function sanitizeFileName(name) {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(-MAX_FILE_NAME_LENGTH)
}

function buildPublicUrl(bucket, region, key) {
  const base = process.env.S3_PUBLIC_URL_BASE?.trim()
  if (base) return `${base.replace(/\/$/, '')}/${key}`
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const { error } = requireAuth(event, ['admin'])
  if (error) return error

  try {
    const body = JSON.parse(event.body || '{}')
    const fileName = body.fileName?.trim()
    const contentType = body.contentType?.trim()

    if (!fileName || !contentType) {
      return jsonResponse(400, { error: 'Se requiere fileName y contentType' })
    }
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return jsonResponse(400, { error: 'Tipo de archivo no permitido' })
    }

    // Nombres con sufijo "2": Netlify reserva AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
    // AWS_REGION y S3_BUCKET_NAME para su propio runtime de Lambda, así que no se
    // pueden usar esos nombres tal cual para las credenciales propias del bucket.
    const bucket = process.env.S3_BUCKET_NAME2
    const region = process.env.AWS_REGION2
    if (!bucket || !region || !process.env.AWS_ACCESS_KEY_ID2 || !process.env.AWS_SECRET_ACCESS_KEY2) {
      return jsonResponse(500, { error: 'El almacenamiento S3 no está configurado en el servidor' })
    }

    const key = `materials/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizeFileName(fileName)}`

    const client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID2,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY2,
      },
    })

    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType })
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS })
    const publicUrl = buildPublicUrl(bucket, region, key)

    return jsonResponse(200, { uploadUrl, publicUrl, key, expiresIn: PRESIGNED_URL_EXPIRY_SECONDS })
  } catch (err) {
    console.error('materials-upload-url error:', err)
    await logError('materials-upload-url', err, { event })
    return jsonResponse(500, { error: 'Error al generar la URL de subida' })
  }
}
