# Configuración del sistema de reservas

## Variables de entorno (Netlify)

Configura estas variables en Netlify: Site settings > Environment variables

| Variable | Descripción |
|----------|-------------|
| `MONGODB_URI` | URI de conexión MongoDB |
| `PAYPAL_CLIENT_ID` | Client ID de la app de PayPal (Orders API v2) |
| `PAYPAL_CLIENT_SECRET` | Client Secret de la app de PayPal |
| `PAYPAL_WEBHOOK_ID` | Webhook ID de la app de PayPal (evento `CHECKOUT.ORDER.APPROVED`) |
| `PAYPAL_ENV` | `sandbox` para pruebas, `live` para cobros reales |
| `VITE_WHATSAPP_NUMBER` | Número de WhatsApp (con código de país, sin +) para el botón flotante — variable `VITE_`, se incrusta en el build: tras agregarla/cambiarla hay que forzar un nuevo deploy (no solo redeploy del build existente) |
| `GOOGLE_CALENDAR_ID` | ID del calendario de Google (fallback con Service Account, sin Meet) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email del Service Account (fallback) |
| `GOOGLE_PRIVATE_KEY` | Clave privada del JSON (con \n para saltos de línea) (fallback) |
| `GOOGLE_OAUTH_CLIENT_ID` | Client ID OAuth 2.0 (Google Cloud Console) para conectar la cuenta de la profesora y generar links de Meet |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Client Secret OAuth 2.0 |
| `SITE_URL` | URL pública del sitio (usada en correos y en el redirect de OAuth) |
| `CLASS_TIMEZONE` | Zona horaria de las clases (por defecto `America/Lima`) |
| `EMAIL_USER` / `EMAIL_PASSWORD` | Cuenta Gmail + app password para el envío de correos |
| `ADMIN_NOTIFY_EMAIL` | Correo admin por defecto (se puede sobreescribir desde Configuraciones) |

## Conexión con Google (Meet en las reservas)

1. En Google Cloud Console crea credenciales **OAuth 2.0 Client ID** (tipo Web) con redirect URI
   `https://tu-dominio/.netlify/functions/google-oauth-callback` (exactamente esa URL: https, sin barra
   final y sin parámetros) y habilita la **Google Calendar API**. El dominio debe ser el mismo configurado
   en `SITE_URL`.
2. Configura `GOOGLE_OAUTH_CLIENT_ID` y `GOOGLE_OAUTH_CLIENT_SECRET` en Netlify.
3. En **Panel admin > Configuraciones > Google Calendar y Meet** haz clic en "Conectar con Google" e inicia
   sesión con la cuenta de la profesora.

El refresh token se guarda en la colección `settings` y se renueva automáticamente en cada llamada, por lo
que la conexión no caduca (salvo que se revoque el acceso o la app OAuth esté en modo "Testing" en Google
Cloud, que expira a los 7 días: publícala en modo "Production"). Con la cuenta conectada, cada reserva crea
el evento en el calendario de esa cuenta con link de Google Meet e invita al estudiante; el link se guarda en
la reserva, se muestra en el portal del estudiante y en el calendario del admin, y se incluye en el correo de
confirmación y en el recordatorio de 30 minutos.

## Recordatorios automáticos

La función programada `send-class-reminders` corre cada 5 minutos (ver `netlify.toml`) y envía un correo a
cada estudiante ~30 minutos antes de su clase con el link de Meet. Marca `reminderSent` en la reserva para
no duplicar envíos.

## Configuración desde el panel

En **Panel admin > Configuraciones** ahora se puede ajustar sin tocar código:

- Precios de todos los paquetes y clases (la web y el cobro usan estos valores; el crédito de la clase de
  prueba equivale a su precio configurado).
- Anticipación mínima en horas para reservar una clase.
- Correo de administración al que llegan todas las notificaciones.
- Capacidad de clases grupales y enlaces de pago de Wise.

## Desarrollo local

```bash
npm run dev:netlify
```

Esto ejecuta Vite + Netlify Functions. Crea un archivo `.env` con las variables para pruebas locales.

## Confirmar pago manual (Wise, transferencia, efectivo)

Los pagos con PayPal se confirman solos (retorno del checkout + webhook). Los pagos manuales quedan como
reserva `pending` hasta que la profesora los confirma a mano desde **Panel admin > Reservas > Pagos
pendientes de confirmar**, tras verificar que el dinero llegó. Esa acción llama a `/api/confirm-payment`
autenticada con la sesión de admin (ya no usa un token separado).

## Códigos promocionales

La colección `promocodes` en MongoDB almacena códigos con su porcentaje de descuento (`code`, `discountPercent`).

Para inicializar el código `WELCOME` (20% de descuento):

**Opción 1 – Script local** (recomendado):
```bash
npm run seed:promocodes
```
Requiere `.env` con `MONGODB_URI`.

**Opción 2 – Endpoint** (con servidor corriendo):
```
https://tu-dominio.netlify.app/api/seed-promocodes
```
O en local: `http://localhost:8888/api/seed-promocodes` (GET o POST).

Ambos son idempotentes: pueden ejecutarse varias veces sin duplicar datos.

## Google Calendar

1. Crear Service Account en Google Cloud
2. Habilitar Google Calendar API
3. Compartir el calendario con el email del Service Account
4. Usar el Calendar ID en `GOOGLE_CALENDAR_ID`
