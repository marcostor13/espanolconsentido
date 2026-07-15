import jwt from 'jsonwebtoken'
import { google } from 'googleapis'
import { getDb } from './_shared/mongodb.js'
import { requireAuth, jsonResponse } from './_shared/auth.js'
import { getSettings, updateSettings } from './_shared/settings.js'
import { getOAuthClient, getSiteUrl } from './_shared/google-calendar.js'
import { logError } from './_shared/errorLog.js'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  // Lectura de todos los calendarios de la profesora (principal + secundarios)
  // para bloquear también los eventos que otros agendan en cualquiera de ellos.
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
]

// Conexión de la cuenta de Google de la profesora vía OAuth para poder crear
// eventos con link de Google Meet en SU calendario:
//  - action=url        (admin) → devuelve la URL de consentimiento de Google
//  - action=callback   (redirect de Google) → guarda los tokens en settings
//  - action=disconnect (admin, POST) → borra los tokens guardados
// El refresh token se guarda en Mongo y googleapis lo usa para renovar el
// access token automáticamente en cada llamada, así que nunca "vence" salvo
// que se revoque el acceso desde la cuenta de Google.
export const handler = async (event) => {
  const params = event.queryStringParameters || {}
  // El retorno de Google llega a /api/google-oauth-callback (sin ?action=,
  // porque Google exige una redirect URI sin query string); se reconoce por
  // el `code` que Google añade a la URL.
  const action = params.action || (params.code || params.error ? 'callback' : null)

  try {
    const client = getOAuthClient()
    if (!client) {
      return jsonResponse(500, {
        error: 'GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET no están configurados en el servidor',
      })
    }

    const db = await getDb()

    if (action === 'url' && event.httpMethod === 'GET') {
      const { error } = requireAuth(event, ['admin'])
      if (error) return error

      // El state es un JWT corto: en el callback (donde no hay header de
      // sesión porque llega por redirect de Google) valida que el flujo lo
      // inició un admin real y no un tercero.
      const state = jwt.sign({ purpose: 'google-oauth' }, process.env.JWT_SECRET, { expiresIn: '15m' })
      const url = client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: SCOPES,
        state,
      })
      return jsonResponse(200, { url })
    }

    if (action === 'callback' && event.httpMethod === 'GET') {
      const redirectTo = (ok, reason) =>
        ({
          statusCode: 302,
          headers: {
            Location: `${getSiteUrl()}/admin/configuraciones?google=${ok ? 'connected' : `error${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`}`,
          },
          body: '',
        })

      try {
        jwt.verify(params.state || '', process.env.JWT_SECRET)
      } catch {
        return redirectTo(false, 'state')
      }
      if (!params.code) return redirectTo(false, 'code')

      // Si Google rechaza el intercambio (Client ID/Secret mal configurados,
      // código vencido, etc.) se vuelve al panel con el motivo, en vez de
      // dejar al usuario varado en esta URL con un error crudo.
      let tokens
      try {
        ;({ tokens } = await client.getToken(params.code))
      } catch (err) {
        console.error('google-oauth: token exchange failed', err?.response?.data || err)
        await logError('google-oauth: token exchange', err, { level: 'warning' })
        return redirectTo(false, 'token_exchange')
      }

      // Si Google no devuelve refresh_token (p. ej. reconexión sin prompt=
      // consent), conservamos el que ya teníamos guardado.
      const settings = await getSettings(db)
      const refreshToken = tokens.refresh_token || settings.googleTokens?.refresh_token
      if (!refreshToken) return redirectTo(false, 'no_refresh_token')

      let accountEmail = settings.googleTokens?.accountEmail || null
      try {
        client.setCredentials(tokens)
        const oauth2 = google.oauth2({ version: 'v2', auth: client })
        const { data } = await oauth2.userinfo.get()
        accountEmail = data.email || accountEmail
      } catch (err) {
        console.error('google-oauth: could not fetch account email', err)
      }

      await updateSettings(db, {
        googleTokens: {
          refresh_token: refreshToken,
          accountEmail,
          connectedAt: new Date(),
        },
      })

      return redirectTo(true)
    }

    if (action === 'disconnect' && event.httpMethod === 'POST') {
      const { error } = requireAuth(event, ['admin'])
      if (error) return error
      await updateSettings(db, { googleTokens: null })
      return jsonResponse(200, { success: true })
    }

    return jsonResponse(400, { error: 'Acción no reconocida' })
  } catch (err) {
    console.error('google-oauth error:', err)
    await logError('google-oauth', err, { event })
    return jsonResponse(500, { error: 'Error en la conexión con Google' })
  }
}
