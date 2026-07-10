// El valor de la clase de prueba se descuenta una única vez del primer
// paquete de clases que compre el estudiante, si ya pagó una clase de prueba
// y todavía no se le aplicó el descuento. El monto ya no es fijo: equivale al
// precio configurado de la clase de prueba (getTrialCreditAmount en
// _shared/settings.js). Usado tanto cuando el admin crea una matrícula
// manualmente (enrollments.js) como cuando el propio estudiante compra un
// paquete desde el landing (create-booking.js / bookingConfirmation.js).

function emailMatch(email) {
  const escaped = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped}$`, 'i')
}

// Busca por userId y/o email (combinados con $or si vienen ambos). El email
// importa incluso cuando existe cuenta: la clase de prueba comprada desde el
// landing ya no crea cuenta, así que esa reserva solo tiene email y se debe
// encontrar igual cuando el estudiante (ya con cuenta) compre su paquete.
export async function findUnusedTrialCredit(db, { userId, email } = {}) {
  const bookingsCol = db.collection('bookings')
  const enrollmentsCol = db.collection('enrollments')

  const identities = []
  if (userId) identities.push({ userId })
  if (email?.trim()) identities.push({ email: emailMatch(email) })
  if (identities.length === 0) return null
  const identityFilter = identities.length === 1 ? identities[0] : { $or: identities }

  const trialBooking = await bookingsCol.findOne({
    ...identityFilter,
    serviceId: 'trial',
    status: { $in: ['paid', 'completed'] },
    trialCreditApplied: { $ne: true },
  })
  if (trialBooking) return { collection: 'bookings', id: trialBooking._id }

  if (userId) {
    const trialEnrollment = await enrollmentsCol.findOne({
      userId,
      serviceId: 'trial',
      trialCreditApplied: { $ne: true },
    })
    if (trialEnrollment) return { collection: 'enrollments', id: trialEnrollment._id }
  }

  return null
}

export async function markTrialCreditApplied(db, trialCredit) {
  // Filtro guardado para que, si dos compras concurrentes intentaran usar la
  // misma clase de prueba, solo la primera la marque como consumida.
  await db
    .collection(trialCredit.collection)
    .updateOne({ _id: trialCredit.id, trialCreditApplied: { $ne: true } }, { $set: { trialCreditApplied: true } })
}
