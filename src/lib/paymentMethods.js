export const PAYMENT_METHODS = [
  { id: 'paypal', label: 'PayPal' },
  { id: 'wise', label: 'Wise' },
  { id: 'global66', label: 'Global66' },
  { id: 'cash', label: 'Efectivo' },
  { id: 'other', label: 'Otro' },
]

// Métodos que son transferencias manuales (no automáticas): el estudiante
// puede adjuntar un comprobante y la admin confirma el pago a mano.
export const TRANSFER_PAYMENT_METHOD_IDS = ['wise', 'global66']

export const PAYMENT_METHOD_LABEL = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.id, m.label]))
