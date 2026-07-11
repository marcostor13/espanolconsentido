// Datos de la cuenta bancaria de Global66 para transferencias manuales. Se
// muestran al estudiante en cuanto elige pagar por Global66 (no hay checkout
// automático); la profesora confirma el pago a mano tras verificarlo.
export const GLOBAL66_BANK_ACCOUNTS = [
  {
    currency: 'Dólares',
    fields: [
      ['Account Holder Name', 'Juanita Elizabeth Sanchez Mollo'],
      ['Account Number', '8339938093'],
      ['Account Type', 'Checking'],
      ['ACH Routing Number', '026073150'],
      ['Bank Name', 'Community Federal Savings Bank'],
      ['Bank Address', '5 Penn Plaza, 14th Floor, New York, NY 10001, US'],
    ],
  },
  {
    currency: 'Euros',
    fields: [
      ['Account Holder Name', 'Juanita Elizabeth Sanchez Mollo'],
      ['IBAN', 'GB14TCCL00997912437416'],
      ['Routing Number', 'TCCLGB31'],
      ['Bank Name', 'The Currency Cloud Limited'],
      ['Bank Address', '1 Sheldon Square, London, W2 6TT, United Kingdom'],
    ],
  },
]
