import { google } from 'googleapis'
import { getSettings } from './settings.js'

const CLASS_TIMEZONE = process.env.CLASS_TIMEZONE || 'America/Lima'

export function getSiteUrl() {
  return (process.env.SITE_URL || 'https://espanolconsentido.com').replace(/\/$/, '')
}

// URL de retorno del consentimiento de Google: EXACTAMENTE la misma ruta
// /api/google-oauth que usa el panel para iniciar la conexión. Si el flujo
// arranca es porque esa ruta responde desde el dominio del usuario (aunque
// haya proxies o DNS peculiares delante), así que el retorno no puede caer en
// un 404. Sin query string (Google exige coincidencia exacta); el handler
// reconoce el callback por el parámetro `code` que añade Google.
export function getOAuthRedirectUri() {
  return `${getSiteUrl()}/api/google-oauth`
}

// Cliente OAuth de la cuenta de Google de la profesora (conectada desde
// /admin/configuraciones). Requiere GOOGLE_OAUTH_CLIENT_ID/SECRET en el entorno.
export function getOAuthClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return new google.auth.OAuth2(clientId, clientSecret, getOAuthRedirectUri())
}

// Preferimos la conexión OAuth (única forma de generar links de Google Meet);
// si no está conectada, se usa la cuenta de servicio como antes (sin Meet).
async function getCalendarAuth(db) {
  if (db) {
    const settings = await getSettings(db)
    const tokens = settings.googleTokens
    if (tokens?.refresh_token) {
      const client = getOAuthClient()
      if (client) {
        // googleapis renueva el access token automáticamente usando el
        // refresh token en cada llamada, así que la conexión no caduca
        // mientras no se revoque el acceso desde la cuenta de Google.
        client.setCredentials({ refresh_token: tokens.refresh_token })
        return { auth: client, calendarId: 'primary', canCreateMeet: true }
      }
    }
  }

  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_CALENDAR_ID) {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    })
    return { auth, calendarId: process.env.GOOGLE_CALENDAR_ID, canCreateMeet: false }
  }

  throw new Error('Configuración de Google Calendar incompleta')
}

// Extrae el enlace de Google Meet de la respuesta de la API de Calendar.
// Preferimos `hangoutLink`, pero cuando la sala se acaba de crear ese campo
// puede venir vacío aunque el punto de entrada de vídeo ya exista dentro de
// `conferenceData.entryPoints`, así que lo usamos como respaldo.
export function extractMeetLink(data) {
  if (!data) return null
  if (data.hangoutLink) return data.hangoutLink
  const entryPoints = data.conferenceData?.entryPoints || []
  const video = entryPoints.find((e) => e.entryPointType === 'video')
  return video?.uri || null
}

/**
 * Lee un evento ya creado y devuelve su enlace de Google Meet (o null).
 * Se usa como respaldo cuando la reserva no guardó el link en su momento
 * (p. ej. porque la sala aún se estaba creando al confirmar el pago).
 */
export async function getEventMeetLink(db, eventId) {
  if (!eventId) return null
  const { auth, calendarId } = await getCalendarAuth(db)
  const calendar = google.calendar({ version: 'v3', auth })
  const res = await calendar.events.get({
    calendarId,
    eventId,
    conferenceDataVersion: 1,
  })
  return extractMeetLink(res.data)
}

/**
 * Crea el evento en el calendario y, si la cuenta de Google está conectada
 * por OAuth, genera también la sala de Google Meet e invita al estudiante.
 * Devuelve { id, meetLink } (meetLink es null si no se pudo generar).
 */
export async function createCalendarEvent(db, { summary, description, start, end, attendeeEmail }) {
  const { auth, calendarId, canCreateMeet } = await getCalendarAuth(db)
  const calendar = google.calendar({ version: 'v3', auth })

  const event = {
    summary,
    description: description || '',
    start: { dateTime: start, timeZone: CLASS_TIMEZONE },
    end: { dateTime: end, timeZone: CLASS_TIMEZONE },
    eventType: 'default',
  }

  // Las cuentas de servicio no pueden invitar asistentes ni crear salas de
  // Meet sin delegación de dominio; solo lo intentamos con OAuth.
  if (canCreateMeet) {
    if (attendeeEmail) event.attendees = [{ email: attendeeEmail }]
    event.conferenceData = {
      createRequest: {
        requestId: `ecs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    }
  }

  const res = await calendar.events.insert({
    calendarId,
    requestBody: event,
    sendUpdates: canCreateMeet && attendeeEmail ? 'all' : 'none',
    conferenceDataVersion: canCreateMeet ? 1 : 0,
  })

  const eventId = res.data?.id || null
  let meetLink = extractMeetLink(res.data)

  // La sala de Meet se aprovisiona de forma asíncrona: es habitual que el
  // `insert` responda con el `createRequest` todavía en estado "pending" y sin
  // `hangoutLink`. Si pedimos una sala pero no llegó el enlace, releemos el
  // evento un par de veces hasta que Google lo resuelva; de lo contrario el
  // link nunca llegaría a los correos de confirmación ni al recordatorio.
  if (canCreateMeet && !meetLink && eventId) {
    for (let attempt = 0; attempt < 3 && !meetLink; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      try {
        const got = await calendar.events.get({
          calendarId,
          eventId,
          conferenceDataVersion: 1,
        })
        meetLink = extractMeetLink(got.data)
      } catch (err) {
        console.error('createCalendarEvent: retry events.get failed', err)
        break
      }
    }
  }

  return { id: eventId, meetLink }
}
