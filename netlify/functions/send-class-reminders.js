import { getDb } from './_shared/mongodb.js'
import { sendClassReminder } from './_shared/email.js'
import { getEventMeetLink } from './_shared/google-calendar.js'
import { minutesUntilClass, todayDateKey } from './_shared/time.js'
import { logError } from './_shared/errorLog.js'

// Función programada (cada 5 minutos, ver netlify.toml): envía a cada
// estudiante un recordatorio por correo ~30 minutos antes de su clase, con el
// link de Google Meet si la reserva lo tiene.
const REMINDER_WINDOW_MIN = 35

export const handler = async () => {
  try {
    const db = await getDb()
    const bookingsCol = db.collection('bookings')

    // Solo miramos las reservas de hoy (en la zona horaria de las clases):
    // la ventana de aviso es de minutos, nunca cruza más de un día.
    const today = todayDateKey()
    const candidates = await bookingsCol
      .find({
        status: 'paid',
        date: today,
        time: { $exists: true, $ne: null },
        reminderSent: { $ne: true },
      })
      .toArray()

    let sent = 0
    for (const booking of candidates) {
      const toEmail = booking.userEmail || booking.email
      if (!toEmail) continue
      const minutes = minutesUntilClass(booking.date, booking.time)
      if (minutes <= 0 || minutes > REMINDER_WINDOW_MIN) continue

      // Claim atómico: si dos ejecuciones se pisan, solo una envía el correo.
      const claim = await bookingsCol.updateOne(
        { _id: booking._id, reminderSent: { $ne: true } },
        { $set: { reminderSent: true, reminderSentAt: new Date() } },
      )
      if (claim.modifiedCount !== 1) continue

      // Respaldo: si la reserva no guardó el link de Meet en su momento (la
      // sala se crea de forma asíncrona y a veces no llega al confirmar el
      // pago), lo recuperamos desde el evento del calendario y lo guardamos,
      // para que el recordatorio sí lo incluya.
      if (!booking.meetLink && booking.calendarEventId) {
        try {
          const meetLink = await getEventMeetLink(db, booking.calendarEventId)
          if (meetLink) {
            booking.meetLink = meetLink
            await bookingsCol.updateOne({ _id: booking._id }, { $set: { meetLink } })
          }
        } catch (err) {
          console.error('send-class-reminders: failed to recover meet link', booking.bookingId, err)
          await logError('send-class-reminders: recover meet link', err, { level: 'warning' })
        }
      }

      try {
        await sendClassReminder({
          toName: booking.userName || booking.name || 'estudiante',
          toEmail,
          booking,
        })
        sent++
      } catch (err) {
        console.error('send-class-reminders: failed for booking', booking.bookingId, err)
        // Liberar el flag para reintentar en la próxima corrida.
        await bookingsCol.updateOne({ _id: booking._id }, { $set: { reminderSent: false } })
        await logError('send-class-reminders: send email', err, { level: 'warning' })
      }
    }

    console.log(`send-class-reminders: ${sent} recordatorio(s) enviado(s) de ${candidates.length} candidato(s)`)
    return { statusCode: 200, body: JSON.stringify({ sent }) }
  } catch (err) {
    console.error('send-class-reminders error:', err)
    await logError('send-class-reminders', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Error al enviar recordatorios' }) }
  }
}
