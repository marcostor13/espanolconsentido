import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, AlertCircle, KeyRound, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import { homePathFor } from '../lib/homePath'

export default function ChangePasswordPage() {
  const { token, user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const isForced = Boolean(user?.mustChangePassword)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden')
      return
    }
    if (newPassword === currentPassword) {
      setError('La nueva contraseña debe ser distinta a la actual')
      return
    }

    setSubmitting(true)
    try {
      await apiFetch('auth-change-password', { method: 'POST', token, body: { currentPassword, newPassword } })
      await refreshUser()
      navigate(homePathFor({ ...user, mustChangePassword: false }), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-light font-grotesk px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex flex-col items-center mb-8">
          <img src="/logo2_nobg2.png" alt="Español con Sentido" className="h-16 w-auto object-contain" />
          <span className="-mt-1 text-[10px] font-grotesk font-semibold tracking-[0.35em] text-gray-400 uppercase">
            Comunica · Expresa · Siente
          </span>
        </Link>

        <div className="bg-white rounded-3xl shadow-soft-lg border border-gray-100 p-8">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-primary mb-5">
            <KeyRound size={22} />
          </div>
          <h1 className="font-syne font-bold text-2xl text-secondary mb-1">Cambia tu contraseña</h1>
          <p className="text-gray-500 text-sm mb-6">
            {isForced
              ? 'Por seguridad, debes establecer una contraseña nueva antes de continuar.'
              : 'Ingresa tu contraseña actual y elige una nueva.'}
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-secondary mb-2">
                {isForced ? 'Contraseña temporal (la que recibiste por correo)' : 'Contraseña actual'}
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-11 pr-3.5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-secondary mb-2">Nueva contraseña</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-11 pr-3.5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-secondary mb-2">Confirmar nueva contraseña</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-3.5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-bold shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />}
              Guardar y continuar
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6 flex items-center justify-center gap-4">
          {!isForced && (
            <button
              onClick={() => navigate(homePathFor(user), { replace: true })}
              className="hover:text-primary transition-colors"
            >
              Cancelar
            </button>
          )}
          <button onClick={logout} className="hover:text-primary transition-colors">
            Cerrar sesión
          </button>
        </p>
      </div>
    </div>
  )
}
