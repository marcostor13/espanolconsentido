export async function sendBookingConfirmation({ toName, toEmail, bookingDetails }) {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.EMAIL_FROM || 'no-reply@espanolconsentido.com'
  const notifyEmail = process.env.ADMIN_NOTIFY_EMAIL || 'marcostor13@gmail.com'

  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured. Skipping email notification.')
    return { skipped: true }
  }

  const { date, time, serviceTitle, finalPrice, name, email } = bookingDetails

  // Email to the admin/owner
  const adminEmailPayload = {
    from: `Español conSentido <${fromEmail}>`,
    to: [notifyEmail],
    subject: `📚 Nueva reserva confirmada: ${serviceTitle} - ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">¡Nueva reserva confirmada!</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Estudiante</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${email}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Servicio</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${serviceTitle}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${date}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Hora</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${time}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Precio final</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #f97316; font-weight: bold;">€${finalPrice}</td></tr>
        </table>
        <p style="color: #666; font-size: 14px;">El evento ya ha sido añadido a Google Calendar.</p>
      </div>
    `,
  }

  // Optional: confirmation email to the student
  const studentEmailPayload = {
    from: `Español conSentido <${fromEmail}>`,
    to: [email],
    subject: `✅ Reserva confirmada - Español conSentido`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">¡Hola ${toName}!</h2>
        <p>Tu reserva ha sido confirmada exitosamente.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Servicio</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${serviceTitle}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${date}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Hora</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${time}</td></tr>
        </table>
        <p style="color: #666; font-size: 14px;">Te contactaremos pronto con los detalles de la sesión.</p>
        <p style="color: #666; font-size: 14px;">¡Hasta pronto!<br/><strong>Juanita Sánchez</strong><br/>Español conSentido</p>
      </div>
    `,
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(adminEmailPayload),
  })

  if (!res.ok) {
    const err = await res.json()
    console.error('Resend admin email error:', err)
  }

  // Send student email separately
  const res2 = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(studentEmailPayload),
  })

  if (!res2.ok) {
    const err = await res2.json()
    console.error('Resend student email error:', err)
  }

  return { sent: true }
}
