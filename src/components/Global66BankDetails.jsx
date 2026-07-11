import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { GLOBAL66_BANK_ACCOUNTS } from '../lib/global66'

// Datos de cuenta para transferir por Global66. Se muestran en cuanto el
// estudiante elige este método (no hay checkout automático); cada bloque
// tiene un botón para copiar todos los datos de una vez.
export default function Global66BankDetails() {
  const [copiedCurrency, setCopiedCurrency] = useState(null)

  const handleCopy = (account) => {
    const text = account.fields.map(([label, value]) => `${label}: ${value}`).join('\n')
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopiedCurrency(account.currency)
        setTimeout(() => setCopiedCurrency((c) => (c === account.currency ? null : c)), 2000)
      })
      .catch(() => {})
  }

  return (
    <div className="space-y-3">
      {GLOBAL66_BANK_ACCOUNTS.map((account) => (
        <div key={account.currency} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <h6 className="font-bold text-secondary text-sm uppercase">{account.currency}</h6>
            <button
              type="button"
              onClick={() => handleCopy(account)}
              className="flex items-center gap-1 text-xs font-bold text-primary hover:text-orange-600 transition"
            >
              {copiedCurrency === account.currency ? (
                <>
                  <Check size={13} /> Copiado
                </>
              ) : (
                <>
                  <Copy size={13} /> Copiar datos
                </>
              )}
            </button>
          </div>
          <dl className="space-y-1">
            {account.fields.map(([label, value]) => (
              <div key={label} className="flex flex-col sm:flex-row sm:justify-between sm:gap-3 text-xs">
                <dt className="text-gray-500 shrink-0">{label}</dt>
                <dd className="text-secondary font-medium break-all sm:text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )
}
