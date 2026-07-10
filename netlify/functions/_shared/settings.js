const SETTINGS_ID = 'app'

// Precios por defecto de cada servicio/paquete. Se pueden sobreescribir desde
// /admin/configuraciones (settings.packagePrices) y son la única fuente de
// verdad del precio en el backend: el frontend solo los muestra.
export const DEFAULT_PACKAGE_PRICES = {
  trial: 10,
  inicio: 76,
  progreso: 144,
  pro: 204,
  individual: 20,
  group: 10,
}

const DEFAULTS = {
  groupClassCapacity: 4,
  wiseLinks: {},
  global66Links: {},
  packagePrices: DEFAULT_PACKAGE_PRICES,
  // Horas mínimas de anticipación para poder reservar una clase.
  minBookingNoticeHours: 1,
  // Correo donde llegan todas las notificaciones de administración
  // (nuevas reservas, comprobantes de Wise, etc.). Si está vacío se usa
  // ADMIN_NOTIFY_EMAIL del entorno.
  adminNotifyEmail: '',
}

export async function getSettings(db) {
  const doc = await db.collection('settings').findOne({ _id: SETTINGS_ID })
  const settings = { ...DEFAULTS, ...(doc || {}) }
  settings.packagePrices = { ...DEFAULT_PACKAGE_PRICES, ...(doc?.packagePrices || {}) }
  return settings
}

export async function updateSettings(db, updates) {
  await db
    .collection('settings')
    .updateOne({ _id: SETTINGS_ID }, { $set: { ...updates, updatedAt: new Date() } }, { upsert: true })
  return getSettings(db)
}

// Precio vigente de un servicio. Devuelve null para ids desconocidos, para
// que el caller decida cómo fallar.
export function getServicePrice(settings, serviceId) {
  const price = settings.packagePrices?.[serviceId]
  return typeof price === 'number' && price >= 0 ? price : null
}

// El crédito de la clase de prueba equivale a su precio configurado.
export function getTrialCreditAmount(settings) {
  return getServicePrice(settings, 'trial') ?? 10
}

// Correo de administración efectivo (configurable, con fallback al entorno).
export function getAdminNotifyEmail(settings) {
  return settings.adminNotifyEmail?.trim() || process.env.ADMIN_NOTIFY_EMAIL || 'marcostor13@gmail.com'
}

// Campos que puede ver cualquier visitante del sitio (el checkout público
// necesita precios, enlaces de Wise y la anticipación mínima). Todo lo demás
// (correo admin, tokens de Google) solo se expone al admin autenticado.
export function publicSettings(settings) {
  return {
    groupClassCapacity: settings.groupClassCapacity,
    wiseLinks: settings.wiseLinks || {},
    global66Links: settings.global66Links || {},
    packagePrices: settings.packagePrices,
    minBookingNoticeHours: settings.minBookingNoticeHours,
  }
}

export function adminSettings(settings) {
  return {
    ...publicSettings(settings),
    adminNotifyEmail: settings.adminNotifyEmail || '',
    googleConnected: Boolean(settings.googleTokens?.refresh_token),
    googleAccountEmail: settings.googleTokens?.accountEmail || null,
  }
}
