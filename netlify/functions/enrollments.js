import { getDb } from './_shared/mongodb.js'
import { requireAuth, jsonResponse, findOrCreateStudent } from './_shared/auth.js'
import { sendWelcomeCredentials } from './_shared/email.js'
import { logError } from './_shared/errorLog.js'
import { TRIAL_CREDIT_AMOUNT, findUnusedTrialCredit, markTrialCreditApplied } from './_shared/trialCredit.js'

async function getPromoDiscount(db, code) {
  if (!code?.trim()) return null
  return db.collection('promocodes').findOne({ code: code.trim().toUpperCase(), active: { $ne: false } })
}

async function listEnrollments(event, db) {
  const { user, error } = requireAuth(event)
  if (error) return error

  const params = event.queryStringParameters || {}
  const filter = {}
  if (user.role === 'admin') {
    if (params.userId) filter.userId = params.userId
  } else {
    filter.userId = user.id
  }

  const enrollments = await db.collection('enrollments').find(filter).sort({ createdAt: -1 }).toArray()
  return jsonResponse(200, { enrollments })
}

async function createEnrollment(event, db) {
  const { error } = requireAuth(event, ['admin'])
  if (error) return error

  const body = JSON.parse(event.body || '{}')
  const { studentEmail, studentName, serviceId, serviceTitle, totalClasses, price, promoCode, paymentMethod } = body

  if (!studentEmail?.trim() || !studentName?.trim() || !serviceId || !serviceTitle || !totalClasses || price === undefined) {
    return jsonResponse(400, {
      error: 'Faltan campos requeridos: studentEmail, studentName, serviceId, serviceTitle, totalClasses, price',
    })
  }
  if (Number(totalClasses) <= 0) {
    return jsonResponse(400, { error: 'totalClasses debe ser mayor que 0' })
  }
  const VALID_PAYMENT_METHODS = ['paypal', 'wise', 'cash', 'other']
  if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    return jsonResponse(400, { error: `paymentMethod debe ser uno de: ${VALID_PAYMENT_METHODS.join(', ')}` })
  }

  const { user: student, isNew: isNewAccount, tempPassword } = await findOrCreateStudent(db, {
    email: studentEmail,
    name: studentName,
  })
  if (student.role !== 'student') {
    return jsonResponse(400, { error: 'Ese email pertenece a una cuenta de administrador, no de estudiante' })
  }

  let finalPrice = Number(price)
  let appliedPromo = null
  if (promoCode?.trim()) {
    const promo = await getPromoDiscount(db, promoCode)
    if (!promo) return jsonResponse(400, { error: 'Código promocional no válido' })
    const discount = Number(promo.discountPercent) || 0
    finalPrice = Math.round(Number(price) * (1 - discount / 100) * 100) / 100
    appliedPromo = { code: promo.code, discountPercent: discount }
  }

  const studentUserId = String(student._id)
  let trialCredit = null
  if (serviceId !== 'trial') {
    trialCredit = await findUnusedTrialCredit(db, { userId: studentUserId })
    if (trialCredit) {
      finalPrice = Math.max(0, Math.round((finalPrice - TRIAL_CREDIT_AMOUNT) * 100) / 100)
    }
  }

  const enrollment = {
    userId: studentUserId,
    studentEmail: student.email,
    studentName: student.name,
    serviceId,
    serviceTitle,
    totalClasses: Number(totalClasses),
    classesUsed: 0,
    price: Number(price),
    finalPrice,
    appliedPromo,
    trialCreditApplied: Boolean(trialCredit),
    trialCreditAmount: trialCredit ? TRIAL_CREDIT_AMOUNT : 0,
    paymentMethod: paymentMethod || 'other',
    status: 'active',
    createdAt: new Date(),
    paidAt: new Date(),
  }

  const result = await db.collection('enrollments').insertOne(enrollment)
  enrollment._id = result.insertedId

  if (trialCredit) {
    await markTrialCreditApplied(db, trialCredit)
  }

  if (isNewAccount) {
    await sendWelcomeCredentials({ toName: student.name, toEmail: student.email, tempPassword })
  }

  return jsonResponse(201, { enrollment, accountCreated: isNewAccount })
}

export const handler = async (event) => {
  try {
    const db = await getDb()
    switch (event.httpMethod) {
      case 'GET':
        return await listEnrollments(event, db)
      case 'POST':
        return await createEnrollment(event, db)
      default:
        return jsonResponse(405, { error: 'Method not allowed' })
    }
  } catch (err) {
    console.error('enrollments error:', err)
    await logError('enrollments', err, { event })
    return jsonResponse(500, { error: 'Error al procesar la matrícula' })
  }
}
