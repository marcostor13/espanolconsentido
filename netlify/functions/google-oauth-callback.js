// Retorno del consentimiento de Google. Es una función propia (y no solo un
// redirect de netlify.toml a google-oauth) para que la URL directa
// /.netlify/functions/google-oauth-callback funcione siempre, sin depender de
// las reglas de redirección del sitio: Google exige que la redirect URI
// registrada responda tal cual, y un 404 aquí rompe toda la conexión.
export { handler } from './google-oauth.js'
