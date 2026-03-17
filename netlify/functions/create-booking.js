import { getDb } from './_shared/mongodb.js'

function generateBookingId() {
  return 'b_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 11)
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { name, email, date, time, serviceId, serviceTitle, price, questions } = body

    if (!name?.trim() || !email?.trim() || !date || !time || !serviceId || !serviceTitle) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Faltan campos requeridos: name, email, date, time, serviceId, serviceTitle' }),
      }
    }

    const amount = Number(price) || 0

    const bookingId = generateBookingId()
    const db = await getDb()
    const collection = db.collection('bookings')

    const booking = {
      bookingId,
      name: name.trim(),
      email: email.trim(),
      date,
      time,
      serviceId,
      serviceTitle,
      price: amount,
      questions: questions || {},
      status: 'pending',
      createdAt: new Date(),
    }

    await collection.insertOne(booking)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        bookingId,
        message: 'Reserva registrada. Completa el pago en PayPal para confirmar.',
      }),
    }
  } catch (err) {
    console.error('create-booking error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Error al crear la reserva' }),
    }
  }
}
