# Configuración del sistema de reservas

## Variables de entorno (Netlify)

Configura estas variables en Netlify: Site settings > Environment variables

| Variable | Descripción |
|----------|-------------|
| `MONGODB_URI` | URI de conexión MongoDB |
| `VITE_PAYPAL_ME_USERNAME` | Usuario de PayPal.me para el link (ej. `juanita`) |
| `VITE_WHATSAPP_NUMBER` | Número de WhatsApp (con código de país, sin +) para el botón flotante |
| `GOOGLE_CALENDAR_ID` | ID del calendario de Google |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email del Service Account |
| `GOOGLE_PRIVATE_KEY` | Clave privada del JSON (con \n para saltos de línea) |

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
