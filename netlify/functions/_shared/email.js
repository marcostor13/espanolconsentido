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

export async function sendBookingConfirmation({ toName, toEmail, bookingDetails }) {
  const notifyEmail = process.env.ADMIN_NOTIFY_EMAIL || 'marcostor13@gmail.com'
  const { date, time, serviceTitle, finalPrice, name, email } = bookingDetails

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
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${date}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Hora</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${time}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Precio final</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #f97316; font-weight: bold;">€${finalPrice}</td></tr>
        </table>
        <p style="color: #666; font-size: 14px;">El evento ya ha sido añadido a Google Calendar.</p>
      </div>
    `,
  })

  await sendEmail({
    to: toEmail,
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
