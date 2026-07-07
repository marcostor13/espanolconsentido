// El valor de la clase de prueba ($10) se descuenta una única vez del primer
// paquete de clases que compre el estudiante, si ya pagó una clase de prueba
// y todavía no se le aplicó el descuento. Usado tanto cuando el admin crea
// una matrícula manualmente (enrollments.js) como cuando el propio estudiante
// compra un paquete desde el landing (bookingConfirmation.js).
export const TRIAL_CREDIT_AMOUNT = 10

function emailMatch(email) {
  const escaped = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped}$`, 'i')
}

// Busca por userId cuando ya existe cuenta (matrícula creada por el admin, o
// confirmación de pago donde findOrCreateStudent ya corrió); si no hay
// userId todavía (por ejemplo, al calcular el precio antes de pagar) se
// busca por email.
export async function findUnusedTrialCredit(db, { userId, email } = {}) {
  const bookingsCol = db.collection('bookings')
  const enrollmentsCol = db.collection('enrollments')

  const identityFilter = userId ? { userId } : email ? { email: emailMatch(email) } : null
  if (!identityFilter) return null

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
