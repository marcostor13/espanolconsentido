export const PAYMENT_METHODS = [
  { id: 'paypal', label: 'PayPal' },
  { id: 'wise', label: 'Wise' },
  { id: 'stripe', label: 'Stripe' },
  { id: 'cash', label: 'Efectivo' },
  { id: 'other', label: 'Otro' },
]

export const PAYMENT_METHOD_LABEL = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.id, m.label]))
