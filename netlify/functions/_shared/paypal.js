const PAYPAL_API_BASE = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  live: 'https://api-m.paypal.com',
}

function getBaseUrl() {
  const env = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase()
  return PAYPAL_API_BASE[env] || PAYPAL_API_BASE.sandbox
}

function assertConfigured() {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal no está configurado en el servidor')
  }
}

function getHeader(headers, name) {
  const key = Object.keys(headers || {}).find((k) => k.toLowerCase() === name.toLowerCase())
  return key ? headers[key] : undefined
}

let cachedToken = null
let cachedTokenExpiry = 0

export async function getPayPalAccessToken() {
  assertConfigured()
  if (cachedToken && Date.now() < cachedTokenExpiry) return cachedToken

  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')
  const res = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Error al autenticar con PayPal: ${err}`)
  }

  const data = await res.json()
  cachedToken = data.access_token
  cachedTokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken
}

export async function createPayPalOrder({ amount, currency = 'USD', description, referenceId, returnUrl, cancelUrl }) {
  const token = await getPayPalAccessToken()
  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: referenceId,
          description,
          amount: { currency_code: currency, value: amount.toFixed(2) },
        },
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
      },
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Error al crear la orden de PayPal: ${JSON.stringify(data)}`)
  }

  const approveUrl = data.links?.find((l) => l.rel === 'approve')?.href
  return { orderId: data.id, approveUrl }
}

export async function capturePayPalOrder(orderId) {
  const token = await getPayPalAccessToken()
  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const data = await res.json()
  if (!res.ok) {
    // Reintentar capturar una orden ya capturada no debe tratarse como error fatal.
    if (data?.details?.some((d) => d.issue === 'ORDER_ALREADY_CAPTURED')) {
      return { alreadyCaptured: true, data }
    }
    throw new Error(`Error al capturar el pago de PayPal: ${JSON.stringify(data)}`)
  }

  return { alreadyCaptured: false, data }
}

export async function verifyPayPalWebhookSignature({ headers, rawBody }) {
  assertConfigured()
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) throw new Error('PAYPAL_WEBHOOK_ID no está configurado')

  const token = await getPayPalAccessToken()
  const res = await fetch(`${getBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: getHeader(headers, 'paypal-auth-algo'),
      cert_url: getHeader(headers, 'paypal-cert-url'),
      transmission_id: getHeader(headers, 'paypal-transmission-id'),
      transmission_sig: getHeader(headers, 'paypal-transmission-sig'),
      transmission_time: getHeader(headers, 'paypal-transmission-time'),
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  })

  if (!res.ok) return false
  const data = await res.json()
  return data.verification_status === 'SUCCESS'
}
