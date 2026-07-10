import React, { useEffect, useState } from 'react'
import { GraduationCap, AlertCircle, CheckCircle, Loader2, ShoppingCart, X, Tag } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import { PACKAGES, withConfiguredPrices } from '../../lib/packages'

// Paquetes que el estudiante puede comprar desde el portal (los servicios de
// una sola clase con horario se compran desde la web pública, donde se elige
// la franja).
const PURCHASABLE_IDS = ['inicio', 'progreso', 'pro']

function PurchaseModal({ pkg, wiseLink, user, onClose }) {
  const [step, setStep] = useState('creating') // creating | pay | wise-sent
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState(null)
  const [paypalLoading, setPaypalLoading] = useState(false)
  const [wiseProof, setWiseProof] = useState('')
  const [wiseProofSending, setWiseProofSending] = useState(false)
  const [wiseChosen, setWiseChosen] = useState(false)
  const [promoInput, setPromoInput] = useState('')
  const [applyingPromo, setApplyingPromo] = useState(false)
  const [promoError, setPromoError] = useState(null)

  // Registra (o vuelve a registrar) la compra pendiente con el código de
  // descuento indicado: el precio final —con el promo y/o el crédito de la
  // clase de prueba— lo calcula siempre el servidor y se muestra antes de
  // elegir el método de pago. Devuelve el error para poder mostrarlo.
  const createBooking = async (promoCode) => {
    const res = await fetch('/api/create-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: user.name,
        email: user.email,
        serviceId: pkg.id,
        serviceTitle: pkg.title,
        promoCode: promoCode?.trim() || undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al iniciar la compra')
    return data
  }

  useEffect(() => {
    let cancelled = false
    createBooking()
      .then((data) => {
        if (cancelled) return
        setBooking(data)
        setStep('pay')
      })
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
    // Solo al abrir el modal; los cambios de promo se manejan aparte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkg, user])

  const handleApplyPromo = async () => {
    setApplyingPromo(true)
    setPromoError(null)
    try {
      const data = await createBooking(promoInput)
      setBooking(data)
    } catch (err) {
      setPromoError(err.message)
    } finally {
      setApplyingPromo(false)
    }
  }

  const handlePayPal = async () => {
    setPaypalLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/create-paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.bookingId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al iniciar el pago con PayPal')
      window.location.href = data.approveUrl
    } catch (err) {
      setError(err.message)
      setPaypalLoading(false)
    }
  }

  const handleSubmitWiseProof = async () => {
    setWiseProofSending(true)
    setError(null)
    try {
      const res = await fetch('/api/submit-wise-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.bookingId, proof: wiseProof.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar el comprobante')
      setStep('wise-sent')
    } catch (err) {
      setError(err.message)
    } finally {
      setWiseProofSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/60 backdrop-blur-sm p-4 font-grotesk overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden my-8">
        <div className="p-6 pb-0 flex items-start justify-between">
          <div>
            <h2 className="font-syne font-bold text-xl text-secondary">Comprar {pkg.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{pkg.totalClasses} clase(s)</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-primary transition-colors bg-gray-50 hover:bg-orange-50 rounded-full p-2"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'creating' && !error && (
            <div className="flex items-center justify-center gap-2 text-gray-400 py-10">
              <Loader2 size={20} className="animate-spin" /> Preparando tu compra...
            </div>
          )}

          {step === 'pay' && booking && (
            <>
              <div className="bg-gray-50 rounded-2xl p-4 mb-5 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">{pkg.title}</span>
                  <span className="font-bold text-secondary">${booking.originalPrice}</span>
                </div>
                {booking.appliedPromo && (
                  <div className="flex justify-between text-green-600 mb-1">
                    <span>
                      Descuento ({booking.appliedPromo.code} -{booking.appliedPromo.discountPercent}%)
                    </span>
                    <span>-${((booking.originalPrice * booking.appliedPromo.discountPercent) / 100).toFixed(2)}</span>
                  </div>
                )}
                {booking.trialCreditApplied && (
                  <div className="flex justify-between text-green-600 mb-1">
                    <span>Crédito por tu clase de prueba</span>
                    <span>-${booking.trialCreditAmount}</span>
                  </div>
                )}
                <div className="h-px bg-gray-200 my-2" />
                <div className="flex justify-between text-base">
                  <span className="font-bold text-secondary">Total</span>
                  <span className="font-bold text-primary">${booking.finalPrice?.toFixed?.(2) ?? booking.finalPrice}</span>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-bold text-secondary mb-2 flex items-center gap-1.5">
                  <Tag size={14} className="text-primary" /> Código de descuento
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Escribe tu código"
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary outline-none text-secondary text-sm uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={applyingPromo}
                    className="px-4 py-3 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-orange-50 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {applyingPromo && <Loader2 size={14} className="animate-spin" />}
                    Aplicar
                  </button>
                </div>
                {promoError && <p className="text-xs text-red-600 mt-1.5">{promoError}</p>}
                {booking.appliedPromo && !promoError && (
                  <p className="text-xs text-green-600 mt-1.5">Código {booking.appliedPromo.code} aplicado.</p>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handlePayPal}
                  disabled={paypalLoading}
                  className="w-full bg-[#0070BA] text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {paypalLoading && <Loader2 size={16} className="animate-spin" />}
                  Pagar con PayPal
                </button>

                {wiseLink && !wiseChosen && (
                  <a
                    href={wiseLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setWiseChosen(true)}
                    className="w-full bg-[#9FE870] text-secondary py-3.5 rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center"
                  >
                    Pagar con Wise
                  </a>
                )}

                {wiseChosen && (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-3">
                      Cuando completes la transferencia en Wise, pega aquí el enlace o la referencia de tu pago para
                      que tu profesora lo verifique y active tu curso.
                    </p>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={wiseProof}
                        onChange={(e) => setWiseProof(e.target.value)}
                        placeholder="Enlace o referencia de tu pago"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-primary outline-none text-secondary text-sm"
                      />
                      <button
                        onClick={handleSubmitWiseProof}
                        disabled={wiseProofSending || !wiseProof.trim()}
                        className="bg-primary text-white py-3 rounded-xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                      >
                        {wiseProofSending && <Loader2 size={14} className="animate-spin" />}
                        Enviar comprobante
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 'wise-sent' && (
            <div className="text-center py-6">
              <CheckCircle size={40} className="text-green-600 mx-auto mb-3" />
              <p className="font-bold text-secondary mb-1">¡Comprobante recibido!</p>
              <p className="text-sm text-gray-500">
                Tu curso se activará en cuanto verifiquemos el pago. Te avisaremos por correo.
              </p>
              <button
                onClick={onClose}
                className="mt-5 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm"
              >
                Entendido
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NewPurchaseSection({ user }) {
  const { token } = useAuth()
  const [packages, setPackages] = useState(withConfiguredPrices(PACKAGES, null).filter((p) => PURCHASABLE_IDS.includes(p.id)))
  const [wiseLinks, setWiseLinks] = useState({})
  const [buyingPkg, setBuyingPkg] = useState(null)

  useEffect(() => {
    apiFetch('settings', { token })
      .then((data) => {
        setPackages(
          withConfiguredPrices(PACKAGES, data.settings?.packagePrices).filter((p) => PURCHASABLE_IDS.includes(p.id)),
        )
        setWiseLinks(data.settings?.wiseLinks || {})
      })
      .catch(() => {})
  }, [token])

  return (
    <div className="mt-10">
      <h2 className="font-syne font-bold text-xl text-secondary mb-1">Nueva compra</h2>
      <p className="text-sm text-gray-500 mb-5">
        Compra otro paquete de clases sin salir de tu portal. Si tienes una clase de prueba pagada sin usar como
        descuento, se aplicará automáticamente.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        {packages.map((p) => (
          <div key={p.id} className="bg-white rounded-3xl shadow-soft border border-gray-100 p-5 flex flex-col">
            <h3 className="font-syne font-bold text-lg text-secondary">{p.title}</h3>
            <p className="text-sm text-gray-500 mb-3">{p.totalClasses} clases</p>
            <p className="font-grotesk font-bold text-3xl text-secondary mb-4">${p.price}</p>
            <button
              onClick={() => setBuyingPkg(p)}
              className="mt-auto flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-soft hover:shadow-soft-lg transition-all"
            >
              <ShoppingCart size={16} />
              Comprar
            </button>
          </div>
        ))}
      </div>

      {buyingPkg && (
        <PurchaseModal
          pkg={buyingPkg}
          wiseLink={wiseLinks[buyingPkg.id]}
          user={user}
          onClose={() => setBuyingPkg(null)}
        />
      )}
    </div>
  )
}

export default function MisCursosPage() {
  const { token, user } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiFetch('enrollments', { token })
      .then((data) => setEnrollments(data.enrollments || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Mis cursos</h1>
      <p className="text-gray-500 mb-8">Los paquetes de clases que has comprado.</p>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : enrollments.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-10 text-center">
          <p className="text-gray-500">Aún no tienes cursos comprados. Puedes comprar tu primer paquete aquí abajo.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {enrollments.map((e) => {
            const remaining = e.totalClasses - e.classesUsed
            const pct = Math.round((e.classesUsed / e.totalClasses) * 100)
            return (
              <div key={e._id} className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-primary">
                    <GraduationCap size={22} />
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      e.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {e.status === 'active' ? 'Activo' : 'Finalizado'}
                  </span>
                </div>
                <h3 className="font-syne font-bold text-xl text-secondary mb-1">{e.serviceTitle}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  ${e.finalPrice}
                  {e.appliedPromo && <span className="ml-1 text-green-600">({e.appliedPromo.code})</span>}
                  {e.trialCreditApplied && (
                    <span className="ml-1 text-green-600">(-${e.trialCreditAmount} clase de prueba)</span>
                  )}
                </p>

                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-sm font-bold text-secondary">
                  Has usado {e.classesUsed} de {e.totalClasses} clases · {remaining} disponible(s)
                </p>
              </div>
            )
          })}
        </div>
      )}

      <NewPurchaseSection user={user} />
    </div>
  )
}
