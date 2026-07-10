import nodemailer from 'nodemailer'

let cachedTransporter = null

function getTransporter() {
  const user = process.env.EMAIL_USER
  const pass = process.env.EMAIL_PASSWORD
  if (!user || !pass) return null

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    })
  }
  return cachedTransporter
}

// Gmail SMTP solo acepta como "from" la cuenta autenticada (EMAIL_USER) o un
// alias verificado en "Enviar correo como" dentro de esa cuenta de Gmail.
async function sendEmail({ to, subject, html }) {
  const transporter = getTransporter()
  if (!transporter) {
    console.warn('EMAIL_USER/EMAIL_PASSWORD no configurados. Se omite el envío de correo.')
    return { skipped: true }
  }

  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER

  try {
    await transporter.sendMail({
      from: `Español conSentido <${fromEmail}>`,
      to,
      subject,
      html,
    })
    return { sent: true }
  } catch (err) {
    console.error('SMTP send error:', err)
    return { sent: false, error: err.message }
  }
}

export async function sendBookingConfirmation({ toName, toEmail, adminEmail, bookingDetails }) {
  const notifyEmail = adminEmail || process.env.ADMIN_NOTIFY_EMAIL || 'marcostor13@gmail.com'
  const { date, time, serviceTitle, finalPrice, name, email, isPackage, totalClasses, meetLink } = bookingDetails
  const siteUrl = process.env.SITE_URL || 'https://espanolconsentido.com'

  const meetRow = meetLink
    ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Google Meet</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="${meetLink}" style="color: #f97316; font-weight: bold;">${meetLink}</a></td></tr>`
    : ''

  const scheduleRowAdmin = isPackage
    ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Clases</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${totalClasses} clase(s), por agendar desde el portal</td></tr>`
    : `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${date}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Hora</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${time}</td></tr>${meetRow}`

  await sendEmail({
    to: notifyEmail,
    subject: `📚 Nueva reserva confirmada: ${serviceTitle} - ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">¡Nueva reserva confirmada!</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Estudiante</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${email}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Servicio</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${serviceTitle}</td></tr>
          ${scheduleRowAdmin}
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Precio final</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #f97316; font-weight: bold;">€${finalPrice}</td></tr>
        </table>
        <p style="color: #666; font-size: 14px;">${isPackage ? 'El estudiante agendará sus clases desde el portal.' : 'El evento ya ha sido añadido a Google Calendar.'}</p>
      </div>
    `,
  })

  const paidRowStudent =
    finalPrice !== undefined && finalPrice !== null
      ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Total pagado</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #f97316; font-weight: bold;">$${finalPrice}</td></tr>`
      : ''

  const scheduleRowStudent = isPackage
    ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Clases incluidas</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${totalClasses}</td></tr>${paidRowStudent}`
    : `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${date}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Hora</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${time}</td></tr>${paidRowStudent}${meetRow}`

  await sendEmail({
    to: toEmail,
    subject: `✅ Reserva confirmada - Español conSentido`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">¡Hola ${toName}!</h2>
        <p>Tu reserva ha sido confirmada exitosamente.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Servicio</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${serviceTitle}</td></tr>
          ${scheduleRowStudent}
        </table>
        ${
          isPackage
            ? `<p style="color: #666; font-size: 14px;">Ya puedes agendar tus clases cuando quieras desde tu portal de estudiante.</p>
               <p style="margin-top: 16px;"><a href="${siteUrl}/portal/reservar" style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Agendar mis clases</a></p>`
            : meetLink
              ? `<p style="color: #666; font-size: 14px;">Únete a tu clase con el enlace de Google Meet de arriba. Te lo recordaremos también por correo 30 minutos antes de empezar.</p>`
              : `<p style="color: #666; font-size: 14px;">Te contactaremos pronto con los detalles de la sesión.</p>`
        }
        <p style="color: #666; font-size: 14px; margin-top: 16px;">¡Hasta pronto!<br/><strong>Juanita Sánchez</strong><br/>Español conSentido</p>
      </div>
    `,
  })

  return { sent: true }
}

export async function sendWelcomeCredentials({ toName, toEmail, tempPassword }) {
  const siteUrl = process.env.SITE_URL || 'https://espanolconsentido.com'

  await sendEmail({
    to: toEmail,
    subject: `🔑 Tu acceso a la plataforma - Español conSentido`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">¡Bienvenido/a, ${toName}!</h2>
        <p>Ya puedes gestionar tus clases, cursos y material desde la plataforma. Estos son tus datos de acceso:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${toEmail}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Contraseña temporal</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 16px;">${tempPassword}</td></tr>
        </table>
        <p style="color: #666; font-size: 14px;">Por seguridad, te pediremos crear una nueva contraseña la primera vez que inicies sesión.</p>
        <p style="margin-top: 24px;">
          <a href="${siteUrl}/login" style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Iniciar sesión</a>
        </p>
      </div>
    `,
  })

  return { sent: true }
}

// Recordatorio automático que se envía ~30 minutos antes de cada clase
// (función programada send-class-reminders). Incluye el link de Meet si existe.
export async function sendClassReminder({ toName, toEmail, booking }) {
  const meetSection = booking.meetLink
    ? `<p style="margin: 24px 0;">
         <a href="${booking.meetLink}" style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Unirme a la clase (Google Meet)</a>
       </p>
       <p style="color: #666; font-size: 13px;">O copia este enlace: <a href="${booking.meetLink}">${booking.meetLink}</a></p>`
    : `<p style="color: #666; font-size: 14px;">Tu profesora te compartirá el enlace de la videollamada.</p>`

  return sendEmail({
    to: toEmail,
    subject: `⏰ Tu clase empieza en 30 minutos - Español conSentido`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">¡Hola ${toName}!</h2>
        <p>Te recordamos que tu clase está por comenzar:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Clase</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.serviceTitle}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.date}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Hora</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.time}</td></tr>
        </table>
        ${meetSection}
        <p style="color: #666; font-size: 14px; margin-top: 16px;">¡Nos vemos pronto!<br/><strong>Juanita Sánchez</strong><br/>Español conSentido</p>
      </div>
    `,
  })
}

// Aviso al correo de administración cuando un estudiante reporta que pagó por
// Wise y adjunta su comprobante/link de pago, para que la admin lo verifique
// y confirme la reserva desde el panel.
export async function sendWisePaymentNotification({ adminEmail, booking, proof }) {
  const notifyEmail = adminEmail || process.env.ADMIN_NOTIFY_EMAIL || 'marcostor13@gmail.com'
  const siteUrl = process.env.SITE_URL || 'https://espanolconsentido.com'
  const proofRow = /^https?:\/\//i.test(proof)
    ? `<a href="${proof}" style="color: #f97316; font-weight: bold;">${proof}</a>`
    : proof

  return sendEmail({
    to: notifyEmail,
    subject: `💸 Pago por Wise reportado: ${booking.serviceTitle} - ${booking.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">Pago por Wise reportado</h2>
        <p>Un estudiante indica que ya realizó el pago por Wise. Verifica que el dinero llegó y confirma la reserva desde el panel de administración.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Estudiante</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.email}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Servicio</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.serviceTitle}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Monto</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #f97316; font-weight: bold;">$${booking.finalPrice}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Comprobante</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${proofRow || 'No adjuntó comprobante'}</td></tr>
        </table>
        <p style="margin-top: 24px;">
          <a href="${siteUrl}/admin/reservas" style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Revisar en el panel</a>
        </p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail({ toName, toEmail, tempPassword }) {
  const siteUrl = process.env.SITE_URL || 'https://espanolconsentido.com'

  await sendEmail({
    to: toEmail,
    subject: `🔑 Restablecimos tu contraseña - Español conSentido`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">Hola, ${toName}</h2>
        <p>Restablecimos la contraseña de tu cuenta. Estos son tus nuevos datos de acceso:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${toEmail}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Contraseña temporal</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 16px;">${tempPassword}</td></tr>
        </table>
        <p style="color: #666; font-size: 14px;">Por seguridad, te pediremos crear una nueva contraseña la próxima vez que inicies sesión.</p>
        <p style="color: #666; font-size: 14px;">Si no solicitaste este cambio, contáctanos de inmediato.</p>
        <p style="margin-top: 24px;">
          <a href="${siteUrl}/login" style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Iniciar sesión</a>
        </p>
      </div>
    `,
  })

  return { sent: true }
}
