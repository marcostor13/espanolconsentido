import React, { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { homePathFor } from '../lib/homePath'

export default function LoginPage() {
  const { user, token, loading: authLoading, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (!authLoading && token && user) {
    const from = !user.mustChangePassword && location.state?.from?.pathname
    return <Navigate to={from || homePathFor(user)} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const loggedUser = mode === 'login' ? await login(email, password) : await register(name, email, password)
      navigate(homePathFor(loggedUser), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-light font-grotesk px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center mb-8">
          <img
            src="/logo2_nobg2.png"
            alt="Español con Sentido"
            className="h-16 w-auto object-contain"
          />
        </Link>

        <div className="bg-white rounded-3xl shadow-soft-lg border border-gray-100 p-8">
          <div className="flex bg-gray-50 rounded-xl p-1 mb-8">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError(null)
              }}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${
                mode === 'login' ? 'bg-white shadow-sm text-secondary' : 'text-gray-500'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setError(null)
              }}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${
                mode === 'register' ? 'bg-white shadow-sm text-secondary' : 'text-gray-500'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          <h1 className="font-syne font-bold text-2xl text-secondary mb-1">
            {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta de estudiante'}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {mode === 'login'
              ? 'Accede a tus clases, cursos y material.'
              : 'Regístrate para reservar tus clases y ver tu material.'}
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-bold text-secondary mb-2">Nombre</label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-3.5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary"
                    placeholder="Tu nombre completo"
                  />
                </div>
              </div>
            )}

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

            <div>
              <label className="block text-sm font-bold text-secondary mb-2">Contraseña</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-3.5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-bold shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />}
              {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/" className="hover:text-primary transition-colors">
            ← Volver al sitio
          </Link>
        </p>
      </div>
    </div>
  )
}
