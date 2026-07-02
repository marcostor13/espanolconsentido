import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const TOKEN_EXPIRY = '7d'

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET no está configurada')
  return secret
}

export function signToken(user) {
  return jwt.sign(
    { sub: String(user._id), email: user.email, role: user.role, name: user.name },
    getSecret(),
    { expiresIn: TOKEN_EXPIRY },
  )
}

export function verifyToken(token) {
  return jwt.verify(token, getSecret())
}

export function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}

const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

export function generateTempPassword(length = 10) {
  let pwd = ''
  for (let i = 0; i < length; i++) {
    pwd += TEMP_PASSWORD_CHARS[Math.floor(Math.random() * TEMP_PASSWORD_CHARS.length)]
  }
  return pwd
}

/**
 * Busca un estudiante por email; si no existe, crea la cuenta con una
 * contraseña temporal y marca mustChangePassword para forzar el cambio
 * en el primer login. Usado cuando una compra (booking público o
 * matrícula creada por el admin) debe generar acceso a la plataforma.
 */
export async function findOrCreateStudent(db, { email, name }) {
  const normalizedEmail = email.trim().toLowerCase()
  const existing = await db.collection('users').findOne({ email: normalizedEmail })
  if (existing) {
    return { user: existing, isNew: false, tempPassword: null }
  }

  const tempPassword = generateTempPassword()
  const passwordHash = await hashPassword(tempPassword)
  const user = {
    email: normalizedEmail,
    passwordHash,
    name: name?.trim() || normalizedEmail,
    role: 'student',
    active: true,
    mustChangePassword: true,
    createdAt: new Date(),
  }

  const result = await db.collection('users').insertOne(user)
  user._id = result.insertedId

  return { user, isNew: true, tempPassword }
}

export function serializeUserForClient(user) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    mustChangePassword: Boolean(user.mustChangePassword),
  }
}

export function jsonResponse(statusCode, data, extraHeaders = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(data),
  }
}

/**
 * Extrae y valida el JWT del header Authorization. Si se pasan roles,
 * exige que el usuario tenga uno de esos roles.
 * Devuelve { user } si es válido, o { error: <netlify response> } si no.
 */
export function requireAuth(event, roles) {
  const header = event.headers?.authorization || event.headers?.Authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return { error: jsonResponse(401, { error: 'No autenticado' }) }
  }

  let payload
  try {
    payload = verifyToken(token)
  } catch {
    return { error: jsonResponse(401, { error: 'Token inválido o expirado' }) }
  }

  if (roles && roles.length > 0 && !roles.includes(payload.role)) {
    return { error: jsonResponse(403, { error: 'No autorizado para esta acción' }) }
  }

  return { user: { id: payload.sub, email: payload.email, role: payload.role, name: payload.name } }
}
