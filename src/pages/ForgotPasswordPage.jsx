import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, AlertCircle, CheckCircle, Loader2, KeyRound } from 'lucide-react'
import { apiFetch } from '../lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      const data = await apiFetch('auth-forgot-password', { method: 'POST', body: { email: email.trim() } })
      setSuccess(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary font-grotesk px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex flex-col items-center mb-8">
          <img src="/logo2_nobg2.png" alt="Español con Sentido" className="h-16 md:h-20 w-auto object-contain" />
          <span className="-mt-1 text-[10px] font-grotesk font-semibold tracking-[0.35em] text-white/60 uppercase">
            Comunica · Expresa · Siente
          </span>
        </Link>

        <div className="bg-white rounded-3xl shadow-soft-lg border border-gray-100 p-8">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-primary mb-5">
            <KeyRound size={22} />
          </div>
          <h1 className="font-syne font-bold text-2xl text-secondary mb-1">¿Olvidaste tu contraseña?</h1>
          <p className="text-gray-500 text-sm mb-6">
            Ingresa tu email y, si tienes una cuenta, te enviaremos una contraseña temporal.
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-start gap-2">
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-secondary mb-2">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-3.5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-white py-3.5 rounded-xl font-bold shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={18} className="animate-spin" />}
                Enviar instrucciones
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-white/60 mt-6">
          <Link to="/login" className="hover:text-primary transition-colors">
            ← Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
